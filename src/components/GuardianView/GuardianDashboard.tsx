import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  BarChart3,
  Bath,
  Bell,
  BookOpen,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Dumbbell,
  Edit2,
  Gamepad2,
  GraduationCap,
  Leaf,
  ListTodo,
  MessageSquare,
  Mic,
  Moon,
  Plus,
  Save,
  Shield,
  Smartphone,
  Sparkles,
  Sun,
  Timer,
  Trash2,
  User,
  Users,
  Utensils,
  X,
  HeartHandshake,
  Mail,
  Send,
  CheckCircle2,
  Settings,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  SpeechExercise,
  TaskPriority,
  TimeBlock,
  TimeBlockCategory,
} from '../../types';
import { FamilyLinkGuide } from './FamilyLinkGuide';
import { ChildLiveProgressView } from './ChildLiveProgressView';
import { ClassFeedbackModal } from '../Common/ClassFeedbackModal';

interface GuardianDashboardProps {
  onNavigateSettings?: () => void;
}

export const GuardianDashboard: React.FC<GuardianDashboardProps> = ({ onNavigateSettings }) => {
  const {
    currentUser,
    userProfile,
    pendingLinkRequests,
    respondToLinkRequest,
    sentLinkRequests,
    sendChildLinkRequest,
    cancelLinkRequest,
    timeBlocks,
    addTimeBlock,
    updateTimeBlock,
    deleteTimeBlock,
    tasks,
    addTask,
    updateTask,
    deleteTask,
    speechExercises,
    addSpeechExercise,
    updateSpeechExercise,
    deleteSpeechExercise,
    currentDaySession,
    weeklyReview,
    updateWeeklyReview,
    selectedDate,
    linkedChildren,
    activeChildId,
    setActiveChildId,
    addLinkedChild,
    removeLinkedChild,
    setIsAuthModalOpen,
    classComments,
    deleteClassComment,
    getClassCommentsForBlock,
    todayDateStr,
  } = useApp();

  // Top-level Parent Switcher: Day Planner vs Live Progress View
  const [guardianViewMode, setGuardianViewMode] = useState<'planner' | 'progress'>('planner');

  const [activeTab, setActiveTab] = useState<
    'routine' | 'tasks' | 'classes_log' | 'speech' | 'review' | 'family_link'
  >('routine');

  // Class feedback modal state
  const [feedbackModalBlock, setFeedbackModalBlock] = useState<TimeBlock | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState<boolean>(false);
  const [classCommentFilterBlock, setClassCommentFilterBlock] = useState<string>('all');

  // Task filter and target child assignment states
  const [taskFilterChildId, setTaskFilterChildId] = useState<string>('all');
  const [taskChildTarget, setTaskChildTarget] = useState<string>('all');
  const [isRespondingToReq, setIsRespondingToReq] = useState<string | null>(null);

  // Link Child Modal state
  const [isLinkModalOpen, setIsLinkModalOpen] = useState<boolean>(false);
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteName, setInviteName] = useState<string>('');
  const [inviteStatusMsg, setInviteStatusMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isSendingInvite, setIsSendingInvite] = useState<boolean>(false);

  // Block Modal Form state
  const [isBlockModalOpen, setIsBlockModalOpen] = useState<boolean>(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [blockTitle, setBlockTitle] = useState<string>('');
  const [blockStart, setBlockStart] = useState<string>('08:00');
  const [blockEnd, setBlockEnd] = useState<string>('09:00');
  const [blockCategory, setBlockCategory] = useState<TimeBlockCategory>('study');
  const [blockDays, setBlockDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [blockReminder, setBlockReminder] = useState<number>(10);
  const [blockNotes, setBlockNotes] = useState<string>('');

  // Task Modal Form state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [taskTitle, setTaskTitle] = useState<string>('');
  const [taskSubject, setTaskSubject] = useState<string>('Math');
  const [taskDueTime, setTaskDueTime] = useState<string>('20:00');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('normal');
  const [taskGuardianNote, setTaskGuardianNote] = useState<string>('');
  const [taskReminder, setTaskReminder] = useState<number>(15);

  // Custom Speech Exercise state
  const [isSpeechModalOpen, setIsSpeechModalOpen] = useState<boolean>(false);
  const [speechTitle, setSpeechTitle] = useState<string>('');
  const [speechContent, setSpeechContent] = useState<string>('');
  const [speechCategory, setSpeechCategory] = useState<string>('Topic');
  const [speechType, setSpeechType] = useState<SpeechExercise['type']>('talking_prompt');
  const [speechExtraNotes, setSpeechExtraNotes] = useState<string>('');

  // Weekly review editor
  const [guardianReviewNote, setGuardianReviewNote] = useState<string>(weeklyReview.guardianNotes || '');
  const [childHighlight, setChildHighlight] = useState<string>(weeklyReview.zahidHighlight || weeklyReview.childHighlight || '');
  const [adjustments, setAdjustments] = useState<string>(weeklyReview.adjustmentsForNextWeek || '');
  const [reviewSaved, setReviewSaved] = useState<boolean>(false);

  useEffect(() => {
    setGuardianReviewNote(weeklyReview.guardianNotes || '');
    setChildHighlight(weeklyReview.zahidHighlight || weeklyReview.childHighlight || '');
    setAdjustments(weeklyReview.adjustmentsForNextWeek || '');
  }, [weeklyReview]);

  // Add child prompt state
  const [isAddChildOpen, setIsAddChildOpen] = useState(false);
  const [newChildNameInput, setNewChildNameInput] = useState('');

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const activeChild = linkedChildren.find((c) => c.id === activeChildId) || linkedChildren[0];

  const renderCategoryIcon = (category: TimeBlockCategory, className = 'w-4 h-4') => {
    switch (category) {
      case 'prayer':
        return <Sun className={className} />;
      case 'gym':
        return <Dumbbell className={className} />;
      case 'classes':
        return <GraduationCap className={className} />;
      case 'meals':
        return <Utensils className={className} />;
      case 'study':
        return <Timer className={className} />;
      case 'reading':
        return <BookOpen className={className} />;
      case 'speech':
        return <Mic className={className} />;
      case 'therapy':
        return <Leaf className={className} />;
      case 'free_time':
        return <Gamepad2 className={className} />;
      case 'bath':
        return <Bath className={className} />;
      case 'bedtime':
        return <Moon className={className} />;
      default:
        return <Sparkles className={className} />;
    }
  };

  const handleOpenAddBlock = () => {
    setEditingBlockId(null);
    setBlockTitle('');
    setBlockStart('08:00');
    setBlockEnd('09:00');
    setBlockCategory('study');
    setBlockDays([0, 1, 2, 3, 4, 5, 6]);
    setBlockReminder(10);
    setBlockNotes('');
    setIsBlockModalOpen(true);
  };

  const handleOpenEditBlock = (b: TimeBlock) => {
    setEditingBlockId(b.id);
    setBlockTitle(b.title);
    setBlockStart(b.startTime);
    setBlockEnd(b.endTime);
    setBlockCategory(b.category);
    setBlockDays(b.daysOfWeek);
    setBlockReminder(b.reminderMinutesBefore || 0);
    setBlockNotes(b.notes || '');
    setIsBlockModalOpen(true);
  };

  const handleSaveBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockTitle.trim()) return;

    if (editingBlockId) {
      updateTimeBlock(editingBlockId, {
        title: blockTitle.trim(),
        startTime: blockStart,
        endTime: blockEnd,
        category: blockCategory,
        daysOfWeek: blockDays,
        reminderMinutesBefore: blockReminder,
        notes: blockNotes.trim() || undefined,
        childId: activeChildId !== 'all' ? activeChildId : undefined,
      });
    } else {
      addTimeBlock({
        title: blockTitle.trim(),
        startTime: blockStart,
        endTime: blockEnd,
        category: blockCategory,
        daysOfWeek: blockDays,
        reminderMinutesBefore: blockReminder,
        notes: blockNotes.trim() || undefined,
        childId: activeChildId !== 'all' ? activeChildId : undefined,
      });
    }
    setIsBlockModalOpen(false);
  };

  const toggleDay = (dayIndex: number) => {
    setBlockDays((prev) =>
      prev.includes(dayIndex)
        ? prev.length > 1
          ? prev.filter((d) => d !== dayIndex)
          : prev
        : [...prev, dayIndex].sort()
    );
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const chosenChildId = taskChildTarget !== 'all' ? taskChildTarget : (activeChildId !== 'all' ? activeChildId : undefined);
    const targetChild = linkedChildren.find((c) => c.id === chosenChildId);

    addTask({
      title: taskTitle.trim(),
      subject: taskSubject.trim() || undefined,
      dueDate: selectedDate,
      dueTime: taskDueTime || undefined,
      priority: taskPriority,
      guardianNote: taskGuardianNote.trim() || undefined,
      reminderMinutesBefore: taskReminder,
      childId: chosenChildId,
      childName: targetChild?.name,
      childEmail: targetChild?.email,
      assignedByUid: userProfile?.uid,
      assignedByName: userProfile?.displayName || 'Parent',
    });

    setTaskTitle('');
    setTaskGuardianNote('');
    setIsTaskModalOpen(false);
  };

  const handleSaveSpeechExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!speechTitle.trim() || !speechContent.trim()) return;

    addSpeechExercise({
      type: speechType,
      title: speechTitle.trim(),
      content: speechContent.trim(),
      category: speechCategory.trim(),
      extraNotes: speechExtraNotes.trim() || undefined,
      enabled: true,
    });

    setSpeechTitle('');
    setSpeechContent('');
    setSpeechExtraNotes('');
    setIsSpeechModalOpen(false);
  };

  const handleSaveReview = () => {
    updateWeeklyReview({
      guardianNotes: guardianReviewNote,
      zahidHighlight: childHighlight,
      adjustmentsForNextWeek: adjustments,
      completedTogether: true,
    });
    setReviewSaved(true);
    setTimeout(() => setReviewSaved(false), 2000);
  };

  const handleAddChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildNameInput.trim()) return;
    addLinkedChild(newChildNameInput.trim());
    setNewChildNameInput('');
    setIsAddChildOpen(false);
  };

  return (
    <div className="flex flex-col gap-4 pb-16">
      {/* Pending Incoming Link Requests Banner */}
      {pendingLinkRequests && pendingLinkRequests.length > 0 && (
        <div className="flex flex-col gap-2">
          {pendingLinkRequests.map((req) => (
            <div
              key={req.id}
              className="p-3.5 sm:p-4 rounded-2xl bg-amber-50 border border-amber-300 shadow-xs flex items-center justify-between gap-3 flex-wrap"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                    {req.type === 'child_requests_parent' ? 'Child Link Request' : 'Parent Link Request'}
                  </span>
                  <p className="text-xs font-semibold text-stone-900">
                    {req.type === 'child_requests_parent'
                      ? `${req.childName || 'A child'} (${req.childEmail}) wants you to be their parent`
                      : `${req.parentName || 'A parent'} (${req.parentEmail}) invited you as a child`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={isRespondingToReq === req.id}
                  onClick={async () => {
                    setIsRespondingToReq(req.id);
                    await respondToLinkRequest(req.id, false);
                    setIsRespondingToReq(null);
                  }}
                  className="px-2.5 py-1 text-xs rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 disabled:opacity-50"
                >
                  Decline
                </button>
                <button
                  type="button"
                  disabled={isRespondingToReq === req.id}
                  onClick={async () => {
                    setIsRespondingToReq(req.id);
                    await respondToLinkRequest(req.id, true);
                    setIsRespondingToReq(null);
                  }}
                  className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-800 text-white hover:bg-emerald-900 flex items-center gap-1 disabled:opacity-50"
                >
                  <Check className="w-3 h-3" />
                  <span>{isRespondingToReq === req.id ? 'Connecting...' : 'Accept & Connect'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Primary Parent View Switcher: Day Planner vs Live Progress View */}
      <div className="grid grid-cols-2 bg-[#e2ece0] p-1 rounded-2xl border border-[#d2dfcd] gap-1 shadow-xs">
        <button
          id="guardian-view-planner-btn"
          type="button"
          onClick={() => setGuardianViewMode('planner')}
          className={`py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            guardianViewMode === 'planner'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-stone-700 hover:text-stone-900 hover:bg-white/60'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Day Planner</span>
        </button>
        <button
          id="guardian-view-progress-btn"
          type="button"
          onClick={() => setGuardianViewMode('progress')}
          className={`py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            guardianViewMode === 'progress'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-stone-700 hover:text-stone-900 hover:bg-white/60'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Progress View</span>
        </button>
      </div>

      {guardianViewMode === 'progress' ? (
        <ChildLiveProgressView
          selectedChild={activeChild}
          onSwitchToPlanner={() => setGuardianViewMode('planner')}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {/* Active Child & Settings Shortcut Bar */}
          {linkedChildren.length > 0 ? (
            <div className="flex items-center justify-between gap-3 px-1 py-1 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-stone-500 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-emerald-800" />
                  <span>Planning For:</span>
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {linkedChildren.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => setActiveChildId(child.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                        activeChildId === child.id
                          ? 'bg-emerald-800 text-white shadow-xs'
                          : 'bg-white text-stone-700 hover:bg-emerald-50 border border-[#d5e2cf]'
                      }`}
                    >
                      <User className="w-3 h-3" />
                      <span>{child.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {onNavigateSettings && (
                <button
                  type="button"
                  onClick={onNavigateSettings}
                  className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1.5 ml-auto px-2.5 py-1 rounded-xl bg-white border border-[#d5e2cf] hover:bg-[#edf3ea] transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Settings & Family</span>
                </button>
              )}
            </div>
          ) : (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#e1ebd9] flex items-center justify-between gap-3 flex-wrap shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-stone-900">No Child Linked Yet</h3>
                  <p className="text-[11px] text-stone-500">
                    Configure your children or invite them in Settings to start customizing daily routines.
                  </p>
                </div>
              </div>
              {onNavigateSettings && (
                <button
                  type="button"
                  onClick={onNavigateSettings}
                  className="px-3 py-1.5 bg-emerald-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-900 shadow-xs flex items-center gap-1.5"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Open Settings</span>
                </button>
              )}
            </div>
          )}

          {/* After-Hours Phone Usage Log alert card for Parent */}
          {currentDaySession?.isEnded && currentDaySession.afterEndDayNotes && currentDaySession.afterEndDayNotes.length > 0 && (
            <div className="p-4 rounded-3xl bg-white border border-[#e1ebd9] shadow-xs flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-stone-900">
                  <AlertCircle className="w-4 h-4 text-emerald-800" />
                  <h3 className="font-display text-xs font-bold uppercase tracking-wider">
                    Phone Usage Logged After End Day ({selectedDate})
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab('family_link')}
                  className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                >
                  <span>Family Link Setup</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="flex flex-col gap-1.5 mt-1">
                {currentDaySession.afterEndDayNotes.map((note, index) => (
                  <div
                    key={index}
                    className="px-3 py-2 bg-[#f5f8f3] rounded-xl border border-[#e2ece0] text-xs text-stone-700 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-stone-500" />
                      <span className="font-medium">{note}</span>
                    </div>
                    <span className="text-[10px] text-stone-400">Logged</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex bg-[#e8efe5] p-1 rounded-2xl border border-[#d4e2cf] gap-1 overflow-x-auto">
            <button
              id="guardian-tab-routine"
              onClick={() => setActiveTab('routine')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
                activeTab === 'routine'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Routine ({timeBlocks.length})</span>
            </button>

            <button
              id="guardian-tab-tasks"
              onClick={() => setActiveTab('tasks')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
                activeTab === 'tasks'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              <span>Tasks ({tasks.length})</span>
            </button>

            <button
              id="guardian-tab-classes-log"
              onClick={() => setActiveTab('classes_log')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
                activeTab === 'classes_log'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
              <span>Class Notes ({classComments.length})</span>
            </button>

            <button
              id="guardian-tab-speech"
              onClick={() => setActiveTab('speech')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
                activeTab === 'speech'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Speech ({speechExercises.length})</span>
            </button>

            <button
              id="guardian-tab-review"
              onClick={() => setActiveTab('review')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
                activeTab === 'review'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Review</span>
            </button>

            <button
              id="guardian-tab-family-link"
              onClick={() => setActiveTab('family_link')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
                activeTab === 'family_link'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
              <span>Family Link</span>
            </button>
          </div>

      {/* TAB 1: Routine */}
      {activeTab === 'routine' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-700">
              Repeating Daily Blocks for {activeChild?.name || 'Child'}
            </span>
            <button
              id="add-time-block-btn"
              onClick={handleOpenAddBlock}
              className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Block</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {timeBlocks.length === 0 ? (
              <div className="col-span-full p-8 text-center text-xs text-stone-500 bg-white rounded-2xl border border-[#e1ebd9]">
                No routine blocks added yet. Click &quot;+ Add Block&quot; above to set up daily routines.
              </div>
            ) : (
              timeBlocks
                .slice()
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map((block) => (
                <div
                  key={block.id}
                  className="p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 bg-white border-[#e1ebd9]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#eef5eb] text-emerald-900 flex items-center justify-center shrink-0">
                        {renderCategoryIcon(block.category, 'w-4 h-4')}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-semibold text-stone-900 text-xs sm:text-sm">
                            {block.title}
                          </h4>
                        </div>
                        <p className="text-xs font-medium text-emerald-900 mt-0.5">
                          {block.startTime} – {block.endTime}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditBlock(block)}
                        className="p-1 text-stone-400 hover:text-emerald-800 rounded-lg"
                        aria-label="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteTimeBlock(block.id)}
                        className="p-1 text-stone-400 hover:text-rose-600 rounded-lg"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {(block.category === 'classes' || block.category === 'study') && (
                    <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-amber-50/70 border border-amber-200/80">
                      <div className="flex items-center gap-1.5 text-xs text-amber-900 font-medium">
                        <GraduationCap className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>Teacher &amp; Study Notes</span>
                        {getClassCommentsForBlock(block.id).length > 0 && (
                          <span className="text-[10px] bg-amber-200/70 text-amber-950 font-bold px-1.5 py-0.5 rounded-full">
                            {getClassCommentsForBlock(block.id).length}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFeedbackModalBlock(block);
                          setIsFeedbackModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold flex items-center gap-1 transition-colors shadow-2xs"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Add / View Notes</span>
                      </button>
                    </div>
                  )}

                  {block.notes && (
                    <p className="text-[11px] text-stone-600 bg-[#f7faf5] p-2 rounded-xl border border-[#e4ede0]">
                      {block.notes}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-[#eaf1e7] text-[10px]">
                    <div className="flex items-center gap-1">
                      {DAYS.map((day, idx) => (
                        <span
                          key={day}
                          className={`w-4 h-4 rounded-md flex items-center justify-center font-semibold text-[9px] ${
                            block.daysOfWeek.includes(idx)
                              ? 'bg-emerald-800 text-white'
                              : 'bg-[#edf3ea] text-stone-400'
                          }`}
                        >
                          {day[0]}
                        </span>
                      ))}
                    </div>
                    {block.reminderMinutesBefore ? (
                      <span className="text-stone-500 flex items-center gap-0.5">
                        <Bell className="w-2.5 h-2.5 text-stone-400" />
                        <span>{block.reminderMinutesBefore}m</span>
                      </span>
                    ) : (
                      <span className="text-stone-400">None</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Tasks */}
      {activeTab === 'tasks' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                Organize Children's Tasks
              </h3>
              <p className="text-[11px] text-stone-500">
                Create tasks, assign to specific children, and monitor completion
              </p>
            </div>
            <button
              id="assign-task-btn"
              onClick={() => {
                setTaskChildTarget(activeChildId !== 'all' ? activeChildId : (linkedChildren[0]?.id || 'all'));
                setIsTaskModalOpen(true);
              }}
              className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Assign Task</span>
            </button>
          </div>

          {/* Child Filter Chips */}
          {linkedChildren.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setTaskFilterChildId('all')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors shrink-0 ${
                  taskFilterChildId === 'all'
                    ? 'bg-emerald-800 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                All Children ({tasks.length})
              </button>
              {linkedChildren.map((c) => {
                const count = tasks.filter((t) => t.childId === c.id || t.childEmail === c.email).length;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setTaskFilterChildId(c.id)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors shrink-0 flex items-center gap-1 ${
                      taskFilterChildId === c.id
                        ? 'bg-emerald-800 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    <User className="w-3 h-3" />
                    <span>{c.name} ({count})</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex flex-col gap-2">
            {tasks
              .filter((task) => {
                if (taskFilterChildId === 'all') return true;
                const child = linkedChildren.find((c) => c.id === taskFilterChildId);
                return (
                  task.childId === taskFilterChildId ||
                  (child?.email && task.childEmail === child.email)
                );
              })
              .map((task) => (
              <div
                key={task.id}
                className="p-3 bg-white rounded-2xl border border-[#e1ebd9] flex items-center justify-between gap-3"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div
                    className={`mt-0.5 w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-bold ${
                      task.completed ? 'bg-emerald-800 text-white' : 'border border-stone-300 text-stone-400'
                    }`}
                  >
                    {task.completed && <Check className="w-3 h-3" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-xs sm:text-sm font-semibold truncate ${
                          task.completed ? 'line-through text-stone-400' : 'text-stone-900'
                        }`}
                      >
                        {task.title}
                      </span>
                      {task.priority === 'key_focus' && (
                        <span className="text-[9px] font-semibold bg-emerald-100 text-emerald-950 px-1.5 py-0.2 rounded">
                          Priority Focus
                        </span>
                      )}
                      {task.childName && (
                        <span className="text-[9px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded">
                          For: {task.childName}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-stone-500 flex-wrap">
                      {task.subject && <span>{task.subject}</span>}
                      {task.dueTime && <span>• Due {task.dueTime}</span>}
                      {task.childEmail && (
                        <span className="text-[10px] text-stone-400">({task.childEmail})</span>
                      )}
                    </div>

                    {task.guardianNote && (
                      <p className="mt-1 text-[11px] text-stone-600 italic">
                        "{task.guardianNote}"
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="p-1 text-stone-400 hover:text-rose-600 rounded-lg shrink-0"
                  aria-label="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {tasks.filter((task) => {
              if (taskFilterChildId === 'all') return true;
              const child = linkedChildren.find((c) => c.id === taskFilterChildId);
              return (
                task.childId === taskFilterChildId ||
                (child?.email && task.childEmail === child.email)
              );
            }).length === 0 && (
              <div className="p-6 text-center text-xs text-stone-500 bg-[#edf3ea] rounded-2xl border border-[#d9e5d4]">
                No tasks assigned for this selection. Click "+ Assign Task" above to add one.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: Class Notes & Feedback */}
      {activeTab === 'classes_log' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-emerald-800" />
                <span>Class Notes & Feedback Log</span>
              </h3>
              <p className="text-[11px] text-stone-500">
                Topics covered, homework assigned, and completion logs recorded after class blocks
              </p>
            </div>
            <button
              id="add-class-comment-btn"
              type="button"
              onClick={() => {
                const classBlock = timeBlocks.find((b) => b.category === 'classes') || timeBlocks[0] || {
                  id: 'class-session',
                  title: 'Class Session',
                  category: 'classes',
                  startTime: '08:00',
                  endTime: '09:00',
                  daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
                };
                setFeedbackModalBlock(classBlock);
                setIsFeedbackModalOpen(true);
              }}
              className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Class Note</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-[#d5e2cf] text-xs">
              <span className="text-stone-500 font-medium">Child:</span>
              <select
                value={activeChildId}
                onChange={(e) => setActiveChildId(e.target.value)}
                className="bg-transparent font-semibold text-stone-800 focus:outline-hidden"
              >
                {linkedChildren.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-[#d5e2cf] text-xs">
              <span className="text-stone-500 font-medium">Class / Subject:</span>
              <select
                value={classCommentFilterBlock}
                onChange={(e) => setClassCommentFilterBlock(e.target.value)}
                className="bg-transparent font-semibold text-stone-800 focus:outline-hidden"
              >
                <option value="all">All Classes &amp; Study</option>
                {timeBlocks
                  .filter((b) => b.category === 'classes' || b.category === 'study')
                  .map((b) => (
                    <option key={b.id} value={b.id}>{b.title}</option>
                  ))}
              </select>
            </div>
          </div>

          {/* Comments List */}
          <div className="flex flex-col gap-2.5">
            {classComments
              .filter((comment) => {
                const matchesChild =
                  !activeChildId ||
                  activeChildId === 'all' ||
                  !comment.childId ||
                  comment.childId === activeChildId;
                const matchesBlock =
                  classCommentFilterBlock === 'all' || comment.blockId === classCommentFilterBlock;
                return matchesChild && matchesBlock;
              })
              .length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500 bg-white rounded-2xl border border-[#e1ebd9] flex flex-col items-center gap-2">
                <MessageSquare className="w-8 h-8 text-stone-300" />
                <p className="font-semibold text-stone-700">No class notes logged yet.</p>
                <p className="max-w-md text-stone-500">
                  Teachers or students can log feedback immediately after finishing each class block in their routine, or you can record feedback manually using &quot;Record Class Note&quot; above.
                </p>
              </div>
            ) : (
              classComments
                .filter((comment) => {
                  const matchesChild =
                    !activeChildId ||
                    activeChildId === 'all' ||
                    !comment.childId ||
                    comment.childId === activeChildId;
                  const matchesBlock =
                    classCommentFilterBlock === 'all' || comment.blockId === classCommentFilterBlock;
                  return matchesChild && matchesBlock;
                })
                .slice()
                .reverse()
                .map((comment) => (
                  <div
                    key={comment.id}
                    className="p-4 rounded-2xl bg-white border border-[#e1ebd9] shadow-xs flex flex-col gap-2.5"
                  >
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-stone-900">{comment.blockTitle}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            comment.role === 'teacher'
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : comment.role === 'student'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {comment.role} • {comment.authorName}
                        </span>
                        {comment.childName && (
                          <span className="text-[10px] text-stone-500 bg-[#edf3ea] px-1.5 py-0.5 rounded">
                            Student: {comment.childName}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-stone-400 font-mono">
                          {comment.date} at {comment.timestamp}
                        </span>
                        <button
                          onClick={() => deleteClassComment(comment.id)}
                          className="p-1 text-stone-400 hover:text-rose-600 rounded-lg"
                          title="Delete note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-[#f8faf7] border border-[#e4ede0]">
                        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-0.5">
                          a: Topics Covered
                        </span>
                        <p className="text-stone-800 font-medium whitespace-pre-wrap">
                          {comment.topicsCovered}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#f8faf7] border border-[#e4ede0]">
                        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-0.5">
                          b: Homework Given
                        </span>
                        <p className="text-stone-800 font-medium whitespace-pre-wrap">
                          {comment.homeworkGiven || 'No homework assigned'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#f0f4ed] text-xs flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-stone-500">c: Prev Homework Status:</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                            comment.previousHomeworkFinished === 'yes'
                              ? 'bg-emerald-100 text-emerald-800'
                              : comment.previousHomeworkFinished === 'in_progress'
                              ? 'bg-amber-100 text-amber-800'
                              : comment.previousHomeworkFinished === 'no'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          {comment.previousHomeworkFinished === 'yes'
                            ? 'Finished'
                            : comment.previousHomeworkFinished === 'in_progress'
                            ? 'In Progress'
                            : comment.previousHomeworkFinished === 'no'
                            ? 'Not Finished'
                            : 'None Given'}
                        </span>
                      </div>

                      {comment.optionalComments && (
                        <div className="flex items-center gap-1 text-[11px] text-stone-600 italic">
                          <span className="font-semibold text-stone-500">d: Note:</span>
                          <span>{comment.optionalComments}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Speech Prompts */}
      {activeTab === 'speech' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-700">
              Speech & Articulation Exercises
            </span>
            <button
              id="add-speech-exercise-btn"
              onClick={() => setIsSpeechModalOpen(true)}
              className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Prompt</span>
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            {speechExercises.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500 bg-white rounded-2xl border border-[#e1ebd9]">
                No speech prompts added yet. Click &quot;+ Add Prompt&quot; above to create gentle breathing or reading exercises.
              </div>
            ) : (
              speechExercises.map((ex) => (
              <div
                key={ex.id}
                className="p-3.5 bg-white rounded-2xl border border-[#e1ebd9] flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-emerald-900 bg-[#edf5ea] px-2 py-0.5 rounded">
                      {ex.category || ex.type}
                    </span>
                    <h4 className="font-semibold text-stone-900 text-xs sm:text-sm">
                      {ex.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-xs text-stone-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ex.enabled}
                        onChange={(e) =>
                          updateSpeechExercise(ex.id, { enabled: e.target.checked })
                        }
                        className="rounded text-emerald-800 focus:ring-emerald-500 w-3.5 h-3.5"
                      />
                      <span className="text-[11px]">Active</span>
                    </label>
                    <button
                      onClick={() => deleteSpeechExercise(ex.id)}
                      className="p-1 text-stone-400 hover:text-rose-600"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-stone-700 bg-[#f7faf5] p-2 rounded-xl border border-[#e4ede0]">
                  {ex.content}
                </p>
                {ex.extraNotes && (
                  <p className="text-[11px] text-stone-500 italic">
                    {ex.extraNotes}
                  </p>
                )}
              </div>
            ))
          )}
          </div>
        </div>
      )}

      {/* TAB 4: Weekly Review */}
      {activeTab === 'review' && (
        <div className="bg-white rounded-3xl p-5 border border-[#e1ebd9] flex flex-col gap-3.5">
          <div>
            <h3 className="font-display text-sm font-bold text-stone-900">
              Weekly Review & Reflection
            </h3>
            <p className="text-xs text-stone-500">
              Reflect on weekly habits and calibrate rhythm together
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Parent Notes & Observations
              </label>
              <textarea
                id="guardian-review-notes"
                rows={2}
                value={guardianReviewNote}
                onChange={(e) => setGuardianReviewNote(e.target.value)}
                placeholder="Observations and steady progress..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-[#f7faf5] resize-none focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Child's Highlight & Wins
              </label>
              <textarea
                id="zahid-review-highlight"
                rows={2}
                value={childHighlight}
                onChange={(e) => setChildHighlight(e.target.value)}
                placeholder="What went well this week..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-[#f7faf5] resize-none focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Adjustments for Next Week
              </label>
              <textarea
                id="review-adjustments"
                rows={2}
                value={adjustments}
                onChange={(e) => setAdjustments(e.target.value)}
                placeholder="Time adjustments or gentle shifts..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-[#f7faf5] resize-none focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-stone-100">
              <span className="text-xs text-stone-400">
                {reviewSaved ? 'Saved' : ''}
              </span>
              <button
                id="save-weekly-review-btn"
                onClick={handleSaveReview}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Google Family Link (OS-Level Phone Controls) */}
      {activeTab === 'family_link' && <FamilyLinkGuide />}
        </div>
      )}

      {/* Modal: Add/Edit Block */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/30 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-xl border border-stone-200 flex flex-col gap-3.5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-display text-sm font-bold text-stone-900">
                {editingBlockId ? 'Edit Block' : 'Add Block'}
              </h3>
              <button
                onClick={() => setIsBlockModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBlock} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Title
                </label>
                <input
                  id="block-title-input"
                  type="text"
                  required
                  value={blockTitle}
                  onChange={(e) => setBlockTitle(e.target.value)}
                  placeholder="e.g. Speech Practice, Study"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Start
                  </label>
                  <input
                    id="block-start-input"
                    type="time"
                    required
                    value={blockStart}
                    onChange={(e) => setBlockStart(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    End
                  </label>
                  <input
                    id="block-end-input"
                    type="time"
                    required
                    value={blockEnd}
                    onChange={(e) => setBlockEnd(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Category
                  </label>
                  <select
                    id="block-category-select"
                    value={blockCategory}
                    onChange={(e) => setBlockCategory(e.target.value as TimeBlockCategory)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-white"
                  >
                    <option value="prayer">Prayer</option>
                    <option value="gym">Gym</option>
                    <option value="classes">Classes</option>
                    <option value="meals">Meals</option>
                    <option value="study">Study</option>
                    <option value="reading">Reading</option>
                    <option value="speech">Speech</option>
                    <option value="therapy">Therapy</option>
                    <option value="free_time">Free Time</option>
                    <option value="bath">Bath</option>
                    <option value="bedtime">Bedtime</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Reminder
                  </label>
                  <select
                    id="block-reminder-select"
                    value={blockReminder}
                    onChange={(e) => setBlockReminder(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-white"
                  >
                    <option value="0">None</option>
                    <option value="5">5 min before</option>
                    <option value="10">10 min before</option>
                    <option value="15">15 min before</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Days
                </label>
                <div className="flex items-center gap-1">
                  {DAYS.map((day, idx) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(idx)}
                      className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-all ${
                        blockDays.includes(idx)
                          ? 'bg-emerald-800 text-white'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {day[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Notes (Optional)
                </label>
                <input
                  id="block-notes-input"
                  type="text"
                  value={blockNotes}
                  onChange={(e) => setBlockNotes(e.target.value)}
                  placeholder="Optional guidance or reminder note"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsBlockModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  id="save-block-modal-btn"
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl shadow-xs"
                >
                  Save Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Task */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/30 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-xl border border-stone-200 flex flex-col gap-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-display text-sm font-bold text-stone-900">
                Assign Task
              </h3>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Assign to Child
                </label>
                <select
                  id="task-child-assign-select"
                  value={taskChildTarget}
                  onChange={(e) => setTaskChildTarget(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-white"
                >
                  <option value="all">All Children / General</option>
                  {linkedChildren.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.email ? `(${c.email})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Task Title
                </label>
                <input
                  id="task-title-input"
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Chapter 4 Math exercises"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Subject
                  </label>
                  <input
                    id="task-subject-input"
                    type="text"
                    value={taskSubject}
                    onChange={(e) => setTaskSubject(e.target.value)}
                    placeholder="Math, English..."
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Due Time
                  </label>
                  <input
                    id="task-due-time-input"
                    type="time"
                    value={taskDueTime}
                    onChange={(e) => setTaskDueTime(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Priority
                  </label>
                  <select
                    id="task-priority-select"
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-white"
                  >
                    <option value="gentle">Gentle</option>
                    <option value="normal">Normal</option>
                    <option value="key_focus">Key Focus (Priority)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Reminder
                  </label>
                  <select
                    id="task-reminder-select"
                    value={taskReminder}
                    onChange={(e) => setTaskReminder(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-white"
                  >
                    <option value="0">None</option>
                    <option value="10">10 min before</option>
                    <option value="15">15 min before</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Note to Child
                </label>
                <textarea
                  id="task-guardian-note-input"
                  rows={2}
                  value={taskGuardianNote}
                  onChange={(e) => setTaskGuardianNote(e.target.value)}
                  placeholder="Optional supportive guidance or hints"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  id="save-task-modal-btn"
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl shadow-xs"
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Speech Exercise */}
      {isSpeechModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/30 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-xl border border-stone-200 flex flex-col gap-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-display text-sm font-bold text-stone-900">
                Add Speech Prompt
              </h3>
              <button
                onClick={() => setIsSpeechModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSpeechExercise} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Title
                </label>
                <input
                  id="speech-title-input"
                  type="text"
                  required
                  value={speechTitle}
                  onChange={(e) => setSpeechTitle(e.target.value)}
                  placeholder="e.g. Talking prompt: Favorite Story"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Type
                  </label>
                  <select
                    id="speech-type-select"
                    value={speechType}
                    onChange={(e) => setSpeechType(e.target.value as SpeechExercise['type'])}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-white"
                  >
                    <option value="talking_prompt">Talking Prompt</option>
                    <option value="passage">Reading Passage</option>
                    <option value="word_of_day">Word / Phrase</option>
                    <option value="breathing">Breathing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Tag
                  </label>
                  <input
                    id="speech-category-input"
                    type="text"
                    value={speechCategory}
                    onChange={(e) => setSpeechCategory(e.target.value)}
                    placeholder="Nature, Story..."
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Content
                </label>
                <textarea
                  id="speech-content-input"
                  required
                  rows={3}
                  value={speechContent}
                  onChange={(e) => setSpeechContent(e.target.value)}
                  placeholder="Passage or question text..."
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-white resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Tip (Optional)
                </label>
                <input
                  id="speech-extranotes-input"
                  type="text"
                  value={speechExtraNotes}
                  onChange={(e) => setSpeechExtraNotes(e.target.value)}
                  placeholder="Optional gentle guidance"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsSpeechModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  id="save-speech-modal-btn"
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl shadow-xs"
                >
                  Add Prompt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LINK CHILD INVITATION MODAL */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 p-5 sm:p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-stone-900">
                    Link Child Account
                  </h3>
                  <p className="text-xs text-stone-500">
                    Connect child portal to your parent dashboard
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsLinkModalOpen(false);
                  setInviteStatusMsg(null);
                }}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 leading-relaxed flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong>How linking works:</strong> Send an invite to your child's email. When your child logs into their portal, they will see an invitation banner to <strong>Accept & Connect</strong>. Once accepted, they are linked to your account.
              </div>
            </div>

            {!currentUser ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col gap-2.5 text-xs text-amber-900">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-700" />
                  <span>Sign-in required to link accounts</span>
                </div>
                <p>
                  Please sign in or create an account with Google or email so your invitations can be tracked and accepted securely.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsLinkModalOpen(false);
                    setIsAuthModalOpen(true);
                  }}
                  className="px-3 py-2 bg-emerald-800 text-white rounded-xl font-bold text-xs hover:bg-emerald-900 self-start"
                >
                  Sign In Now
                </button>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!inviteEmail) return;
                  setIsSendingInvite(true);
                  setInviteStatusMsg(null);
                  const res = await sendChildLinkRequest(inviteEmail, inviteName);
                  setIsSendingInvite(false);
                  if (res.success) {
                    setInviteStatusMsg({ type: 'success', text: res.message });
                    setInviteEmail('');
                    setInviteName('');
                  } else {
                    setInviteStatusMsg({ type: 'error', text: res.message });
                  }
                }}
                className="flex flex-col gap-3"
              >
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Child's Account Email <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="e.g. zahid@example.com"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Child's Preferred Name (Optional)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      placeholder="e.g. Zahid"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-hidden"
                    />
                  </div>
                </div>

                {inviteStatusMsg && (
                  <div
                    className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                      inviteStatusMsg.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    {inviteStatusMsg.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <span>{inviteStatusMsg.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSendingInvite}
                  className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingInvite ? 'Sending Request...' : 'Send Link Request'}</span>
                </button>
              </form>
            )}

            {/* SENT INVITATIONS SECTION */}
            {sentLinkRequests && sentLinkRequests.length > 0 && (
              <div className="pt-3 border-t border-stone-200 flex flex-col gap-2">
                <span className="text-xs font-bold text-stone-700">
                  Sent Invitations ({sentLinkRequests.length})
                </span>
                <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-0.5">
                  {sentLinkRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-2.5 rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-between text-xs gap-2"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-stone-800 truncate">
                          {req.childName ? `${req.childName} (${req.childEmail})` : req.childEmail}
                        </span>
                        <div className="flex items-center gap-1 mt-0.5">
                          {req.status === 'pending' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Waiting for child to accept
                            </span>
                          ) : req.status === 'accepted' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                              <Check className="w-3 h-3 text-emerald-600" />
                              Accepted & Linked
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-stone-200 text-stone-600 text-[10px] font-semibold">
                              Declined
                            </span>
                          )}
                        </div>
                      </div>

                      {req.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => cancelLinkRequest(req.id)}
                          className="px-2 py-1 text-[11px] font-medium text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                          title="Cancel Invitation"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Currently Linked Children */}
            <div className="pt-2 border-t border-stone-200 flex flex-col gap-1.5">
              <span className="text-xs font-bold text-stone-700">
                Active Linked Children ({linkedChildren.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {linkedChildren.map((c) => (
                  <div
                    key={c.id}
                    className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center gap-1.5"
                  >
                    <User className="w-3 h-3 text-emerald-700" />
                    <span>{c.name}</span>
                    {c.email && (
                      <span className="text-[10px] text-emerald-700 opacity-75">
                        ({c.email})
                      </span>
                    )}
                    {linkedChildren.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLinkedChild(c.id)}
                        className="text-emerald-700 hover:text-rose-600 ml-1 text-xs"
                        title="Unlink Child"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Class Feedback Modal */}
      {feedbackModalBlock && (
        <ClassFeedbackModal
          isOpen={isFeedbackModalOpen}
          onClose={() => {
            setIsFeedbackModalOpen(false);
            setFeedbackModalBlock(null);
          }}
          block={feedbackModalBlock}
          defaultRole="teacher"
          childId={activeChild?.id}
          childName={activeChild?.name}
          date={selectedDate || todayDateStr}
        />
      )}
    </div>
  );
};
