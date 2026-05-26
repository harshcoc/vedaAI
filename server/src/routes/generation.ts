import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import { Assignment } from '../models/Assignment';
import { GeneratedPaper } from '../models/GeneratedPaper';
import { getGenerationQueue } from '../queues/generationQueue';
import { processGenerationJob } from '../queues/generationWorker';
import { cacheService } from '../services/cacheService';
import { generatePDF } from '../services/pdfGenerator';
import { getPresignedUrl, uploadToR2, generatePdfKey } from '../services/storageService';
import { getIO } from '../socket/socketManager';

const router = Router();

/**
 * POST /api/assignments/:id/generate - Trigger AI generation
 */
router.post(
  '/assignments/:id/generate',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId!;
      const assignmentId = req.params.id as string;

      const assignment = await Assignment.findById(assignmentId);

      if (!assignment) {
        res.status(404).json({ error: 'Assignment not found' });
        return;
      }

      if (assignment.userId !== userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const queue = getGenerationQueue();

      if (queue) {
        // Redis available — use BullMQ queue
        const job = await queue.add(
          'generate-paper' as any,
          { assignmentId, userId },
          {
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 },
            removeOnComplete: 100,
            removeOnFail: 50,
          }
        );

        assignment.status = 'generating';
        assignment.generationJobId = job.id;
        await assignment.save();
        await cacheService.invalidateAssignmentList(userId);

        res.json({
          data: {
            jobId: job.id,
            status: 'queued',
            message: 'Generation job queued successfully',
          },
        });
      } else {
        // No Redis — process synchronously
        res.json({
          data: {
            jobId: 'sync',
            status: 'processing',
            message: 'Generation started (synchronous mode)',
          },
        });

        let io;
        try { io = getIO(); } catch { io = undefined; }

        processGenerationJob(assignmentId, userId, io).catch(async (err) => {
          console.error('❌ Synchronous generation failed:', err);
          await Assignment.findByIdAndUpdate(assignmentId, { status: 'failed' });
          if (io) {
            io.to(`user:${userId}`).emit('generation:failed', {
              assignmentId,
              status: 'failed',
              error: err instanceof Error ? err.message : 'Unknown error',
            });
          }
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/assignments/:id/paper - Get generated paper
 */
router.get(
  '/assignments/:id/paper',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId!;
      const assignmentId = req.params.id as string;

      const assignment = await Assignment.findById(assignmentId).lean();
      if (!assignment || assignment.userId !== userId) {
        res.status(404).json({ error: 'Assignment not found' });
        return;
      }

      // Check cache
      const cached = await cacheService.getGeneratedPaper(assignmentId);
      if (cached) {
        res.json({ data: cached });
        return;
      }

      const paper = await GeneratedPaper.findOne({ assignmentId }).lean();
      if (!paper) {
        res.status(404).json({ error: 'Generated paper not found' });
        return;
      }

      await cacheService.setGeneratedPaper(assignmentId, paper);
      res.json({ data: paper });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/assignments/:id/paper/pdf - Download PDF
 */
router.get(
  '/assignments/:id/paper/pdf',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId!;
      const assignmentId = req.params.id as string;

      const assignment = await Assignment.findById(assignmentId).lean();
      if (!assignment || assignment.userId !== userId) {
        res.status(404).json({ error: 'Assignment not found' });
        return;
      }

      const paper = await GeneratedPaper.findOne({ assignmentId }).lean();
      if (!paper) {
        res.status(404).json({ error: 'Generated paper not found' });
        return;
      }

      // If PDF is already in R2, return presigned URL
      if (paper.pdfUrl) {
        try {
          const url = await getPresignedUrl(paper.pdfUrl);
          res.json({ data: { downloadUrl: url } });
          return;
        } catch (err) {
          console.warn('Could not get presigned URL, generating on the fly:', err);
        }
      }

      // Generate PDF on the fly, upload to R2, return URL
      const pdfBuffer = await generatePDF(paper, assignment.title);
      const pdfKey = generatePdfKey(assignmentId);

      await uploadToR2(pdfBuffer, pdfKey, 'application/pdf');

      // Update the paper with the PDF key
      await GeneratedPaper.findByIdAndUpdate(paper._id, { pdfUrl: pdfKey });

      const url = await getPresignedUrl(pdfKey);
      res.json({ data: { downloadUrl: url } });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
