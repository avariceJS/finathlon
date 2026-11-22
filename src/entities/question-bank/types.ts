// src/entities/question-bank/types.ts

export type QuestionType = 
  | 'single_choice' 
  | 'multiple_choice' 
  | 'matching' 
  | 'short_answer' 
  | 'sequence';

export type QuestionBankGradeCategory = '6-7' | '8-9' | '10-11';

export type MatchingPair = {
  left: string;
  right: string;
};

export type CorrectAnswerPayload = number | number[] | string[] | null;

export type QuestionVariant = {
  id: string;
  taskId: string;
  bankId: string;
  rowNumber: number;
  questionText: string;
  options: string[] | MatchingPair[];
  correctAnswer: CorrectAnswerPayload;
  points: number;
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
};

export type QuestionTask = {
  id: string;
  bankId: string;
  taskNumber: number;
  questionType: QuestionType;
  variants: QuestionVariant[];
};

export type QuestionBankSummary = {
  id: string;
  olympiadId: string;
  olympiadTitle: string;
  olympiadProfileTitle: string | null;
  olympiadSeason: string | null;
  olympiadYear: number;
  gradeCategory: QuestionBankGradeCategory;
  displayTitle: string;
  tasksCount: number;
  variantsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type QuestionBankDetail = QuestionBankSummary & {
  tasks: QuestionTask[];
};

export type ImportTaskInput = {
  taskNumber: number;
  questionType: QuestionType;
  variants: {
    rowNumber: number;
    questionText: string;
    options: string[] | MatchingPair[];
    correctAnswer: CorrectAnswerPayload;
    points: number;
  }[];
};

export type UpdateQuestionVariantInput = {
  questionText: string;
  options: string[] | MatchingPair[];
  correctAnswer: CorrectAnswerPayload;
  points: number;
};

export type QuestionVariantHistoryEntry = {
  id: string;
  variantId: string;
  bankId: string;
  versionFrom: number;
  versionTo: number;
  changedBy: string | null;
  changes: Record<string, { old: unknown; new: unknown }>;
  createdAt: string;
};