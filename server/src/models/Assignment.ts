import mongoose, { Schema, Document } from 'mongoose';
import { IAssignment } from '../types';

export interface AssignmentDocument extends IAssignment, Document {}

const questionTypeSchema = new Schema({
  type: { type: String, required: true },
  count: { type: Number, required: true, min: 1 },
  marksPerQuestion: { type: Number, required: true, min: 1 },
}, { _id: false });

const assignmentSchema = new Schema<AssignmentDocument>({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileContent: { type: String, default: '' },
  dueDate: { type: Date, required: true },
  questionTypes: [questionTypeSchema],
  additionalInstructions: { type: String, default: '' },
  totalQuestions: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  status: {
    type: String,
    enum: ['draft', 'generating', 'completed', 'failed'],
    default: 'draft',
  },
  generationJobId: { type: String },
}, { timestamps: true });

export const Assignment = mongoose.model<AssignmentDocument>('Assignment', assignmentSchema);
