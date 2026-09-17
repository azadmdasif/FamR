import {
  DaySession,
  FocusSession,
  ReadingLog,
  SpeechExercise,
  SpeechPracticeLog,
  Task,
  TimeBlock,
  WeeklyReview,
} from '../types';

export const INITIAL_TIME_BLOCKS: TimeBlock[] = [];

export const INITIAL_SPEECH_EXERCISES: SpeechExercise[] = [];

export const INITIAL_TASKS: Task[] = [];

export const INITIAL_READING_LOGS: ReadingLog[] = [];

export const INITIAL_FOCUS_SESSIONS: FocusSession[] = [];

export const INITIAL_SPEECH_LOGS: SpeechPracticeLog[] = [];

export const INITIAL_WEEKLY_REVIEW: WeeklyReview = {
  weekStartDate: '',
  parentNotes: '',
  guardianNotes: '',
  childHighlight: '',
  zahidHighlight: '',
  adjustmentsForNextWeek: '',
  completedTogether: false,
  updatedAt: '',
};

export const INITIAL_DAY_SESSIONS: Record<string, DaySession> = {};
