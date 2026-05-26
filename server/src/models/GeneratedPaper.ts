import mongoose, { Schema, Document } from 'mongoose';
import { IGeneratedPaper } from '../types';

export interface GeneratedPaperDocument extends IGeneratedPaper, Document {}

const questionSchema = new Schema({
  questionNumber: { type: Number, required: true },
  text: { type: String, required: true },
  type: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ['easy', 'moderate', 'hard'],
    required: true,
  },
  marks: { type: Number, required: true },
  options: [{ type: String }],
}, { _id: false });

const sectionSchema = new Schema({
  title: { type: String, required: true },
  instruction: { type: String, required: true },
  questions: [questionSchema],
}, { _id: false });

const generatedPaperSchema = new Schema<GeneratedPaperDocument>({
  assignmentId: { type: String, required: true, index: true, unique: true },
  userId: { type: String, required: true, index: true },
  sections: [sectionSchema],
  pdfUrl: { type: String }, // R2 storage key for the generated PDF
  metadata: {
    subject: { type: String, required: true },
    totalMarks: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    duration: { type: String, required: true },
    generatedAt: { type: Date, default: Date.now },
  },
}, { timestamps: true });

export const GeneratedPaper = mongoose.model<GeneratedPaperDocument>('GeneratedPaper', generatedPaperSchema);
