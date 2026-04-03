export type TaskType = 'text' | 'multiple-choice' | 'location';

export interface Task {
  id: string;
  order: number;
  type: TaskType;
  question: string;
  questionImage?: string;       // base64
  answer?: string;              // type 'text': comma-separated; 'multiple-choice': correct choice text
  choices?: string[];           // type 'multiple-choice': up to 4 options
  hint?: string;                // shown after 3 wrong attempts
  referenceImage?: string;      // base64, type 'location'
  similarityThreshold?: number; // 0–1, default 0.7, type 'location'
}

export interface AdminConfig {
  passwordHash: string;
  geminiApiKey?: string;
  tasks: Task[];
  solutionImage?: string;      // base64 – full image uploaded by admin
  puzzlePieces?: string[];     // base64[] – auto-split from solutionImage, length = tasks.length
  pieceRevealOrder?: number[]; // shuffled indices: task i reveals piece pieceRevealOrder[i]
  welcomeTitle?: string;
  welcomeText?: string;
  welcomeImage?: string;       // base64
}

export interface GameState {
  currentTaskIndex: number;
  completed: boolean;
  startedAt: string;
  started: boolean;
}
