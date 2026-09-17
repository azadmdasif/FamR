export type UserRole = 'parent' | 'child';

export interface LinkedChild {
  id: string;
  name: string;
  email?: string;
  joinedAt?: string;
}

export interface LinkedParent {
  id: string;
  name: string;
  email?: string;
  joinedAt?: string;
}

export type LinkRequestType = 'parent_invites_child' | 'child_requests_parent';

export interface ChildLinkRequest {
  id: string;
  type?: LinkRequestType;
  parentId: string;
  parentName: string;
  parentEmail: string;
  parentFamilyId?: string;
  childEmail: string;
  childUid?: string;
  childName?: string;
  childFamilyId?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  respondedAt?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole; // 'parent' or 'child'
  familyId: string; // Family / household linking code
  parentIds?: string[]; // If child, list of linked parent UIDs
  linkedParents?: LinkedParent[]; // Parents who guide this user
  linkedChildren?: LinkedChild[]; // Children this user guides as a parent
  activeChildId?: string; // Currently selected child for the parent to manage
  createdAt?: string;
}

export type TimeBlockCategory =
  | 'prayer'
  | 'gym'
  | 'classes'
  | 'meals'
  | 'study'
  | 'reading'
  | 'speech'
  | 'therapy'
  | 'free_time'
  | 'bath'
  | 'bedtime'
  | 'other';

export interface TimeBlock {
  id: string;
  title: string;
  startTime: string; // "HH:MM" 24h format
  endTime: string;   // "HH:MM" 24h format
  category: TimeBlockCategory;
  daysOfWeek: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  childId?: string; // If specified, target child ID (or 'all' / undefined for all)
  isFreeScreenTime?: boolean;
  isOptionalOnLowEnergy?: boolean;
  reminderMinutesBefore?: number; // 0, 5, 10, 15
  notes?: string;
  color?: string;
}

export type TaskPriority = 'gentle' | 'normal' | 'key_focus';

export interface Task {
  id: string;
  title: string;
  subject?: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM
  priority: TaskPriority;
  childId?: string; // Target child ID / UID
  childName?: string; // Target child name
  childEmail?: string; // Target child email
  parentNote?: string;
  guardianNote?: string; // for backward compatibility
  assignedByUid?: string;
  assignedByName?: string;
  createdByRole?: UserRole;
  completed: boolean;
  completedAt?: string;
  reminderMinutesBefore?: number;
}

export interface AfterEndDayUsageLog {
  id: string;
  time: string; // "HH:MM" or "HH:MM:SS"
  timestamp: string; // ISO
  action?: string;
}

export interface DaySession {
  date: string; // YYYY-MM-DD
  childId?: string;
  startedAt?: string; // "HH:MM"
  startedAtTimestamp?: string; // ISO
  endedAt?: string; // "HH:MM"
  endedAtTimestamp?: string; // ISO
  isStarted: boolean;
  isEnded: boolean;
  afterEndDayNotes: string[];
  afterEndDayLogs: AfterEndDayUsageLog[];
}

export interface BlockSession {
  blockId: string;
  date: string; // YYYY-MM-DD
  childId?: string;
  startedAt?: string; // "HH:MM"
  startedAtTimestamp?: string; // ISO
  endedAt?: string; // "HH:MM"
  endedAtTimestamp?: string; // ISO
  status: 'not_started' | 'in_progress' | 'completed';
}

export interface ClassFeedbackComment {
  id: string;
  blockId: string;
  blockTitle?: string;
  childId?: string;
  childName?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  timestamp: string; // ISO timestamp
  authorRole: 'teacher' | 'student' | 'parent';
  authorName: string;
  topicsCovered: string; // a: topics covered
  homeworkGiven: string; // b: homework given
  previousHomeworkFinished: 'yes' | 'no' | 'partial' | 'n/a'; // c: previous homework finished or not
  optionalComments?: string; // d: optional comments
}

export type SpeechExerciseType = 'breathing' | 'passage' | 'word_of_day' | 'talking_prompt';

export interface SpeechExercise {
  id: string;
  type: SpeechExerciseType;
  title: string;
  content: string;
  extraNotes?: string;
  category?: string; // 'Nature', 'Hobbies', 'Warm-Up', etc.
  enabled: boolean;
}

export interface SpeechPracticeLog {
  id: string;
  date: string; // YYYY-MM-DD
  childId?: string;
  completed: boolean;
  skippedGentle: boolean;
  notes?: string;
  hasAudioRecording?: boolean;
  audioDataUrl?: string;
  audioDurationSec?: number;
  completedExercises: string[];
  timestamp: string;
}

export interface ReadingLog {
  id: string;
  date: string; // YYYY-MM-DD
  childId?: string;
  bookTitle: string;
  pagesRead?: number;
  minutesRead: number;
  favoriteQuoteOrThought?: string;
  timestamp: string;
}

export interface FocusSession {
  id: string;
  date: string; // YYYY-MM-DD
  childId?: string;
  durationMinutes: number;
  targetSubject?: string;
  notes?: string;
  completedAt: string;
}

export interface WeeklyReview {
  weekStartDate: string; // YYYY-MM-DD
  childId?: string;
  parentNotes: string;
  guardianNotes?: string; // backward compat
  childHighlight: string;
  zahidHighlight?: string; // backward compat
  adjustmentsForNextWeek: string;
  completedTogether: boolean;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  category: 'block' | 'task' | 'encouragement' | 'reminder';
  read: boolean;
}
