export interface QuestionTypeConfig {
  type: string;
  count: number;
  marksPerQuestion: number;
}

export interface IAssignment {
  userId: string;
  title: string;
  fileUrl: string;
  fileContent: string;
  dueDate: Date;
  questionTypes: QuestionTypeConfig[];
  additionalInstructions: string;
  totalQuestions: number;
  totalMarks: number;
  status: 'draft' | 'generating' | 'completed' | 'failed';
  generationJobId?: string;
}

export interface IQuestion {
  questionNumber: number;
  text: string;
  type: string;
  difficulty: 'easy' | 'moderate' | 'hard';
  marks: number;
  options?: string[];
}

export interface ISection {
  title: string;
  instruction: string;
  questions: IQuestion[];
}

export interface IGeneratedPaper {
  assignmentId: string;
  userId: string;
  sections: ISection[];
  pdfUrl?: string;
  metadata: {
    subject: string;
    totalMarks: number;
    totalQuestions: number;
    duration: string;
    generatedAt: Date;
  };
}

export interface GenerationJobData {
  assignmentId: string;
  userId: string;
}
