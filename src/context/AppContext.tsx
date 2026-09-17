import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import confetti from 'canvas-confetti';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import {
  INITIAL_DAY_SESSIONS,
  INITIAL_FOCUS_SESSIONS,
  INITIAL_READING_LOGS,
  INITIAL_SPEECH_EXERCISES,
  INITIAL_SPEECH_LOGS,
  INITIAL_TASKS,
  INITIAL_TIME_BLOCKS,
  INITIAL_WEEKLY_REVIEW,
} from '../data/initialData';
import {
  AfterEndDayUsageLog,
  BlockSession,
  ChildLinkRequest,
  ClassFeedbackComment,
  DaySession,
  FocusSession,
  LinkedChild,
  LinkedParent,
  NotificationItem,
  ReadingLog,
  SpeechExercise,
  SpeechPracticeLog,
  Task,
  TimeBlock,
  UserProfile,
  UserRole,
  WeeklyReview,
} from '../types';
import { soundManager } from '../utils/audio';

// Deep sanitizer that recursively removes all undefined values before writing to Firestore
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as any;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const res: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        res[key] = sanitizeForFirestore(value);
      }
    }
    return res as any;
  }
  return data;
}

interface AppContextType {
  // Auth & Profile
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  authLoading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    pass: string,
    displayName: string,
    role: UserRole,
    familyId?: string
  ) => Promise<void>;
  signInWithGoogle: (
    roleChoice?: UserRole,
    familyIdChoice?: string
  ) => Promise<{ isNewUser: boolean; role: UserRole }>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  signOutUser: () => Promise<void>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;

  // Active Role & Child Mapping
  role: UserRole; // 'parent' | 'child'
  setRole: (role: UserRole) => void;
  activeChildId: string; // 'all' or specific child id
  setActiveChildId: (childId: string) => void;
  linkedChildren: LinkedChild[];
  addLinkedChild: (name: string, email?: string) => void;
  removeLinkedChild: (childId: string) => void;
  linkedParents: LinkedParent[];
  addLinkedParent: (name: string, email?: string) => void;
  removeLinkedParent: (parentId: string) => void;
  canSetRoutines: boolean;
  canAssignTasks: boolean;

  // Family Link Requests (Parent & Child Invitations/Requests)
  pendingLinkRequests: ChildLinkRequest[];
  sentLinkRequests: ChildLinkRequest[];
  sendChildLinkRequest: (
    childEmail: string,
    childName?: string
  ) => Promise<{ success: boolean; message: string }>;
  sendParentLinkRequest: (
    parentEmail: string,
    parentName?: string
  ) => Promise<{ success: boolean; message: string }>;
  respondToLinkRequest: (requestId: string, accept: boolean) => Promise<void>;
  cancelLinkRequest: (requestId: string) => Promise<void>;

  selectedDate: string; // YYYY-MM-DD
  setSelectedDate: (date: string) => void;
  todayDateStr: string;

  // Time blocks (Routine templates)
  timeBlocks: TimeBlock[];
  addTimeBlock: (block: Omit<TimeBlock, 'id'>) => void;
  updateTimeBlock: (id: string, updates: Partial<TimeBlock>) => void;
  deleteTimeBlock: (id: string) => void;
  getBlocksForDay: (dayOfWeek: number) => TimeBlock[];
  getGuaranteedFreeScreenTimeBlock: () => TimeBlock | undefined;

  // Tasks
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'completed'>) => void;
  toggleTaskCompleted: (id: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  getTasksForDate: (dateStr: string) => Task[];
  getTasksForChildView: (dateStr: string) => Task[];

  // Day Session (Start Day, End Day, After-Hours Phone Activity)
  daySessions: Record<string, DaySession>;
  currentDaySession: DaySession | undefined;
  startDay: (date?: string) => void;
  endDay: (date?: string) => void;
  resetDaySession: (date?: string) => void;
  logPhoneUsedAfterEndDay: (actionName?: string) => void;
  afterEndDayToast: string | null;
  dismissAfterEndDayToast: () => void;

  // Block Sessions (Start Block, End Block)
  blockSessions: Record<string, BlockSession>;
  startBlock: (blockId: string, date?: string) => void;
  endBlock: (blockId: string, date?: string) => void;
  resetBlockSession: (blockId: string, date?: string) => void;
  getBlockSession: (blockId: string, date?: string) => BlockSession | undefined;

  // Speech Practice
  speechExercises: SpeechExercise[];
  addSpeechExercise: (exercise: Omit<SpeechExercise, 'id'>) => void;
  updateSpeechExercise: (id: string, updates: Partial<SpeechExercise>) => void;
  deleteSpeechExercise: (id: string) => void;
  speechLogs: SpeechPracticeLog[];
  todaySpeechLog: SpeechPracticeLog | undefined;
  saveSpeechPracticeLog: (log: Omit<SpeechPracticeLog, 'id' | 'timestamp'>) => void;

  // Reading Logs
  readingLogs: ReadingLog[];
  addReadingLog: (log: Omit<ReadingLog, 'id' | 'timestamp'>) => void;
  deleteReadingLog: (id: string) => void;

  // Focus Sessions
  focusSessions: FocusSession[];
  addFocusSession: (session: Omit<FocusSession, 'id' | 'completedAt'>) => void;

  // Class Feedback Comments (Teacher / Student feedback after classes)
  classComments: ClassFeedbackComment[];
  addClassComment: (comment: Omit<ClassFeedbackComment, 'id' | 'timestamp'> & { timestamp?: string }) => void;
  deleteClassComment: (id: string) => void;
  getClassCommentsForBlock: (blockId: string, date?: string) => ClassFeedbackComment[];

  // Weekly Review
  weeklyReview: WeeklyReview;
  updateWeeklyReview: (review: Partial<WeeklyReview>) => void;

  // Notifications
  notifications: NotificationItem[];
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
  testSendReminder: (title: string, message: string) => void;
  notificationsEnabled: boolean;
  requestNotificationPermission: () => Promise<boolean>;

  // Celebrations & Chimes
  triggerCelebration: () => void;
  playTick: () => void;
  playChime: () => void;

  // Stats & Streaks
  stats: {
    speechStreak: number;
    readingStreak: number;
    focusStreak: number;
    totalFocusMinutes: number;
    completedTasksCount: number;
  };
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  ROLE: 'family_routine_role',
  FAMILY_ID: 'family_routine_family_id',
  ACTIVE_CHILD: 'family_routine_active_child',
  LINKED_CHILDREN: 'family_routine_linked_children',
  LINKED_PARENTS: 'family_routine_linked_parents',
  TIME_BLOCKS: 'family_routine_time_blocks',
  BLOCK_SESSIONS: 'family_routine_block_sessions',
  TASKS: 'family_routine_tasks',
  DAY_SESSIONS: 'family_routine_day_sessions',
  SPEECH_EXERCISES: 'family_routine_speech_exercises',
  SPEECH_LOGS: 'family_routine_speech_logs',
  READING_LOGS: 'family_routine_reading_logs',
  FOCUS_SESSIONS: 'family_routine_focus_sessions',
  CLASS_COMMENTS: 'family_routine_class_comments',
  WEEKLY_REVIEW: 'family_routine_weekly_review',
  NOTIFICATIONS: 'family_routine_notifications',
};

const DEFAULT_FAMILY_ID = 'family-routine-home';

// Set of legacy dummy data IDs to ensure none ever appear in the UI or storage
const DUMMY_IDS = new Set([
  'block-1', 'block-2', 'block-3', 'block-4', 'block-5', 'block-6',
  'block-7', 'block-8', 'block-9', 'block-10', 'block-11', 'block-12',
  'task-1', 'task-2', 'task-3',
  'speech-1', 'speech-2', 'speech-3', 'speech-4', 'speech-5',
  'spk-1', 'read-1', 'read-2', 'foc-1', 'foc-2',
  'child-default', 'notif-welcome'
]);

const isDummyReview = (rev?: WeeklyReview | null): boolean => {
  if (!rev) return false;
  return (
    rev.parentNotes === 'Consistent gym attendance and calm pace during homework.' ||
    rev.zahidHighlight === 'Enjoyed protected free time and finished reading chapters early.' ||
    rev.adjustmentsForNextWeek === 'Shift speech practice 10 minutes earlier on Tuesdays.'
  );
};

// Purge legacy cached dummy data from previous runs
const DATA_CLEANUP_KEY = 'family_routine_clean_dummy_v3';
if (typeof window !== 'undefined') {
  if (!localStorage.getItem(DATA_CLEANUP_KEY)) {
    localStorage.removeItem(STORAGE_KEYS.TIME_BLOCKS);
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.SPEECH_EXERCISES);
    localStorage.removeItem(STORAGE_KEYS.SPEECH_LOGS);
    localStorage.removeItem(STORAGE_KEYS.READING_LOGS);
    localStorage.removeItem(STORAGE_KEYS.FOCUS_SESSIONS);
    localStorage.removeItem(STORAGE_KEYS.WEEKLY_REVIEW);
    localStorage.removeItem(STORAGE_KEYS.BLOCK_SESSIONS);
    localStorage.removeItem(STORAGE_KEYS.DAY_SESSIONS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.LINKED_CHILDREN);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_CHILD);
    localStorage.setItem(DATA_CLEANUP_KEY, 'true');
  }
}

const DEFAULT_CHILDREN: LinkedChild[] = [];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const [todayDateStr] = useState(getTodayStr);
  const [selectedDate, setSelectedDate] = useState(todayDateStr);

  // Auth State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Role (Defaults to 'child' for demo or saved role)
  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ROLE);
    if (saved === 'parent' || saved === 'child') return saved;
    // Backward compatibility check
    if (saved === 'guardian') return 'parent';
    return 'child';
  });

  const [activeFamilyId, setActiveFamilyId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.FAMILY_ID) || DEFAULT_FAMILY_ID;
  });

  // Linked Children for Parent / Child Mapping
  const [linkedChildren, setLinkedChildren] = useState<LinkedChild[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LINKED_CHILDREN);
    if (saved) {
      try {
        const parsed: LinkedChild[] = JSON.parse(saved);
        return parsed.filter((c) => c.id !== 'child-default' && c.email !== 'child@family.app');
      } catch {}
    }
    return DEFAULT_CHILDREN;
  });

  const [activeChildId, setActiveChildIdState] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_CHILD);
    return saved && saved !== 'child-default' ? saved : '';
  });

  const setActiveChildId = (childId: string) => {
    setActiveChildIdState(childId);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CHILD, childId);
  };

  const addLinkedChild = (name: string, email?: string) => {
    const newChild: LinkedChild = {
      id: 'child-' + Date.now(),
      name: name.trim(),
      email: email?.trim(),
      joinedAt: new Date().toISOString(),
    };
    setLinkedChildren((prev) => {
      const updated = [...prev, newChild];
      localStorage.setItem(STORAGE_KEYS.LINKED_CHILDREN, JSON.stringify(updated));
      syncToFirestore('linkedChildren', updated);
      return updated;
    });
    setActiveChildId(newChild.id);
  };

  const removeLinkedChild = (childId: string) => {
    setLinkedChildren((prev) => {
      const updated = prev.filter((c) => c.id !== childId);
      localStorage.setItem(STORAGE_KEYS.LINKED_CHILDREN, JSON.stringify(updated));
      syncToFirestore('linkedChildren', updated);
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        setDoc(userRef, sanitizeForFirestore({ linkedChildren: updated }), { merge: true }).catch(console.error);
      }
      return updated;
    });
  };

  // Linked Parents (Parents who guide this user)
  const [linkedParents, setLinkedParents] = useState<LinkedParent[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LINKED_PARENTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  const addLinkedParent = (name: string, email?: string) => {
    const newParent: LinkedParent = {
      id: 'parent-' + Date.now(),
      name: name.trim(),
      email: email?.trim(),
      joinedAt: new Date().toISOString(),
    };
    setLinkedParents((prev) => {
      const updated = [...prev, newParent];
      localStorage.setItem(STORAGE_KEYS.LINKED_PARENTS, JSON.stringify(updated));
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        setDoc(userRef, sanitizeForFirestore({ linkedParents: updated }), { merge: true }).catch(console.error);
      }
      return updated;
    });
  };

  const removeLinkedParent = (parentId: string) => {
    setLinkedParents((prev) => {
      const updated = prev.filter((p) => p.id !== parentId);
      localStorage.setItem(STORAGE_KEYS.LINKED_PARENTS, JSON.stringify(updated));
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        setDoc(userRef, sanitizeForFirestore({ linkedParents: updated }), { merge: true }).catch(console.error);
      }
      return updated;
    });
  };

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem(STORAGE_KEYS.ROLE, newRole);
    if (currentUser && userProfile) {
      const userRef = doc(db, 'users', currentUser.uid);
      setDoc(userRef, sanitizeForFirestore({ role: newRole }), { merge: true }).catch(console.error);
      setUserProfile((prev) => (prev ? { ...prev, role: newRole } : null));
    }
  };

  // Sync state if userProfile loads or changes
  useEffect(() => {
    if (userProfile?.role && role !== userProfile.role) {
      setRoleState(userProfile.role);
      localStorage.setItem(STORAGE_KEYS.ROLE, userProfile.role);
    }
  }, [userProfile?.role, role]);

  // Permission helpers
  const canSetRoutines = role === 'parent';
  const canAssignTasks = role === 'parent';

  // Firebase Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data() as Record<string, any>;
            const rawRole = data.role as string | undefined;
            const mappedRole: UserRole =
              rawRole === 'guardian'
                ? 'parent'
                : rawRole === 'zahid'
                ? 'child'
                : rawRole === 'parent'
                ? 'parent'
                : 'child';
            setUserProfile({
              ...data,
              role: mappedRole,
            } as UserProfile);
            setRoleState(mappedRole);
            localStorage.setItem(STORAGE_KEYS.ROLE, mappedRole);
            if (data.familyId) {
              setActiveFamilyId(data.familyId);
              localStorage.setItem(STORAGE_KEYS.FAMILY_ID, data.familyId);
            }
            if (data.linkedChildren && data.linkedChildren.length > 0) {
              setLinkedChildren(data.linkedChildren);
            }
            if (data.linkedParents && data.linkedParents.length > 0) {
              setLinkedParents(data.linkedParents);
            }
          } else {
            const initialProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || (role === 'parent' ? 'Parent' : 'Child'),
              role: role,
              familyId: activeFamilyId,
              linkedChildren: role === 'parent' ? (linkedChildren || []) : [],
              linkedParents: linkedParents || [],
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, sanitizeForFirestore(initialProfile));
            setUserProfile(initialProfile);
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
      } else {
        setUserProfile(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [role, activeFamilyId]);

  // Auth helper methods
  const signInWithEmail = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const userDocRef = doc(db, 'users', cred.user.uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data() as any;
      const parsedRole: UserRole = data.role === 'guardian' ? 'parent' : (data.role === 'zahid' ? 'child' : data.role || 'child');
      const profile: UserProfile = {
        ...data,
        role: parsedRole,
      };
      setUserProfile(profile);
      setRole(parsedRole);
      if (data.familyId) {
        setActiveFamilyId(data.familyId);
        localStorage.setItem(STORAGE_KEYS.FAMILY_ID, data.familyId);
      }
      if (data.linkedChildren) {
        setLinkedChildren(data.linkedChildren);
      }
      if (data.linkedParents) {
        setLinkedParents(data.linkedParents);
      }
    }
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    displayName: string,
    roleChoice: UserRole,
    familyIdChoice = DEFAULT_FAMILY_ID
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const newProfile: UserProfile = {
      uid: cred.user.uid,
      email: cred.user.email || email,
      displayName,
      role: roleChoice,
      familyId: familyIdChoice,
      linkedChildren: roleChoice === 'parent' ? [{ id: 'child-default', name: 'Child Account' }] : [],
      linkedParents: [],
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', cred.user.uid), sanitizeForFirestore(newProfile));
    setUserProfile(newProfile);
    setRole(roleChoice);
    setActiveFamilyId(familyIdChoice);
    localStorage.setItem(STORAGE_KEYS.FAMILY_ID, familyIdChoice);
  };

  const signInWithGoogle = async (
    roleChoice?: UserRole,
    familyIdChoice = DEFAULT_FAMILY_ID
  ): Promise<{ isNewUser: boolean; role: UserRole }> => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const cred = await signInWithPopup(auth, provider);
    const user = cred.user;

    const userDocRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      const data = snap.data() as any;
      const parsedRole: UserRole =
        data.role === 'guardian'
          ? 'parent'
          : data.role === 'zahid'
          ? 'child'
          : data.role || 'child';
      const profile: UserProfile = {
        ...data,
        role: parsedRole,
      };
      setUserProfile(profile);
      setRole(parsedRole);
      if (data.familyId) {
        setActiveFamilyId(data.familyId);
        localStorage.setItem(STORAGE_KEYS.FAMILY_ID, data.familyId);
      }
      if (data.linkedChildren && data.linkedChildren.length > 0) {
        setLinkedChildren(data.linkedChildren);
      }
      if (data.linkedParents && data.linkedParents.length > 0) {
        setLinkedParents(data.linkedParents);
      }
      return { isNewUser: false, role: parsedRole };
    } else {
      const assignedRole: UserRole = roleChoice || role || 'child';
      const assignedFamilyId: string = familyIdChoice || activeFamilyId || DEFAULT_FAMILY_ID;
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || (assignedRole === 'parent' ? 'Parent' : 'Child'),
        role: assignedRole,
        familyId: assignedFamilyId,
        linkedChildren: assignedRole === 'parent' ? [{ id: 'child-default', name: 'Child Account' }] : [],
        linkedParents: [],
        createdAt: new Date().toISOString(),
      };
      await setDoc(userDocRef, sanitizeForFirestore(newProfile));
      setUserProfile(newProfile);
      setRole(assignedRole);
      setActiveFamilyId(assignedFamilyId);
      localStorage.setItem(STORAGE_KEYS.FAMILY_ID, assignedFamilyId);
      return { isNewUser: true, role: assignedRole };
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const userDocRef = doc(db, 'users', currentUser.uid);
    await setDoc(userDocRef, sanitizeForFirestore(updates), { merge: true });
    setUserProfile((prev) => (prev ? { ...prev, ...updates } : null));
    if (updates.role) {
      setRole(updates.role);
    }
    if (updates.familyId) {
      setActiveFamilyId(updates.familyId);
      localStorage.setItem(STORAGE_KEYS.FAMILY_ID, updates.familyId);
    }
    if (updates.linkedChildren) {
      setLinkedChildren(updates.linkedChildren);
    }
    if (updates.linkedParents) {
      setLinkedParents(updates.linkedParents);
      localStorage.setItem(STORAGE_KEYS.LINKED_PARENTS, JSON.stringify(updates.linkedParents));
    }
  };

  const signOutUser = async () => {
    await signOut(auth);
    setUserProfile(null);
    setCurrentUser(null);
  };

  // Family Link Requests state & real-time sync (Parent & Child Bidirectional)
  const [pendingLinkRequests, setPendingLinkRequests] = useState<ChildLinkRequest[]>([]);
  const [sentLinkRequests, setSentLinkRequests] = useState<ChildLinkRequest[]>([]);

  // Real-time listener for link requests
  useEffect(() => {
    if (!currentUser) {
      setPendingLinkRequests([]);
      setSentLinkRequests([]);
      return;
    }

    const currentEmail = (currentUser.email || '').trim().toLowerCase();
    const currentUid = currentUser.uid;

    let childEmailReqs: ChildLinkRequest[] = [];
    let parentEmailReqs: ChildLinkRequest[] = [];
    let parentUidReqs: ChildLinkRequest[] = [];
    let childUidReqs: ChildLinkRequest[] = [];

    const recomputeRequests = () => {
      const allReqsMap = new Map<string, ChildLinkRequest>();
      [...childEmailReqs, ...parentEmailReqs, ...parentUidReqs, ...childUidReqs].forEach((r) => {
        allReqsMap.set(r.id, r);
      });
      const allReqs = Array.from(allReqsMap.values());

      // Incoming pending requests: addressed to this user's email, not created by this user
      const incoming = allReqs.filter((r) => {
        if (r.status !== 'pending') return false;
        // 1. Invite to be child: addressed to this user's email
        const isChildInvite =
          (r.type === 'parent_invites_child' || !r.type) &&
          r.childEmail?.toLowerCase() === currentEmail &&
          r.parentId !== currentUid;
        // 2. Request to be parent: addressed to this user's email
        const isParentRequest =
          r.type === 'child_requests_parent' &&
          r.parentEmail?.toLowerCase() === currentEmail &&
          r.childUid !== currentUid;
        return isChildInvite || isParentRequest;
      });

      // Sent requests: sent by this user
      const sent = allReqs.filter((r) => {
        const isSentAsParent =
          (r.type === 'parent_invites_child' || !r.type) && r.parentId === currentUid;
        const isSentAsChild =
          r.type === 'child_requests_parent' && r.childUid === currentUid;
        return isSentAsParent || isSentAsChild;
      });

      setPendingLinkRequests(incoming);
      setSentLinkRequests(sent);
    };

    let unsubChildEmail = () => {};
    let unsubParentEmail = () => {};

    if (currentEmail) {
      const q1 = query(
        collection(db, 'linkRequests'),
        where('childEmail', '==', currentEmail)
      );
      unsubChildEmail = onSnapshot(
        q1,
        (snap) => {
          childEmailReqs = [];
          snap.forEach((d) => childEmailReqs.push({ id: d.id, ...(d.data() as any) }));
          recomputeRequests();
        },
        (err) => console.error('Error listening to childEmail link requests:', err)
      );

      const q2 = query(
        collection(db, 'linkRequests'),
        where('parentEmail', '==', currentEmail)
      );
      unsubParentEmail = onSnapshot(
        q2,
        (snap) => {
          parentEmailReqs = [];
          snap.forEach((d) => parentEmailReqs.push({ id: d.id, ...(d.data() as any) }));
          recomputeRequests();
        },
        (err) => console.error('Error listening to parentEmail link requests:', err)
      );
    }

    const q3 = query(
      collection(db, 'linkRequests'),
      where('parentId', '==', currentUid)
    );
    const unsubParentUid = onSnapshot(
      q3,
      (snap) => {
        parentUidReqs = [];
        snap.forEach((d) => parentUidReqs.push({ id: d.id, ...(d.data() as any) }));
        recomputeRequests();
      },
      (err) => console.error('Error listening to parentId link requests:', err)
    );

    const q4 = query(
      collection(db, 'linkRequests'),
      where('childUid', '==', currentUid)
    );
    const unsubChildUid = onSnapshot(
      q4,
      (snap) => {
        childUidReqs = [];
        snap.forEach((d) => childUidReqs.push({ id: d.id, ...(d.data() as any) }));
        recomputeRequests();
      },
      (err) => console.error('Error listening to childUid link requests:', err)
    );

    return () => {
      unsubChildEmail();
      unsubParentEmail();
      unsubParentUid();
      unsubChildUid();
    };
  }, [currentUser]);

  // When a sent request is accepted by recipient, automatically update state & Firestore
  useEffect(() => {
    if (!currentUser) return;
    const acceptedRequests = sentLinkRequests.filter((r) => r.status === 'accepted');
    if (acceptedRequests.length === 0) return;

    let childrenModified = false;
    let currentChildren = [...linkedChildren];
    let parentsModified = false;
    let currentParents = [...(linkedParents || [])];

    acceptedRequests.forEach((req) => {
      if (req.type === 'parent_invites_child' || !req.type) {
        // This user invited a child who accepted
        const childId = req.childUid || req.id;
        const exists = currentChildren.some(
          (c) =>
            c.id === childId ||
            (req.childEmail && c.email?.toLowerCase() === req.childEmail.toLowerCase())
        );
        if (!exists) {
          currentChildren.push({
            id: childId,
            name: req.childName || 'Child',
            email: req.childEmail,
            joinedAt: req.respondedAt || req.createdAt,
          });
          childrenModified = true;
        }
      } else if (req.type === 'child_requests_parent') {
        // This user requested a parent who accepted
        const parentId = req.parentId || req.id;
        const exists = currentParents.some(
          (p) =>
            p.id === parentId ||
            (req.parentEmail && p.email?.toLowerCase() === req.parentEmail.toLowerCase())
        );
        if (!exists) {
          currentParents.push({
            id: parentId,
            name: req.parentName || 'Parent',
            email: req.parentEmail,
            joinedAt: req.respondedAt || req.createdAt,
          });
          parentsModified = true;
        }
      }
    });

    if (childrenModified) {
      const cleanedList = currentChildren.filter(
        (c) => c.id !== 'child-default' || currentChildren.length === 1
      );
      setLinkedChildren(cleanedList);
      localStorage.setItem(STORAGE_KEYS.LINKED_CHILDREN, JSON.stringify(cleanedList));
      const userRef = doc(db, 'users', currentUser.uid);
      setDoc(userRef, sanitizeForFirestore({ linkedChildren: cleanedList }), { merge: true }).catch(
        console.error
      );
    }

    if (parentsModified) {
      setLinkedParents(currentParents);
      localStorage.setItem(STORAGE_KEYS.LINKED_PARENTS, JSON.stringify(currentParents));
      const userRef = doc(db, 'users', currentUser.uid);
      setDoc(userRef, sanitizeForFirestore({ linkedParents: currentParents }), { merge: true }).catch(
        console.error
      );
    }
  }, [sentLinkRequests, currentUser, linkedChildren, linkedParents]);

  // Send request from parent to add a child
  const sendChildLinkRequest = async (
    childEmail: string,
    childName?: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) {
      return { success: false, message: 'You must be signed in to send link requests.' };
    }
    const cleanEmail = childEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Please enter a valid child email address.' };
    }
    if (cleanEmail === (currentUser.email || '').trim().toLowerCase()) {
      return { success: false, message: 'You cannot link your own account email as a child.' };
    }

    const alreadyLinked = linkedChildren.some(
      (c) => c.email?.toLowerCase() === cleanEmail
    );
    if (alreadyLinked) {
      return { success: false, message: 'This child is already linked to your account.' };
    }

    const alreadyPending = sentLinkRequests.some(
      (r) =>
        (r.type === 'parent_invites_child' || !r.type) &&
        r.childEmail.toLowerCase() === cleanEmail &&
        r.status === 'pending'
    );
    if (alreadyPending) {
      return {
        success: false,
        message: 'A connection request is already pending for this email. Waiting for them to accept.',
      };
    }

    try {
      const reqDocRef = doc(collection(db, 'linkRequests'));
      const newRequest: ChildLinkRequest = {
        id: reqDocRef.id,
        type: 'parent_invites_child',
        parentId: currentUser.uid,
        parentName: userProfile?.displayName || currentUser.displayName || 'Parent',
        parentEmail: (currentUser.email || '').trim().toLowerCase(),
        parentFamilyId: activeFamilyId,
        childEmail: cleanEmail,
        childName: childName?.trim() || '',
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      await setDoc(reqDocRef, sanitizeForFirestore(newRequest));
      return {
        success: true,
        message: `Child invite sent to ${cleanEmail}. They will see an invitation banner in their portal to Accept & Connect.`,
      };
    } catch (err: any) {
      console.error('Error sending child link request:', err);
      return { success: false, message: err.message || 'Failed to send link request.' };
    }
  };

  // Send request from user to add someone as their parent
  const sendParentLinkRequest = async (
    parentEmail: string,
    parentName?: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) {
      return { success: false, message: 'You must be signed in to send link requests.' };
    }
    const cleanEmail = parentEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Please enter a valid parent email address.' };
    }
    if (cleanEmail === (currentUser.email || '').trim().toLowerCase()) {
      return { success: false, message: 'You cannot link your own account email as your parent.' };
    }

    const alreadyLinked = (linkedParents || []).some(
      (p) => p.email?.toLowerCase() === cleanEmail
    );
    if (alreadyLinked) {
      return { success: false, message: 'This parent is already linked to your account.' };
    }

    const alreadyPending = sentLinkRequests.some(
      (r) =>
        r.type === 'child_requests_parent' &&
        r.parentEmail?.toLowerCase() === cleanEmail &&
        r.status === 'pending'
    );
    if (alreadyPending) {
      return {
        success: false,
        message: 'A connection request is already pending for this parent. Waiting for them to accept.',
      };
    }

    try {
      const reqDocRef = doc(collection(db, 'linkRequests'));
      const newRequest: ChildLinkRequest = {
        id: reqDocRef.id,
        type: 'child_requests_parent',
        childUid: currentUser.uid,
        childName: userProfile?.displayName || currentUser.displayName || 'Child',
        childEmail: (currentUser.email || '').trim().toLowerCase(),
        childFamilyId: activeFamilyId,
        parentId: '',
        parentName: parentName?.trim() || '',
        parentEmail: cleanEmail,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      await setDoc(reqDocRef, sanitizeForFirestore(newRequest));
      return {
        success: true,
        message: `Parent request sent to ${cleanEmail}. They will see an invitation banner in their portal to Accept & Connect.`,
      };
    } catch (err: any) {
      console.error('Error sending parent link request:', err);
      return { success: false, message: err.message || 'Failed to send parent link request.' };
    }
  };

  // Respond to incoming link request (Can be child accepting parent invite OR parent accepting child request)
  const respondToLinkRequest = async (requestId: string, accept: boolean) => {
    if (!currentUser) return;
    try {
      const reqRef = doc(db, 'linkRequests', requestId);
      const snap = await getDoc(reqRef);
      if (!snap.exists()) return;
      const reqData = snap.data() as ChildLinkRequest;
      const isChildRequestingParent = reqData.type === 'child_requests_parent';

      if (accept) {
        if (isChildRequestingParent) {
          // CURRENT USER IS ACCEPTING TO BE PARENT OF SENDER
          await setDoc(
            reqRef,
            sanitizeForFirestore({
              status: 'accepted',
              parentId: currentUser.uid,
              parentName: userProfile?.displayName || currentUser.displayName || 'Parent',
              parentEmail: currentUser.email || '',
              respondedAt: new Date().toISOString(),
            }),
            { merge: true }
          );

          // 1. Add child to current user's linkedChildren
          const newChildEntry: LinkedChild = {
            id: reqData.childUid || 'child-' + Date.now(),
            name: reqData.childName || 'Child',
            email: reqData.childEmail,
            joinedAt: new Date().toISOString(),
          };
          const updatedChildren = linkedChildren
            .filter((c) => c.id !== newChildEntry.id && c.email?.toLowerCase() !== newChildEntry.email?.toLowerCase())
            .filter((c) => c.id !== 'child-default' || linkedChildren.length === 1)
            .concat(newChildEntry);

          setLinkedChildren(updatedChildren);
          localStorage.setItem(STORAGE_KEYS.LINKED_CHILDREN, JSON.stringify(updatedChildren));
          await setDoc(
            doc(db, 'users', currentUser.uid),
            sanitizeForFirestore({ linkedChildren: updatedChildren }),
            { merge: true }
          );

          // 2. Add current user as parent to child's user profile
          if (reqData.childUid) {
            try {
              const childDocRef = doc(db, 'users', reqData.childUid);
              const childSnap = await getDoc(childDocRef);
              if (childSnap.exists()) {
                const childData = childSnap.data() as any;
                const parentEntry: LinkedParent = {
                  id: currentUser.uid,
                  name: userProfile?.displayName || currentUser.displayName || 'Parent',
                  email: currentUser.email || '',
                  joinedAt: new Date().toISOString(),
                };
                const updatedParents = (childData.linkedParents || [])
                  .filter((p: any) => p.id !== currentUser.uid && p.email?.toLowerCase() !== (currentUser.email || '').toLowerCase())
                  .concat(parentEntry);
                const updatedParentIds = Array.from(
                  new Set([...(childData.parentIds || []), currentUser.uid])
                );
                await setDoc(
                  childDocRef,
                  sanitizeForFirestore({
                    linkedParents: updatedParents,
                    parentIds: updatedParentIds,
                    familyId: activeFamilyId,
                  }),
                  { merge: true }
                );
              }
            } catch (cErr) {
              console.error('Error adding parent to child document:', cErr);
            }
          }
        } else {
          // CURRENT USER IS ACCEPTING PARENT INVITE TO BE A CHILD
          await setDoc(
            reqRef,
            sanitizeForFirestore({
              status: 'accepted',
              childUid: currentUser.uid,
              childName: userProfile?.displayName || currentUser.displayName || 'Child',
              childEmail: currentUser.email || '',
              respondedAt: new Date().toISOString(),
            }),
            { merge: true }
          );

          // 1. Add parent to current user's linkedParents
          const parentEntry: LinkedParent = {
            id: reqData.parentId,
            name: reqData.parentName || 'Parent',
            email: reqData.parentEmail,
            joinedAt: new Date().toISOString(),
          };
          const updatedParents = (linkedParents || [])
            .filter((p) => p.id !== parentEntry.id && p.email?.toLowerCase() !== parentEntry.email?.toLowerCase())
            .concat(parentEntry);
          setLinkedParents(updatedParents);
          localStorage.setItem(STORAGE_KEYS.LINKED_PARENTS, JSON.stringify(updatedParents));

          const updatedParentIds = Array.from(
            new Set([...(userProfile?.parentIds || []), reqData.parentId])
          );
          await updateUserProfile({
            familyId: reqData.parentFamilyId || activeFamilyId,
            parentIds: updatedParentIds,
            linkedParents: updatedParents,
          });

          if (reqData.parentFamilyId) {
            setActiveFamilyId(reqData.parentFamilyId);
            localStorage.setItem(STORAGE_KEYS.FAMILY_ID, reqData.parentFamilyId);
          }

          // 2. Add current user as child to parent's user profile in Firestore
          try {
            const parentDocRef = doc(db, 'users', reqData.parentId);
            const parentSnap = await getDoc(parentDocRef);
            if (parentSnap.exists()) {
              const parentData = parentSnap.data() as any;
              const parentChildren: LinkedChild[] = parentData.linkedChildren || [];
              const exists = parentChildren.some(
                (c) => c.id === currentUser.uid || (currentUser.email && c.email?.toLowerCase() === currentUser.email.toLowerCase())
              );
              if (!exists) {
                const newChildEntry: LinkedChild = {
                  id: currentUser.uid,
                  name: userProfile?.displayName || currentUser.displayName || reqData.childName || 'Child',
                  email: currentUser.email || reqData.childEmail,
                  joinedAt: new Date().toISOString(),
                };
                const updatedList = parentChildren
                  .filter((c) => c.id !== 'child-default')
                  .concat(newChildEntry);
                await setDoc(
                  parentDocRef,
                  sanitizeForFirestore({ linkedChildren: updatedList }),
                  { merge: true }
                );
              }
            }
          } catch (pErr) {
            console.error('Error adding child to parent profile:', pErr);
          }
        }

        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        soundManager.playSuccessChime();
      } else {
        // Decline request
        await setDoc(
          reqRef,
          sanitizeForFirestore({
            status: 'declined',
            respondedAt: new Date().toISOString(),
          }),
          { merge: true }
        );
      }
    } catch (err) {
      console.error('Error responding to link request:', err);
    }
  };

  const cancelLinkRequest = async (requestId: string) => {
    try {
      await deleteDoc(doc(db, 'linkRequests', requestId));
    } catch (err) {
      console.error('Error canceling link request:', err);
    }
  };

  // Time Blocks
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TIME_BLOCKS);
    if (saved) {
      try {
        const parsed: TimeBlock[] = JSON.parse(saved);
        return parsed.filter((b) => !DUMMY_IDS.has(b.id));
      } catch {}
    }
    return INITIAL_TIME_BLOCKS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TIME_BLOCKS, JSON.stringify(timeBlocks));
  }, [timeBlocks]);

  // Tasks
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (saved) {
      try {
        const parsed: Task[] = JSON.parse(saved);
        return parsed.filter((t) => !DUMMY_IDS.has(t.id));
      } catch {}
    }
    return INITIAL_TASKS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }, [tasks]);

  // Day Sessions
  const [daySessions, setDaySessions] = useState<Record<string, DaySession>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DAY_SESSIONS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return INITIAL_DAY_SESSIONS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DAY_SESSIONS, JSON.stringify(daySessions));
  }, [daySessions]);

  // Block Sessions (Start Block / End Block Tracking)
  const [blockSessions, setBlockSessions] = useState<Record<string, BlockSession>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BLOCK_SESSIONS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BLOCK_SESSIONS, JSON.stringify(blockSessions));
  }, [blockSessions]);

  const currentDaySession = daySessions[selectedDate];
  const [afterEndDayToast, setAfterEndDayToast] = useState<string | null>(null);

  const dismissAfterEndDayToast = useCallback(() => {
    setAfterEndDayToast(null);
  }, []);

  // Speech Exercises
  const [speechExercises, setSpeechExercises] = useState<SpeechExercise[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SPEECH_EXERCISES);
    if (saved) {
      try {
        const parsed: SpeechExercise[] = JSON.parse(saved);
        return parsed.filter((e) => !DUMMY_IDS.has(e.id));
      } catch {}
    }
    return INITIAL_SPEECH_EXERCISES;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SPEECH_EXERCISES, JSON.stringify(speechExercises));
  }, [speechExercises]);

  // Speech Logs
  const [speechLogs, setSpeechLogs] = useState<SpeechPracticeLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SPEECH_LOGS);
    if (saved) {
      try {
        const parsed: SpeechPracticeLog[] = JSON.parse(saved);
        return parsed.filter((s) => !DUMMY_IDS.has(s.id));
      } catch {}
    }
    return INITIAL_SPEECH_LOGS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SPEECH_LOGS, JSON.stringify(speechLogs));
  }, [speechLogs]);

  // Reading Logs
  const [readingLogs, setReadingLogs] = useState<ReadingLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.READING_LOGS);
    if (saved) {
      try {
        const parsed: ReadingLog[] = JSON.parse(saved);
        return parsed.filter((r) => !DUMMY_IDS.has(r.id));
      } catch {}
    }
    return INITIAL_READING_LOGS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.READING_LOGS, JSON.stringify(readingLogs));
  }, [readingLogs]);

  // Focus Sessions
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FOCUS_SESSIONS);
    if (saved) {
      try {
        const parsed: FocusSession[] = JSON.parse(saved);
        return parsed.filter((f) => !DUMMY_IDS.has(f.id));
      } catch {}
    }
    return INITIAL_FOCUS_SESSIONS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FOCUS_SESSIONS, JSON.stringify(focusSessions));
  }, [focusSessions]);

  // Class Feedback Comments
  const [classComments, setClassComments] = useState<ClassFeedbackComment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CLASS_COMMENTS);
    if (saved) {
      try {
        const parsed: ClassFeedbackComment[] = JSON.parse(saved);
        return parsed.filter((c) => !DUMMY_IDS.has(c.id));
      } catch {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLASS_COMMENTS, JSON.stringify(classComments));
  }, [classComments]);

  // Weekly Review
  const [weeklyReview, setWeeklyReview] = useState<WeeklyReview>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WEEKLY_REVIEW);
    if (saved) {
      try {
        const parsed: WeeklyReview = JSON.parse(saved);
        if (isDummyReview(parsed)) return INITIAL_WEEKLY_REVIEW;
        return parsed;
      } catch {}
    }
    return INITIAL_WEEKLY_REVIEW;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WEEKLY_REVIEW, JSON.stringify(weeklyReview));
  }, [weeklyReview]);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (saved) {
      try {
        const parsed: NotificationItem[] = JSON.parse(saved);
        return parsed.filter((n) => !DUMMY_IDS.has(n.id));
      } catch {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  // Real-time Firestore synchronization for Family Group
  useEffect(() => {
    if (!currentUser) return;

    const familyRef = doc(db, 'families', activeFamilyId);

    // Initial setup check: create family doc if missing
    getDoc(familyRef).then((snap) => {
      if (!snap.exists()) {
        setDoc(
          familyRef,
          sanitizeForFirestore({
            familyId: activeFamilyId,
            createdAt: new Date().toISOString(),
            timeBlocks: INITIAL_TIME_BLOCKS,
            tasks: INITIAL_TASKS,
            daySessions: INITIAL_DAY_SESSIONS,
            blockSessions: {},
            speechExercises: INITIAL_SPEECH_EXERCISES,
            speechLogs: INITIAL_SPEECH_LOGS,
            readingLogs: INITIAL_READING_LOGS,
            focusSessions: INITIAL_FOCUS_SESSIONS,
            classComments: [],
            weeklyReview: INITIAL_WEEKLY_REVIEW,
            linkedChildren: DEFAULT_CHILDREN,
          })
        ).catch(console.error);
      }
    }).catch(console.error);

    // Live Snapshot Listener
    const unsubscribeFamily = onSnapshot(familyRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.timeBlocks) setTimeBlocks((data.timeBlocks as TimeBlock[]).filter((b) => !DUMMY_IDS.has(b.id)));
        if (data.tasks) setTasks((data.tasks as Task[]).filter((t) => !DUMMY_IDS.has(t.id)));
        if (data.daySessions) setDaySessions(data.daySessions);
        if (data.blockSessions) setBlockSessions(data.blockSessions);
        if (data.speechExercises) setSpeechExercises((data.speechExercises as SpeechExercise[]).filter((e) => !DUMMY_IDS.has(e.id)));
        if (data.speechLogs) setSpeechLogs((data.speechLogs as SpeechPracticeLog[]).filter((s) => !DUMMY_IDS.has(s.id)));
        if (data.readingLogs) setReadingLogs((data.readingLogs as ReadingLog[]).filter((r) => !DUMMY_IDS.has(r.id)));
        if (data.focusSessions) setFocusSessions((data.focusSessions as FocusSession[]).filter((f) => !DUMMY_IDS.has(f.id)));
        if (data.classComments) setClassComments(data.classComments as ClassFeedbackComment[]);
        if (data.weeklyReview) {
          if (isDummyReview(data.weeklyReview)) {
            setWeeklyReview(INITIAL_WEEKLY_REVIEW);
          } else {
            setWeeklyReview(data.weeklyReview);
          }
        }
        if (data.linkedChildren) setLinkedChildren((data.linkedChildren as LinkedChild[]).filter((c) => c.id !== 'child-default' && c.email !== 'child@family.app'));
      }
    });

    return () => {
      unsubscribeFamily();
    };
  }, [currentUser, activeFamilyId]);

  // Firestore sync helper
  const syncToFirestore = useCallback(
    (field: string, payload: any) => {
      if (currentUser) {
        const familyRef = doc(db, 'families', activeFamilyId);
        setDoc(familyRef, sanitizeForFirestore({ [field]: payload }), { merge: true }).catch(console.error);
      }
    },
    [currentUser, activeFamilyId]
  );

  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  });

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        const granted = res === 'granted';
        setNotificationsEnabled(granted);
        if (granted) {
          testSendReminder('Gentle Reminders Active', 'Reminders active for schedule and tasks.');
        }
        return granted;
      } catch {
        return false;
      }
    }
    return false;
  };

  const triggerCelebration = useCallback(() => {
    soundManager.playSuccessChime();
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.75 },
      colors: ['#047857', '#059669', '#10b981', '#34d399', '#6ee7b7'],
      disableForReducedMotion: true,
    });
  }, []);

  const playTick = useCallback(() => {
    soundManager.playSoftTick();
  }, []);

  const playChime = useCallback(() => {
    soundManager.playGentleChime();
  }, []);

  const testSendReminder = useCallback((title: string, message: string) => {
    const newNotif: NotificationItem = {
      id: 'notif-' + Date.now(),
      title,
      message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: 'reminder',
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 19)]);
    soundManager.playGentleChime(660, 1.5);

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon: '/favicon.ico',
        });
      } catch {}
    }
  }, []);

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Day Start & End Day actions
  const startDay = useCallback(
    (date = selectedDate) => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const isoStr = now.toISOString();

      setDaySessions((prev) => {
        const existing = prev[date] || {
          date,
          isStarted: false,
          isEnded: false,
          afterEndDayNotes: [],
          afterEndDayLogs: [],
        };
        const updated = {
          ...prev,
          [date]: {
            ...existing,
            startedAt: timeStr,
            startedAtTimestamp: isoStr,
            isStarted: true,
            isEnded: false,
          },
        };
        syncToFirestore('daySessions', updated);
        return updated;
      });

      triggerCelebration();
      testSendReminder('Day Started', `Start logged at ${timeStr}.`);
    },
    [selectedDate, triggerCelebration, testSendReminder, syncToFirestore]
  );

  const endDay = useCallback(
    (date = selectedDate) => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const isoStr = now.toISOString();

      setDaySessions((prev) => {
        const existing = prev[date] || {
          date,
          isStarted: true,
          isEnded: false,
          afterEndDayNotes: [],
          afterEndDayLogs: [],
        };
        const updated = {
          ...prev,
          [date]: {
            ...existing,
            endedAt: timeStr,
            endedAtTimestamp: isoStr,
            isEnded: true,
          },
        };
        syncToFirestore('daySessions', updated);
        return updated;
      });

      soundManager.playGentleChime(440, 2);
      testSendReminder('Day Ended', `Day ended at ${timeStr}. Great work today!`);
    },
    [selectedDate, testSendReminder, syncToFirestore]
  );

  const resetDaySession = useCallback(
    (date = selectedDate) => {
      setDaySessions((prev) => {
        const updated = { ...prev };
        delete updated[date];
        syncToFirestore('daySessions', updated);
        return updated;
      });
    },
    [selectedDate, syncToFirestore]
  );

  // Block Sessions (Start Block / End Block)
  const getBlockSession = useCallback(
    (blockId: string, date = selectedDate): BlockSession | undefined => {
      const key = `${date}_${blockId}`;
      return blockSessions[key];
    },
    [blockSessions, selectedDate]
  );

  const startBlock = useCallback(
    (blockId: string, date = selectedDate) => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const isoStr = now.toISOString();
      const key = `${date}_${blockId}`;

      setBlockSessions((prev) => {
        const updated = {
          ...prev,
          [key]: {
            blockId,
            date,
            startedAt: timeStr,
            startedAtTimestamp: isoStr,
            status: 'in_progress' as const,
          },
        };
        syncToFirestore('blockSessions', updated);
        return updated;
      });

      soundManager.playGentleChime(520, 1.5);
      const targetBlock = timeBlocks.find((b) => b.id === blockId);
      testSendReminder(
        `Block Started: ${targetBlock?.title || 'Session'}`,
        `Started at ${timeStr}. Focus and enjoy the session.`
      );
    },
    [selectedDate, timeBlocks, testSendReminder, syncToFirestore]
  );

  const endBlock = useCallback(
    (blockId: string, date = selectedDate) => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const isoStr = now.toISOString();
      const key = `${date}_${blockId}`;

      setBlockSessions((prev) => {
        const existing = prev[key] || {
          blockId,
          date,
          startedAt: timeStr,
          startedAtTimestamp: isoStr,
          status: 'in_progress' as const,
        };
        const updated = {
          ...prev,
          [key]: {
            ...existing,
            endedAt: timeStr,
            endedAtTimestamp: isoStr,
            status: 'completed' as const,
          },
        };
        syncToFirestore('blockSessions', updated);
        return updated;
      });

      triggerCelebration();
      const targetBlock = timeBlocks.find((b) => b.id === blockId);
      testSendReminder(
        `Block Completed: ${targetBlock?.title || 'Session'}`,
        `Finished at ${timeStr}. Great job on completing this block!`
      );
    },
    [selectedDate, timeBlocks, triggerCelebration, testSendReminder, syncToFirestore]
  );

  const resetBlockSession = useCallback(
    (blockId: string, date = selectedDate) => {
      const key = `${date}_${blockId}`;
      setBlockSessions((prev) => {
        const updated = { ...prev };
        delete updated[key];
        syncToFirestore('blockSessions', updated);
        return updated;
      });
    },
    [selectedDate, syncToFirestore]
  );

  // Phone used after end day logger
  const lastRecordedUsageTimeRef = useRef<number>(0);

  const logPhoneUsedAfterEndDay = useCallback(
    (actionName = 'Phone unlocked / app opened') => {
      if (!currentDaySession?.isEnded) return;

      const now = Date.now();
      if (now - lastRecordedUsageTimeRef.current < 60000) {
        return;
      }
      lastRecordedUsageTimeRef.current = now;

      const dateObj = new Date();
      const timeStr = `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
      const note = `Phone used after end day at ${timeStr} (${actionName})`;

      const newLog: AfterEndDayUsageLog = {
        id: 'log-' + now,
        time: timeStr,
        timestamp: dateObj.toISOString(),
        action: actionName,
      };

      setDaySessions((prev) => {
        const current = prev[selectedDate];
        if (!current) return prev;
        const updated = {
          ...prev,
          [selectedDate]: {
            ...current,
            afterEndDayNotes: [...(current.afterEndDayNotes || []), note],
            afterEndDayLogs: [...(current.afterEndDayLogs || []), newLog],
          },
        };
        syncToFirestore('daySessions', updated);
        return updated;
      });

      setAfterEndDayToast(`Logged after-hours activity at ${timeStr}. Time for restful sleep!`);
      soundManager.playGentleChime(330, 1.2);
    },
    [currentDaySession, selectedDate, syncToFirestore]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleUserInteraction = () => {
      if (currentDaySession?.isEnded) {
        logPhoneUsedAfterEndDay('Screen active / tapped');
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && currentDaySession?.isEnded) {
        logPhoneUsedAfterEndDay('App brought to foreground');
      }
    };

    window.addEventListener('click', handleUserInteraction, { passive: true });
    window.addEventListener('keydown', handleUserInteraction, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentDaySession, logPhoneUsedAfterEndDay]);

  // Time Block Operations (Parents set/update routines)
  const addTimeBlock = (block: Omit<TimeBlock, 'id'>) => {
    const newBlock: TimeBlock = {
      ...block,
      id: 'block-' + Date.now(),
      childId: activeChildId !== 'all' ? activeChildId : undefined,
    };
    setTimeBlocks((prev) => {
      const updated = [...prev, newBlock].sort((a, b) => a.startTime.localeCompare(b.startTime));
      syncToFirestore('timeBlocks', updated);
      return updated;
    });
    triggerCelebration();
  };

  const updateTimeBlock = (id: string, updates: Partial<TimeBlock>) => {
    setTimeBlocks((prev) => {
      const updated = prev
        .map((b) => (b.id === id ? { ...b, ...updates } : b))
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      syncToFirestore('timeBlocks', updated);
      return updated;
    });
  };

  const deleteTimeBlock = (id: string) => {
    setTimeBlocks((prev) => {
      const updated = prev.filter((b) => b.id !== id);
      syncToFirestore('timeBlocks', updated);
      return updated;
    });
  };

  const getBlocksForDay = useCallback(
    (dayOfWeek: number): TimeBlock[] => {
      return timeBlocks
        .filter((b) => b.daysOfWeek.includes(dayOfWeek))
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
    },
    [timeBlocks]
  );

  const getGuaranteedFreeScreenTimeBlock = useCallback((): TimeBlock | undefined => {
    const dayOfWeek = new Date().getDay();
    const todays = getBlocksForDay(dayOfWeek);
    return todays.find((b) => b.isFreeScreenTime || b.category === 'free_time');
  }, [getBlocksForDay]);

  // Task Operations (Parents and Children)
  const addTask = (task: Omit<Task, 'id' | 'completed'>) => {
    // Resolve child information
    let resolvedChildId = task.childId;
    let resolvedChildName = task.childName;
    let resolvedChildEmail = task.childEmail;

    if (!resolvedChildId && activeChildId !== 'all') {
      resolvedChildId = activeChildId;
    }

    if (resolvedChildId) {
      const matchChild = linkedChildren.find((c) => c.id === resolvedChildId);
      if (matchChild) {
        if (!resolvedChildName) resolvedChildName = matchChild.name;
        if (!resolvedChildEmail) resolvedChildEmail = matchChild.email;
      }
    }

    const newTask: Task = {
      ...task,
      id: 'task-' + Date.now(),
      childId: resolvedChildId,
      childName: resolvedChildName,
      childEmail: resolvedChildEmail,
      assignedByUid: currentUser?.uid,
      assignedByName: userProfile?.displayName || currentUser?.displayName || (role === 'parent' ? 'Parent' : 'Self'),
      createdByRole: role,
      completed: false,
    };
    setTasks((prev) => {
      const updated = [newTask, ...prev];
      syncToFirestore('tasks', updated);
      return updated;
    });
    triggerCelebration();
  };

  const toggleTaskCompleted = (id: string) => {
    setTasks((prev) => {
      const updated = prev.map((t) => {
        if (t.id === id) {
          const nextCompleted = !t.completed;
          if (nextCompleted) triggerCelebration();
          return {
            ...t,
            completed: nextCompleted,
            completedAt: nextCompleted ? new Date().toISOString() : undefined,
          };
        }
        return t;
      });
      syncToFirestore('tasks', updated);
      return updated;
    });
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
      syncToFirestore('tasks', updated);
      return updated;
    });
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      syncToFirestore('tasks', updated);
      return updated;
    });
  };

  const getTasksForDate = useCallback(
    (dateStr: string): Task[] => {
      return tasks.filter((t) => t.dueDate === dateStr);
    },
    [tasks]
  );

  // Return tasks visible to this user when viewing in Child View
  const getTasksForChildView = useCallback(
    (dateStr: string): Task[] => {
      const userEmail = (currentUser?.email || '').trim().toLowerCase();
      const userUid = currentUser?.uid;

      return tasks.filter((t) => {
        // Date match (or no due date set)
        const dateMatch = !t.dueDate || t.dueDate === dateStr;
        if (!dateMatch) return false;

        // If signed in, match tasks assigned directly to this user as child or created by them
        if (currentUser) {
          const isAssignedToMe =
            (userUid && t.childId === userUid) ||
            (userEmail && t.childEmail?.toLowerCase() === userEmail) ||
            (userUid && t.assignedByUid === userUid) ||
            // Or tasks assigned to default/all
            (!t.childId && !t.childEmail);
          return isAssignedToMe;
        }

        // Demo / Guest mode fallback
        return !t.childId || t.childId === activeChildId || t.childId === 'child-default';
      });
    },
    [tasks, currentUser, activeChildId]
  );

  // Speech Exercises
  const addSpeechExercise = (exercise: Omit<SpeechExercise, 'id'>) => {
    const newEx: SpeechExercise = {
      ...exercise,
      id: 'ex-' + Date.now(),
    };
    setSpeechExercises((prev) => {
      const updated = [...prev, newEx];
      syncToFirestore('speechExercises', updated);
      return updated;
    });
    triggerCelebration();
  };

  const updateSpeechExercise = (id: string, updates: Partial<SpeechExercise>) => {
    setSpeechExercises((prev) => {
      const updated = prev.map((e) => (e.id === id ? { ...e, ...updates } : e));
      syncToFirestore('speechExercises', updated);
      return updated;
    });
  };

  const deleteSpeechExercise = (id: string) => {
    setSpeechExercises((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      syncToFirestore('speechExercises', updated);
      return updated;
    });
  };

  const todaySpeechLog = speechLogs.find((l) => l.date === selectedDate);

  const saveSpeechPracticeLog = (log: Omit<SpeechPracticeLog, 'id' | 'timestamp'>) => {
    const newLog: SpeechPracticeLog = {
      ...log,
      id: 'speech-log-' + Date.now(),
      childId: activeChildId !== 'all' ? activeChildId : undefined,
      timestamp: new Date().toISOString(),
    };
    setSpeechLogs((prev) => {
      const filtered = prev.filter((l) => l.date !== log.date);
      const updated = [newLog, ...filtered];
      syncToFirestore('speechLogs', updated);
      return updated;
    });
    triggerCelebration();
  };

  // Reading Logs
  const addReadingLog = (log: Omit<ReadingLog, 'id' | 'timestamp'>) => {
    const newLog: ReadingLog = {
      ...log,
      id: 'read-log-' + Date.now(),
      childId: activeChildId !== 'all' ? activeChildId : undefined,
      timestamp: new Date().toISOString(),
    };
    setReadingLogs((prev) => {
      const updated = [newLog, ...prev];
      syncToFirestore('readingLogs', updated);
      return updated;
    });
    triggerCelebration();
  };

  const deleteReadingLog = (id: string) => {
    setReadingLogs((prev) => {
      const updated = prev.filter((l) => l.id !== id);
      syncToFirestore('readingLogs', updated);
      return updated;
    });
  };

  // Focus Sessions
  const addFocusSession = (session: Omit<FocusSession, 'id' | 'completedAt'>) => {
    const newSession: FocusSession = {
      ...session,
      id: 'focus-' + Date.now(),
      childId: activeChildId !== 'all' ? activeChildId : undefined,
      completedAt: new Date().toISOString(),
    };
    setFocusSessions((prev) => {
      const updated = [newSession, ...prev];
      syncToFirestore('focusSessions', updated);
      return updated;
    });
    triggerCelebration();
  };

  // Class Feedback Comments
  const addClassComment = (comment: Omit<ClassFeedbackComment, 'id' | 'timestamp'> & { timestamp?: string }) => {
    const d = new Date();
    const currentTimeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    const newComment: ClassFeedbackComment = {
      ...comment,
      id: 'class-comm-' + Date.now(),
      date: comment.date || selectedDate || todayDateStr,
      time: comment.time || currentTimeStr,
      timestamp: comment.timestamp || d.toISOString(),
      childId: comment.childId || (activeChildId !== 'all' ? activeChildId : undefined),
    };
    setClassComments((prev) => {
      const updated = [newComment, ...prev];
      syncToFirestore('classComments', updated);
      return updated;
    });
    triggerCelebration();
  };

  const deleteClassComment = (id: string) => {
    setClassComments((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      syncToFirestore('classComments', updated);
      return updated;
    });
  };

  const getClassCommentsForBlock = useCallback(
    (blockId: string, date?: string) => {
      return classComments.filter((c) => c.blockId === blockId && (!date || c.date === date));
    },
    [classComments]
  );

  // Weekly Review
  const updateWeeklyReview = (updates: Partial<WeeklyReview>) => {
    setWeeklyReview((prev) => {
      const updated = {
        ...prev,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      syncToFirestore('weeklyReview', updated);
      return updated;
    });
  };

  // Streaks Calculation
  const calculateStreak = (dates: string[]): number => {
    if (dates.length === 0) return 0;
    const uniqueDates = Array.from(new Set(dates)).sort().reverse();
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (!uniqueDates.includes(today) && !uniqueDates.includes(yesterday)) {
      return 0;
    }

    let streak = 0;
    let curr = new Date(uniqueDates[0]);

    for (let i = 0; i < uniqueDates.length; i++) {
      const d = new Date(uniqueDates[i]);
      const diffDays = Math.round((curr.getTime() - d.getTime()) / (1000 * 3600 * 24));
      if (diffDays <= 1) {
        streak++;
        curr = d;
      } else {
        break;
      }
    }
    return streak;
  };

  const speechDates = speechLogs.filter((l) => l.completed || l.skippedGentle).map((l) => l.date);
  const readingDates = readingLogs.map((l) => l.date);
  const focusDates = focusSessions.map((l) => l.date);

  const stats = {
    speechStreak: calculateStreak(speechDates),
    readingStreak: calculateStreak(readingDates),
    focusStreak: calculateStreak(focusDates),
    totalFocusMinutes: focusSessions.reduce((acc, s) => acc + s.durationMinutes, 0),
    completedTasksCount: tasks.filter((t) => t.completed).length,
  };

  // Automated Routine Check
  useEffect(() => {
    const checkUpcomingReminders = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const currentDay = now.getDay();
      const todaysBlocks = getBlocksForDay(currentDay);

      todaysBlocks.forEach((block) => {
        if (!block.reminderMinutesBefore) return;
        const [h, m] = block.startTime.split(':').map(Number);
        const blockStartMinutes = h * 60 + m;
        const diff = blockStartMinutes - currentMinutes;

        if (diff === block.reminderMinutesBefore) {
          testSendReminder(
            `Upcoming: ${block.title}`,
            `Starts in ${block.reminderMinutesBefore} minutes at ${block.startTime}`
          );
        }
      });
    };

    const interval = setInterval(checkUpcomingReminders, 60000);
    return () => clearInterval(interval);
  }, [getBlocksForDay, testSendReminder]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        userProfile,
        authLoading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        updateUserProfile,
        signOutUser,
        isAuthModalOpen,
        setIsAuthModalOpen,
        role,
        setRole,
        activeChildId,
        setActiveChildId,
        linkedChildren,
        addLinkedChild,
        removeLinkedChild,
        linkedParents,
        addLinkedParent,
        removeLinkedParent,
        canSetRoutines,
        canAssignTasks,
        pendingLinkRequests,
        sentLinkRequests,
        sendChildLinkRequest,
        sendParentLinkRequest,
        respondToLinkRequest,
        cancelLinkRequest,
        selectedDate,
        setSelectedDate,
        todayDateStr,
        timeBlocks,
        addTimeBlock,
        updateTimeBlock,
        deleteTimeBlock,
        getBlocksForDay,
        getGuaranteedFreeScreenTimeBlock,
        tasks,
        addTask,
        toggleTaskCompleted,
        updateTask,
        deleteTask,
        getTasksForDate,
        getTasksForChildView,
        daySessions,
        currentDaySession,
        startDay,
        endDay,
        resetDaySession,
        logPhoneUsedAfterEndDay,
        afterEndDayToast,
        dismissAfterEndDayToast,
        blockSessions,
        startBlock,
        endBlock,
        resetBlockSession,
        getBlockSession,
        speechExercises,
        addSpeechExercise,
        updateSpeechExercise,
        deleteSpeechExercise,
        speechLogs,
        todaySpeechLog,
        saveSpeechPracticeLog,
        readingLogs,
        addReadingLog,
        deleteReadingLog,
        focusSessions,
        addFocusSession,
        classComments,
        addClassComment,
        deleteClassComment,
        getClassCommentsForBlock,
        weeklyReview,
        updateWeeklyReview,
        notifications,
        dismissNotification,
        clearAllNotifications,
        testSendReminder,
        notificationsEnabled,
        requestNotificationPermission,
        triggerCelebration,
        playTick,
        playChime,
        stats,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
