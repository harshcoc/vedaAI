import { Worker, Job } from 'bullmq';
import { Server as SocketIOServer } from 'socket.io';
import { redis, isRedisAvailable } from '../config/redis';
import { GenerationJobData } from '../types';
import { Assignment } from '../models/Assignment';
import { GeneratedPaper } from '../models/GeneratedPaper';
import { extractTextFromR2 } from '../services/pdfParser';
import { generateQuestionPaper } from '../services/aiService';
import { uploadToR2, generatePdfKey } from '../services/storageService';
import { generatePDF } from '../services/pdfGenerator';
import { cacheService } from '../services/cacheService';

let worker: Worker<GenerationJobData> | null = null;

/**
 * Process a generation job (used by both BullMQ worker and synchronous fallback)
 */
export async function processGenerationJob(
  assignmentId: string,
  userId: string,
  io?: SocketIOServer
): Promise<string> {
  console.log(`\n🔄 ═══ Starting generation for assignment ${assignmentId} ═══`);

  // 1. Fetch assignment
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    throw new Error(`Assignment not found: ${assignmentId}`);
  }

  assignment.status = 'generating';
  await assignment.save();
  console.log('📋 Assignment found:', assignment.title);

  // 2. Emit status update
  if (io) {
    io.to(`user:${userId}`).emit('generation:status', {
      assignmentId,
      status: 'processing',
    });
  }

  // 3. Extract text from file (R2) if not already extracted
  let fileContent = assignment.fileContent;
  if (!fileContent || fileContent.trim().length === 0) {
    console.log('📄 Extracting text from R2:', assignment.fileUrl);
    try {
      fileContent = await extractTextFromR2(assignment.fileUrl);
      assignment.fileContent = fileContent;
      await assignment.save();
      console.log(`📄 Extracted ${fileContent.length} characters`);
    } catch (err) {
      console.error('❌ File extraction failed:', err);
      fileContent = `Study material from: ${assignment.title}`;
      console.log('📄 Using fallback content');
    }
  } else {
    console.log(`📄 File content already available: ${fileContent.length} characters`);
  }

  // 4. Generate question paper using AI
  console.log('🤖 Calling Gemini AI...');
  let result;
  try {
    result = await generateQuestionPaper({
      fileContent,
      questionTypes: assignment.questionTypes,
      totalQuestions: assignment.totalQuestions,
      totalMarks: assignment.totalMarks,
      additionalInstructions: assignment.additionalInstructions,
    });
    console.log('✅ Gemini API returned successfully');
  } catch (err) {
    console.error('❌ Gemini API call failed:', err);
    throw err;
  }

  // 5. Delete any existing paper (regeneration case)
  await GeneratedPaper.deleteMany({ assignmentId });

  // 6. Create GeneratedPaper document
  console.log('💾 Saving generated paper to MongoDB...');
  const paper = await GeneratedPaper.create({
    assignmentId,
    userId,
    sections: result.sections,
    metadata: {
      subject: result.metadata.subject,
      totalMarks: result.metadata.totalMarks,
      totalQuestions: result.metadata.totalQuestions,
      duration: result.metadata.duration,
      generatedAt: new Date(),
    },
  });
  console.log('💾 Paper saved with ID:', paper._id);

  // 7. Generate PDF and upload to R2
  try {
    console.log('📝 Generating PDF...');
    const pdfBuffer = await generatePDF(paper.toObject(), assignment.title);
    const pdfKey = generatePdfKey(assignmentId);
    await uploadToR2(pdfBuffer, pdfKey, 'application/pdf');

    // Store the PDF R2 key on the paper
    paper.pdfUrl = pdfKey;
    await paper.save();
    console.log('📝 PDF uploaded to R2:', pdfKey);
  } catch (err) {
    console.warn('⚠️ PDF pre-generation failed (can be generated on demand):', err);
  }

  // 8. Cache the result
  await cacheService.setGeneratedPaper(assignmentId, paper.toObject());
  await cacheService.invalidateAssignmentList(userId);

  // 9. Update assignment status
  assignment.status = 'completed';
  await assignment.save();

  // 10. Emit completion
  if (io) {
    io.to(`user:${userId}`).emit('generation:complete', {
      assignmentId,
      paperId: paper._id.toString(),
      status: 'completed',
    });
  }

  console.log(`✅ ═══ Generation COMPLETED for "${assignment.title}" ═══\n`);
  return paper._id.toString();
}

/**
 * Start the BullMQ worker (only if Redis is available)
 */
export function startWorker(io: SocketIOServer): void {
  if (!isRedisAvailable() || !redis) {
    console.warn('⚠️ Redis not available — BullMQ worker not started. Generation will run synchronously.');
    return;
  }

  try {
    worker = new Worker<GenerationJobData>(
      'question-generation',
      async (job: Job<GenerationJobData>) => {
        const { assignmentId, userId } = job.data;
        try {
          const paperId = await processGenerationJob(assignmentId, userId, io);
          return { paperId };
        } catch (error) {
          await Assignment.findByIdAndUpdate(assignmentId, { status: 'failed' });
          io.to(`user:${userId}`).emit('generation:failed', {
            assignmentId,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          throw error;
        }
      },
      { connection: redis as any, concurrency: 2 }
    );

    worker.on('completed', (job) => console.log(`✅ Worker: Job ${job.id} completed`));
    worker.on('failed', (job, err) => console.error(`❌ Worker: Job ${job?.id} failed:`, err.message));
    worker.on('error', (err) => console.error('❌ Worker error:', err.message));

    console.log('🏗️ BullMQ generation worker started');
  } catch (err) {
    console.warn('⚠️ Could not start BullMQ worker:', (err as Error).message);
  }
}

export async function stopWorker(): Promise<void> {
  if (worker) {
    await worker.close();
  }
}
