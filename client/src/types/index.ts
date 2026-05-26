export interface QuestionTypeConfig {
  type: string;
  count: number;
  marksPerQuestion: number;
}

export interface Assignment {
  _id: string;
  userId: string;
  title: string;
  fileUrl: string;
  dueDate: string;
  questionTypes: QuestionTypeConfig[];
  additionalInstructions: string;
  totalQuestions: number;
  totalMarks: number;
  status: 'draft' | 'generating' | 'completed' | 'failed';
  generationJobId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  questionNumber: number;
  text: string;
  type: string;
  difficulty: 'easy' | 'moderate' | 'hard';
  marks: number;
  options?: string[];
}

export interface Section {
  title: string;
  instruction: string;
  questions: Question[];
}

export interface GeneratedPaper {
  _id: string;
  assignmentId: string;
  sections: Section[];
  metadata: {
    subject: string;
    totalMarks: number;
    totalQuestions: number;
    duration: string;
    generatedAt: string;
  };
}

export type GenerationStatus = 'idle' | 'queued' | 'processing' | 'completed' | 'failed';
