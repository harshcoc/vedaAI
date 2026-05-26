import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { Assignment } from '../models/Assignment';
import { GeneratedPaper } from '../models/GeneratedPaper';
import { extractTextFromBuffer } from '../services/pdfParser';
import { uploadToR2, deleteFromR2, generateFileKey } from '../services/storageService';
import { cacheService } from '../services/cacheService';
import { z } from 'zod';
import path from 'path';

const router = Router();

// Validation schema
const questionTypeSchema = z.object({
  type: z.string().min(1),
  count: z.number().int().min(1),
  marksPerQuestion: z.number().int().min(1),
});

/**
 * POST /api/assignments - Create a new assignment
 */
router.post(
  '/',
  authMiddleware,
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId!;
      const file = req.file;

      if (!file) {
        res.status(400).json({ error: 'File is required' });
        return;
      }

      // Parse question types from string (multipart form sends as string)
      let questionTypes;
      try {
        questionTypes = JSON.parse(req.body.questionTypes);
        // Validate
        z.array(questionTypeSchema).parse(questionTypes);
      } catch {
        res.status(400).json({ error: 'Invalid question types format' });
        return;
      }

      const title = req.body.title;
      const dueDate = req.body.dueDate;
      const additionalInstructions = req.body.additionalInstructions || '';
      const totalQuestions = parseInt(req.body.totalQuestions, 10);
      const totalMarks = parseInt(req.body.totalMarks, 10);

      if (!title || !dueDate) {
        res.status(400).json({ error: 'Title and due date are required' });
        return;
      }

      // Upload file to R2
      const ext = path.extname(file.originalname).toLowerCase();
      const r2Key = generateFileKey(file.originalname);

      try {
        await uploadToR2(file.buffer, r2Key, file.mimetype);
      } catch (err) {
        console.error('Failed to upload to R2:', err);
        res.status(500).json({ error: 'Failed to upload file' });
        return;
      }

      // Extract text from uploaded file buffer
      let fileContent = '';
      try {
        fileContent = await extractTextFromBuffer(file.buffer, ext);
      } catch (err) {
        console.warn('Could not extract text from file:', err);
      }

      const assignment = await Assignment.create({
        userId,
        title,
        fileUrl: r2Key, // Store R2 key instead of local path
        fileContent,
        dueDate: new Date(dueDate),
        questionTypes,
        additionalInstructions,
        totalQuestions,
        totalMarks,
        status: 'draft',
      });

      // Invalidate list cache
      await cacheService.invalidateAssignmentList(userId);

      res.status(201).json({ data: assignment });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/assignments - Get all assignments for the authenticated user
 */
router.get(
  '/',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId!;

      // Check cache first
      const cached = await cacheService.getAssignmentList(userId);
      if (cached) {
        res.json({ data: cached });
        return;
      }

      const assignments = await Assignment.find({ userId })
        .sort({ createdAt: -1 })
        .lean();

      // Cache the result
      await cacheService.setAssignmentList(userId, assignments);

      res.json({ data: assignments });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/assignments/:id - Get a single assignment
 */
router.get(
  '/:id',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId!;
      const id = req.params.id as string;
      const assignment = await Assignment.findById(id).lean();

      if (!assignment) {
        res.status(404).json({ error: 'Assignment not found' });
        return;
      }

      if (assignment.userId !== userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      res.json({ data: assignment });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/assignments/:id - Delete an assignment
 */
router.delete(
  '/:id',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId!;
      const id = req.params.id as string;
      const assignment = await Assignment.findById(id);

      if (!assignment) {
        res.status(404).json({ error: 'Assignment not found' });
        return;
      }

      if (assignment.userId !== userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      // Delete file from R2
      try {
        await deleteFromR2(assignment.fileUrl);
      } catch (err) {
        console.warn('Could not delete file from R2:', err);
      }

      // Delete associated generated paper
      await GeneratedPaper.deleteMany({ assignmentId: assignment._id });

      // Delete the assignment
      await assignment.deleteOne();

      // Invalidate caches
      await cacheService.invalidateAssignmentList(userId);
      await cacheService.invalidateGeneratedPaper(id);

      res.json({ message: 'Assignment deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
