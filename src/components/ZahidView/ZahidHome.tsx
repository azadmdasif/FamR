import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Bath,
  Bell,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Dumbbell,
  Gamepad2,
  GraduationCap,
  Leaf,
  ListTodo,
  MessageSquare,
  Mic,
  Moon,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  Sun,
  Timer,
  User,
  Utensils,
  HeartHandshake,
  Mail,
  Plus,
  Send,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TimeBlock, TimeBlockCategory } from '../../types';
import { ClassFeedbackModal } from '../Common/ClassFeedbackModal';

interface ZahidHomeProps {
  onOpenTimer: () => void;
  onOpenSpeech: () => void;
  onOpenReading: () => void;
  onOpenProgress: () => void;
}

export const ZahidHome: React.FC<ZahidHomeProps> = ({
  onOpenTimer,
  onOpenSpeech,
  onOpenReading,
  onOpenProgress,
}) => {
  const {
    currentUser,
    userProfile,
    linkedParents,
    pendingLinkRequests,
    respondToLinkRequest,
    sentLinkRequests,
    sendParentLinkRequest,
    cancelLinkRequest,
    selectedDate,
    getBlocksForDay,
    getTasksForChildView,
    toggleTaskCompleted,
    todaySpeechLog,
    readingLogs,
    stats,
    testSendReminder,
    blockSessions,
    startBlock,
    endBlock,
    resetBlockSession,
    getBlockSession,
    getClassCommentsForBlock,
  } = useApp();

  const [isResponding, setIsResponding] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'schedule' | 'tasks'>('schedule');

  // Class Feedback Comments Modal State
  const [feedbackModalBlock, setFeedbackModalBlock] = useState<TimeBlock | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState<boolean>(false);

  // Helper to determine if a block is an academic study/class block where teacher's comments apply
  const isStudyBlock = (block?: { category?: string; title?: string } | null): boolean => {
    if (!block) return false;
    const cat = block.category?.toLowerCase() || '';
    const title = block.title?.toLowerCase() || '';
    return (
      cat === 'study' ||
      cat === 'classes' ||
      title.includes('study') ||
      title.includes('class') ||
      title.includes('tutoring') ||
      title.includes('tutor') ||
      title.includes('homework') ||
      title.includes('lesson')
    );
  };

  const handleEndBlock = (block: TimeBlock) => {
    endBlock(block.id);
    if (isStudyBlock(block)) {
      setFeedbackModalBlock(block);
      setIsFeedbackModalOpen(true);
    }
  };

  // Connect Parent Form State
  const [isAddParentOpen, setIsAddParentOpen] = useState<boolean>(false);
  const [parentEmailInput, setParentEmailInput] = useState<string>('');
  const [parentNameInput, setParentNameInput] = useState<string>('');
  const [parentReqStatus, setParentReqStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSendingParentReq, setIsSendingParentReq] = useState<boolean>(false);

  const [currentTime, setCurrentTime] = useState<string>(() => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentTime(
        `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
      );
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const dayOfWeek = selectedDateObj.getDay();
  const todayBlocks = getBlocksForDay(dayOfWeek);
  const tasks = getTasksForChildView(selectedDate);

  const getBlockMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const currentMinutes = getBlockMinutes(currentTime);

  let activeBlock: TimeBlock | undefined;
  let nextBlock: TimeBlock | undefined;

  for (let i = 0; i < todayBlocks.length; i++) {
    const block = todayBlocks[i];
    const startM = getBlockMinutes(block.startTime);
    let endM = getBlockMinutes(block.endTime);
    if (endM < startM) endM += 24 * 60;

    let testCurrent = currentMinutes;
    if (endM > 24 * 60 && currentMinutes < startM) {
      testCurrent += 24 * 60;
    }

    if (testCurrent >= startM && testCurrent < endM) {
      activeBlock = block;
      nextBlock = todayBlocks[i + 1] || todayBlocks[0];
      break;
    } else if (startM > testCurrent && !nextBlock) {
      nextBlock = block;
    }
  }

  if (!nextBlock && todayBlocks.length > 0) {
    nextBlock = todayBlocks[0];
  }

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

  const completedTasks = tasks.filter((t) => t.completed).length;
  const pendingTasks = tasks.filter((t) => !t.completed);

  const todayReadingLogged = readingLogs.some((l) => l.date === selectedDate);
  const speechDone = todaySpeechLog?.completed;
  const speechSkipped = todaySpeechLog?.skippedGentle;

  // Active block session status
  const activeBlockSession = activeBlock ? getBlockSession(activeBlock.id, selectedDate) : undefined;

  // Calculate remaining minutes in current active block if active
  let minutesLeftInActiveBlock: number | null = null;
  if (activeBlock) {
    const startM = getBlockMinutes(activeBlock.startTime);
    let endM = getBlockMinutes(activeBlock.endTime);
    if (endM < startM) endM += 24 * 60;
    let testCurrent = currentMinutes;
    if (endM > 24 * 60 && currentMinutes < startM) {
      testCurrent += 24 * 60;
    }
    minutesLeftInActiveBlock = Math.max(0, endM - testCurrent);
  }

  return (
    <div className="flex flex-col gap-3.5 pb-12">
      {/* 0. PARENT & FAMILY CONNECTION REQUESTS */}
      {pendingLinkRequests.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {pendingLinkRequests.map((req) => {
            const isChildRequesting = req.type === 'child_requests_parent';
            return (
              <div
                key={req.id}
                className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#1b3824] to-[#264e33] text-white border-2 border-emerald-400 shadow-md flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-700/80 border border-emerald-400/40 flex items-center justify-center text-emerald-100 shrink-0 shadow-xs">
                      <HeartHandshake className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        {isChildRequesting ? 'Child Connection Request' : 'Parent Connection Request'}
                      </span>
                      <h3 className="font-display text-base sm:text-lg font-bold text-white mt-0.5">
                        {isChildRequesting
                          ? `${req.childName || 'Child'} wants to connect with you`
                          : `${req.parentName || 'Parent'} wants to connect with you`}
                      </h3>
                      <p className="text-xs text-emerald-100/90 mt-0.5 leading-relaxed">
                        {isChildRequesting ? (
                          <>
                            Child email: <strong className="text-white underline">{req.childEmail}</strong>
                            <br />
                            Accepting links them to your parent view so you can organise their tasks and schedules.
                          </>
                        ) : (
                          <>
                            Parent email: <strong className="text-white underline">{req.parentEmail}</strong>
                            <br />
                            Accepting links your routine schedule and daily tasks with their parent portal.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-emerald-700/60 justify-end">
                  <button
                    type="button"
                    disabled={isResponding === req.id}
                    onClick={async () => {
                      setIsResponding(req.id);
                      await respondToLinkRequest(req.id, false);
                      setIsResponding(null);
                    }}
                    className="px-3.5 py-1.5 rounded-xl border border-emerald-600/60 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-200 text-xs font-semibold transition-all disabled:opacity-50"
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    disabled={isResponding === req.id}
                    onClick={async () => {
                      setIsResponding(req.id);
                      await respondToLinkRequest(req.id, true);
                      setIsResponding(null);
                    }}
                    className="px-4 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-stone-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{isResponding === req.id ? 'Connecting...' : 'Accept & Connect'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 1. PRESENT BLOCK (Hero Card) */}
      <div className="bg-[#213b2a] text-white rounded-3xl p-4 sm:p-5 shadow-sm border border-[#182e20] flex flex-col gap-3.5">
        {/* Header Bar: Time indicator only (streak removed) */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-200 text-xs font-semibold border border-emerald-700/50">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Now • {currentTime}</span>
          </div>

          {activeBlockSession?.status === 'in_progress' && (
            <span className="text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
              In Progress
            </span>
          )}
          {activeBlockSession?.status === 'completed' && (
            <span className="text-[11px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Check className="w-3 h-3" />
              Completed
            </span>
          )}
        </div>

        {/* Present Block Details & Direct Start/End Block Controls */}
        <div className="flex flex-col gap-3 bg-emerald-950/50 p-3.5 sm:p-4 rounded-2xl border border-emerald-700/40">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-emerald-700/70 border border-emerald-500/40 flex items-center justify-center text-emerald-100 shrink-0 shadow-xs">
                {activeBlock ? renderCategoryIcon(activeBlock.category, 'w-6 h-6') : <Sparkles className="w-6 h-6 text-emerald-200" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-white truncate">
                    {activeBlock ? activeBlock.title : 'Free Rhythm'}
                  </h2>
                  <span className="text-[10px] font-bold bg-white/15 text-emerald-200 border border-white/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    Present Block
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-emerald-200 font-medium mt-0.5">
                  {activeBlock
                    ? `${activeBlock.startTime} – ${activeBlock.endTime} ${
                        minutesLeftInActiveBlock !== null ? `(${minutesLeftInActiveBlock}m remaining)` : ''
                      }`
                    : 'Rest, recharge, or self-directed pace'}
                </p>
              </div>
            </div>
          </div>

          {activeBlock?.notes && (
            <p className="text-xs text-emerald-100/90 bg-emerald-900/60 p-2.5 rounded-xl border border-emerald-700/40 leading-relaxed">
              {activeBlock.notes}
            </p>
          )}

          {/* Start & End Block Action Controls for the Present Block */}
          {activeBlock && (
            <div className="pt-2 border-t border-emerald-700/40 flex items-center justify-between gap-2 flex-wrap">
              <div className="text-xs text-emerald-200 font-medium">
                {!activeBlockSession || activeBlockSession.status === 'not_started' ? (
                  <span>Ready to start this block</span>
                ) : activeBlockSession.status === 'in_progress' ? (
                  <span className="text-emerald-300 font-semibold">
                    Started at {activeBlockSession.startedAt}
                  </span>
                ) : (
                  <span className="text-emerald-300">
                    Finished at {activeBlockSession.endedAt}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {isStudyBlock(activeBlock) && (
                  <button
                    id="hero-teacher-notes-btn"
                    onClick={() => {
                      setFeedbackModalBlock(activeBlock);
                      setIsFeedbackModalOpen(true);
                    }}
                    className="px-3 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                    title="Teacher's comments & progress notes"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>
                      Teacher&apos;s Comments
                      {getClassCommentsForBlock(activeBlock.id, selectedDate).length > 0
                        ? ` (${getClassCommentsForBlock(activeBlock.id, selectedDate).length})`
                        : ''}
                    </span>
                  </button>
                )}

                {!activeBlockSession || activeBlockSession.status === 'not_started' ? (
                  <button
                    id="hero-start-block-btn"
                    onClick={() => startBlock(activeBlock.id)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Block</span>
                  </button>
                ) : activeBlockSession.status === 'in_progress' ? (
                  <button
                    id="hero-end-block-btn"
                    onClick={() => handleEndBlock(activeBlock)}
                    className="px-4 py-2 bg-white hover:bg-stone-100 text-stone-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>End Block</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 rounded-xl text-xs font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Block Completed</span>
                    </span>
                    <button
                      onClick={() => resetBlockSession(activeBlock.id)}
                      className="p-1.5 bg-white/10 hover:bg-white/20 text-emerald-200 rounded-lg text-xs transition-colors"
                      title="Restart block"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Next Block Preview */}
        {nextBlock && (
          <div className="flex items-center justify-between pt-1 border-t border-emerald-700/40 text-xs text-emerald-200/90">
            <span className="flex items-center gap-1.5 truncate">
              <Clock className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span className="truncate">Next: {nextBlock.title} ({nextBlock.startTime})</span>
            </span>
            <button
              onClick={() =>
                testSendReminder(
                  `Upcoming: ${nextBlock?.title}`,
                  `Starts at ${nextBlock?.startTime}`
                )
              }
              className="text-[11px] text-emerald-300 hover:text-white flex items-center gap-1 shrink-0 ml-2 font-medium"
            >
              <Bell className="w-3 h-3" />
              <span>Reminder</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. UNFINISHED TASK LIST (Comes immediately after the present block) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white text-stone-900 shadow-xs border border-[#e1ebd9] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#eef5eb] text-emerald-800 flex items-center justify-center">
              <ListTodo className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold text-stone-900">
                Unfinished Tasks
              </h3>
              <p className="text-[11px] text-stone-500">
                {pendingTasks.length === 0
                  ? 'All tasks completed for today'
                  : `${pendingTasks.length} pending task${pendingTasks.length > 1 ? 's' : ''} remaining`}
              </p>
            </div>
          </div>

          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              pendingTasks.length === 0
                ? 'bg-emerald-100 text-emerald-900'
                : 'bg-stone-100 text-stone-700'
            }`}
          >
            {completedTasks}/{tasks.length} Done
          </span>
        </div>

        {pendingTasks.length > 0 ? (
          <div className="flex flex-col gap-2">
            {pendingTasks.map((task) => {
              const isKeyFocus = task.priority === 'key_focus';
              return (
                <div
                  key={task.id}
                  className={`p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                    isKeyFocus
                      ? 'bg-[#f4f9f2] border-emerald-300 ring-1 ring-emerald-300/40'
                      : 'bg-[#fafcf9] border-[#e2ede0] hover:border-emerald-400'
                  }`}
                >
                  <button
                    id={`unfinished-task-toggle-${task.id}`}
                    onClick={() => toggleTaskCompleted(task.id)}
                    className="mt-0.5 w-5 h-5 rounded-lg border-2 border-emerald-700 hover:bg-emerald-100 bg-white flex items-center justify-center transition-all shrink-0 active:scale-90"
                    title="Mark task completed"
                  >
                    {task.completed && <CheckCircle2 className="w-4 h-4 text-emerald-800" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs sm:text-sm font-semibold text-stone-900 block leading-tight">
                        {task.title}
                      </span>
                      {isKeyFocus && (
                        <span className="text-[10px] font-bold text-emerald-900 bg-emerald-200/90 px-2 py-0.5 rounded-md shrink-0">
                          Priority Focus
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {task.subject && (
                        <span className="text-[10px] font-medium bg-[#eaf3e7] text-emerald-950 px-2 py-0.5 rounded-md">
                          {task.subject}
                        </span>
                      )}
                      {task.dueTime && (
                        <span className="text-[10px] text-stone-600 flex items-center gap-1 bg-stone-100 px-2 py-0.5 rounded-md">
                          <Clock className="w-2.5 h-2.5" />
                          <span>Due {task.dueTime}</span>
                        </span>
                      )}
                    </div>

                    {task.guardianNote && (
                      <p className="mt-2 p-2 bg-white rounded-xl border border-[#e2ece0] text-xs text-stone-600 leading-relaxed">
                        {task.guardianNote}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-[#edf5eb] border border-emerald-200 flex items-center gap-3 text-xs text-emerald-950 font-medium">
            <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-emerald-950">Great job! All tasks completed.</p>
              <p className="text-emerald-800/90 text-[11px]">You are all caught up on scheduled assignments and tasks for today.</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Action Hub */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Timer */}
        <button
          id="zahid-quick-timer-btn"
          onClick={onOpenTimer}
          className="p-3 rounded-2xl bg-white border border-[#e1ebd9] hover:border-emerald-500 shadow-xs transition-all text-left flex flex-col justify-between gap-2 group active:scale-98"
        >
          <div className="flex items-center justify-between w-full">
            <div className="p-2 rounded-xl bg-[#eef5eb] text-emerald-800 group-hover:bg-emerald-800 group-hover:text-white transition-colors">
              <Timer className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-medium text-stone-500">
              15-40m
            </span>
          </div>
          <div>
            <h4 className="font-display text-xs sm:text-sm font-bold text-stone-900">
              Focus
            </h4>
            <p className="text-[11px] text-stone-500">Study timer</p>
          </div>
        </button>

        {/* Speech */}
        <button
          id="zahid-quick-speech-btn"
          onClick={onOpenSpeech}
          className={`p-3 rounded-2xl border shadow-xs transition-all text-left flex flex-col justify-between gap-2 group active:scale-98 ${
            speechDone
              ? 'bg-[#edf5eb] border-emerald-400'
              : speechSkipped
              ? 'bg-stone-100 border-stone-300'
              : 'bg-white border-[#e1ebd9] hover:border-emerald-500'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <div
              className={`p-2 rounded-xl transition-colors ${
                speechDone
                  ? 'bg-emerald-800 text-white'
                  : 'bg-[#eef5eb] text-emerald-800 group-hover:bg-emerald-800 group-hover:text-white'
              }`}
            >
              <Mic className="w-4 h-4" />
            </div>
            {speechDone && (
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-md">
                Done
              </span>
            )}
            {speechSkipped && (
              <span className="text-[10px] font-medium text-stone-600 bg-stone-200 px-1.5 py-0.2 rounded-md">
                Rest
              </span>
            )}
          </div>
          <div>
            <h4 className="font-display text-xs sm:text-sm font-bold text-stone-900">
              Speech
            </h4>
            <p className="text-[11px] text-stone-500">Practice</p>
          </div>
        </button>

        {/* Reading */}
        <button
          id="zahid-quick-reading-btn"
          onClick={onOpenReading}
          className={`p-3 rounded-2xl border shadow-xs transition-all text-left flex flex-col justify-between gap-2 group active:scale-98 ${
            todayReadingLogged
              ? 'bg-[#edf5eb] border-emerald-400'
              : 'bg-white border-[#e1ebd9] hover:border-emerald-500'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <div
              className={`p-2 rounded-xl transition-colors ${
                todayReadingLogged
                  ? 'bg-emerald-800 text-white'
                  : 'bg-[#eef5eb] text-emerald-800 group-hover:bg-emerald-800 group-hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
            </div>
            {todayReadingLogged && (
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-md">
                Logged
              </span>
            )}
          </div>
          <div>
            <h4 className="font-display text-xs sm:text-sm font-bold text-stone-900">
              Reading
            </h4>
            <p className="text-[11px] text-stone-500">Daily log</p>
          </div>
        </button>

        {/* Growth */}
        <button
          id="zahid-quick-progress-btn"
          onClick={onOpenProgress}
          className="p-3 rounded-2xl bg-white border border-[#e1ebd9] hover:border-emerald-500 shadow-xs transition-all text-left flex flex-col justify-between gap-2 group active:scale-98"
        >
          <div className="flex items-center justify-between w-full">
            <div className="p-2 rounded-xl bg-[#eef5eb] text-emerald-800 group-hover:bg-emerald-800 group-hover:text-white transition-colors">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-medium text-stone-500">
              {stats.focusStreak}d
            </span>
          </div>
          <div>
            <h4 className="font-display text-xs sm:text-sm font-bold text-stone-900">
              Growth
            </h4>
            <p className="text-[11px] text-stone-500">Streak review</p>
          </div>
        </button>
      </div>

      {/* Connected Parents & Family Section */}
      <div className="p-3.5 sm:p-4 rounded-3xl bg-white border border-[#e1ebd9] shadow-xs flex flex-col gap-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#eef5eb] text-emerald-800 flex items-center justify-center">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-stone-900">
                Connected Parents & Guardians
              </h4>
              <p className="text-[11px] text-stone-500">
                {linkedParents.length === 0
                  ? 'No parents linked yet. Invite a parent to coordinate your tasks!'
                  : `${linkedParents.length} connected guardian(s)`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsAddParentOpen(!isAddParentOpen);
              setParentReqStatus(null);
            }}
            className="px-2.5 py-1 bg-[#edf5ea] hover:bg-[#e1ebd9] text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAddParentOpen ? 'Close' : 'Connect Parent'}</span>
          </button>
        </div>

        {/* Existing Linked Parents list */}
        {linkedParents.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {linkedParents.map((parent) => (
              <div
                key={parent.id}
                className="px-2.5 py-1 rounded-xl bg-[#f5f8f3] border border-[#e2ece0] text-xs flex items-center gap-1.5 text-stone-800"
              >
                <User className="w-3 h-3 text-emerald-700" />
                <span className="font-semibold">{parent.name}</span>
                <span className="text-[10px] text-stone-500">({parent.email})</span>
                <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1 rounded">
                  Linked
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Pending Sent Requests to Parents */}
        {sentLinkRequests &&
          sentLinkRequests.filter((r) => r.type === 'child_requests_parent' && r.status === 'pending').length > 0 && (
            <div className="flex flex-col gap-1 pt-1">
              <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                Pending Parent Invitations
              </span>
              {sentLinkRequests
                .filter((r) => r.type === 'child_requests_parent' && r.status === 'pending')
                .map((req) => (
                  <div
                    key={req.id}
                    className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-amber-700" />
                      <span className="text-stone-700">
                        Waiting for <strong>{req.parentEmail}</strong> to accept
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => cancelLinkRequest(req.id)}
                      className="text-[10px] text-stone-500 hover:text-rose-600 font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
            </div>
          )}

        {/* Add Parent inline form */}
        {isAddParentOpen && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!parentEmailInput.trim()) return;
              setIsSendingParentReq(true);
              setParentReqStatus(null);
              const res = await sendParentLinkRequest(
                parentEmailInput.trim().toLowerCase(),
                parentNameInput.trim() || undefined
              );
              setIsSendingParentReq(false);
              if (res.success) {
                setParentReqStatus({
                  type: 'success',
                  text: `Request sent to ${parentEmailInput}! They can accept in their parent portal.`,
                });
                setParentEmailInput('');
                setParentNameInput('');
              } else {
                setParentReqStatus({
                  type: 'error',
                  text: res.message || 'Failed to send request.',
                });
              }
            }}
            className="p-3 bg-[#f7faf5] rounded-2xl border border-[#e2ece0] flex flex-col gap-2.5 mt-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-800">
                Send Parent Connection Request
              </span>
              <span className="text-[10px] text-stone-400">Direct email invite</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="email"
                required
                placeholder="Parent's email address"
                value={parentEmailInput}
                onChange={(e) => setParentEmailInput(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
              <input
                type="text"
                placeholder="Nickname (e.g. Mom, Dad - optional)"
                value={parentNameInput}
                onChange={(e) => setParentNameInput(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            {parentReqStatus && (
              <div
                className={`p-2 rounded-xl text-xs ${
                  parentReqStatus.type === 'success'
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {parentReqStatus.text}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddParentOpen(false)}
                className="px-3 py-1 text-xs text-stone-600 hover:bg-stone-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSendingParentReq}
                className="px-3.5 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs disabled:opacity-50"
              >
                <Send className="w-3 h-3" />
                <span>{isSendingParentReq ? 'Sending...' : 'Send Request'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Mobile Tab Switcher */}
      <div className="flex lg:hidden bg-[#e8efe5] p-1 rounded-2xl border border-[#d4e2cf] gap-1">
        <button
          id="mobile-tab-schedule"
          onClick={() => setActiveTab('schedule')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'schedule'
              ? 'bg-white text-emerald-950 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Full Schedule ({todayBlocks.length})</span>
        </button>

        <button
          id="mobile-tab-tasks"
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'tasks'
              ? 'bg-white text-emerald-950 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <ListTodo className="w-3.5 h-3.5" />
          <span>All Tasks ({completedTasks}/{tasks.length})</span>
        </button>
      </div>

      {/* Two-Column Section: Schedule with Start/End per Block & All Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Daily Schedule (7 cols) - With START & END BLOCK on each block */}
        <div
          className={`lg:col-span-7 flex flex-col gap-2 ${
            activeTab === 'schedule' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-800" />
              <h3 className="font-display text-xs font-bold text-stone-900 uppercase tracking-wider">
                Routine Schedule
              </h3>
            </div>
            <span className="text-xs text-stone-500 font-medium">
              {todayBlocks.length} blocks
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {todayBlocks.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#edf3ea] border border-[#d9e5d4] text-center text-stone-500 text-xs">
                No routine blocks scheduled for this day yet.
              </div>
            ) : (
              todayBlocks.map((block) => {
              const isActive = activeBlock?.id === block.id;
              const session = getBlockSession(block.id, selectedDate);
              const isBlockInProgress = session?.status === 'in_progress';
              const isBlockCompleted = session?.status === 'completed';

              return (
                <div
                  key={block.id}
                  className={`p-3 rounded-2xl border transition-all flex flex-col gap-2.5 ${
                    isBlockInProgress
                      ? 'bg-[#eaf4e8] border-emerald-500 ring-2 ring-emerald-500/30 shadow-xs'
                      : isBlockCompleted
                      ? 'bg-[#f4f7f2] border-[#d8e2d4] opacity-90'
                      : isActive
                      ? 'bg-[#f0f6ee] border-emerald-400'
                      : 'bg-white border-[#e1ebd9] hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isBlockInProgress
                            ? 'bg-emerald-800 text-white'
                            : isBlockCompleted
                            ? 'bg-emerald-700 text-white'
                            : isActive
                            ? 'bg-emerald-700 text-white'
                            : 'bg-[#eef5eb] text-emerald-900'
                        }`}
                      >
                        {renderCategoryIcon(block.category, 'w-4 h-4')}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs sm:text-sm font-semibold text-stone-900 truncate">
                            {block.title}
                          </span>
                          {isActive && (
                            <span className="text-[9px] font-bold bg-emerald-800 text-white px-1.5 py-0.2 rounded">
                              Now
                            </span>
                          )}
                          {isBlockInProgress && (
                            <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-800 border border-emerald-400 px-1.5 py-0.2 rounded">
                              In Progress • {session?.startedAt}
                            </span>
                          )}
                          {isBlockCompleted && (
                            <span className="text-[9px] font-bold bg-emerald-100 text-emerald-900 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" />
                              Done • {session?.endedAt}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                          {block.startTime} – {block.endTime}
                          {block.notes ? ` • ${block.notes}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {block.reminderMinutesBefore && block.reminderMinutesBefore > 0 && (
                        <button
                          onClick={() =>
                            testSendReminder(
                              `Reminder: ${block.title}`,
                              `Starts in ${block.reminderMinutesBefore}m`
                            )
                          }
                          className="p-1.5 rounded-lg text-stone-400 hover:text-emerald-800 hover:bg-[#edf3ea] transition-colors"
                          title={`${block.reminderMinutesBefore}m reminder`}
                        >
                          <Bell className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* START / END BLOCK CONTROLS ON EACH BLOCK */}
                  <div className="pt-2 border-t border-[#e2ece0] flex items-center justify-between gap-2">
                    <div className="text-[11px] text-stone-500">
                      {!session || session.status === 'not_started' ? (
                        <span>Scheduled</span>
                      ) : session.status === 'in_progress' ? (
                        <span className="text-emerald-800 font-medium">Session in progress</span>
                      ) : (
                        <span className="text-stone-600">Completed at {session.endedAt}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isStudyBlock(block) && (
                        <button
                          id={`teacher-comment-btn-${block.id}`}
                          type="button"
                          onClick={() => {
                            setFeedbackModalBlock(block);
                            setIsFeedbackModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs"
                          title="Teacher's comments & progress notes"
                        >
                          <MessageSquare className="w-3 h-3 text-amber-700" />
                          <span>
                            Teacher&apos;s Comments
                            {getClassCommentsForBlock(block.id, selectedDate).length > 0
                              ? ` (${getClassCommentsForBlock(block.id, selectedDate).length})`
                              : ''}
                          </span>
                        </button>
                      )}

                      {!session || session.status === 'not_started' ? (
                        <button
                          id={`start-block-${block.id}`}
                          onClick={() => startBlock(block.id)}
                          className="px-3 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-all active:scale-95"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Start Block</span>
                        </button>
                      ) : session.status === 'in_progress' ? (
                        <button
                          id={`end-block-${block.id}`}
                          onClick={() => handleEndBlock(block)}
                          className="px-3 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-all active:scale-95"
                        >
                          <Square className="w-3 h-3 fill-current" />
                          <span>End Block</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => resetBlockSession(block.id)}
                          className="px-2.5 py-1 bg-[#edf3ea] hover:bg-[#e1ebd9] text-stone-700 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors"
                          title="Restart block"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restart</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline summary of teacher comments if logged for this study block on this date */}
                  {isStudyBlock(block) && getClassCommentsForBlock(block.id, selectedDate).length > 0 && (
                    <div className="mt-1 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex flex-col gap-1 text-xs">
                      <div className="flex items-center justify-between gap-1 text-[11px] font-bold text-amber-950">
                        <span className="flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-amber-700" />
                          <span>Teacher&apos;s Notes ({getClassCommentsForBlock(block.id, selectedDate).length})</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setFeedbackModalBlock(block);
                            setIsFeedbackModalOpen(true);
                          }}
                          className="text-[10px] text-amber-800 hover:text-amber-950 font-semibold underline"
                        >
                          View all / add
                        </button>
                      </div>
                      {(() => {
                        const comments = getClassCommentsForBlock(block.id, selectedDate);
                        const latest = comments[comments.length - 1];
                        return (
                          <div className="text-stone-700 text-[11px] flex flex-col gap-0.5">
                            <p>
                              <strong className="text-stone-900 font-semibold">Topics:</strong> {latest.topicsCovered}
                            </p>
                            {latest.homeworkGiven && (
                              <p className="text-amber-900 font-medium">
                                <strong>Homework:</strong> {latest.homeworkGiven}
                              </p>
                            )}
                            {latest.optionalComments && (
                              <p className="text-stone-600 italic">
                                &quot;{latest.optionalComments}&quot;
                              </p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })
          )}
          </div>
        </div>

        {/* All Tasks (5 cols) */}
        <div
          className={`lg:col-span-5 flex flex-col gap-2 ${
            activeTab === 'tasks' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ListTodo className="w-4 h-4 text-emerald-800" />
              <h3 className="font-display text-xs font-bold text-stone-900 uppercase tracking-wider">
                All Tasks
              </h3>
            </div>
            <span className="text-xs text-stone-500 font-medium">
              {completedTasks}/{tasks.length} Completed
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            {tasks.length === 0 ? (
              <div className="p-4 rounded-2xl bg-[#edf3ea] border border-[#d9e5d4] text-center text-stone-500 text-xs">
                No tasks for today.
              </div>
            ) : (
              tasks.map((task) => {
                const isKeyFocus = task.priority === 'key_focus';
                return (
                  <div
                    key={task.id}
                    className={`p-2.5 rounded-2xl border transition-all ${
                      task.completed
                        ? 'bg-stone-100/70 border-stone-200 opacity-70'
                        : isKeyFocus
                        ? 'bg-[#edf5eb] border-emerald-300'
                        : 'bg-white border-[#e1ebd9] hover:border-emerald-400'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <button
                        id={`all-task-toggle-${task.id}`}
                        onClick={() => toggleTaskCompleted(task.id)}
                        className={`mt-0.5 w-4 h-4 rounded-md flex items-center justify-center transition-colors ${
                          task.completed
                            ? 'bg-emerald-800 text-white'
                            : 'border border-stone-300 hover:border-emerald-600 bg-white'
                        }`}
                        aria-label="Toggle task"
                      >
                        {task.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <span
                          className={`text-xs font-semibold block leading-tight ${
                            task.completed ? 'line-through text-stone-400' : 'text-stone-900'
                          }`}
                        >
                          {task.title}
                        </span>

                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {task.subject && (
                            <span className="text-[10px] bg-[#f0f4ed] text-emerald-950 px-1.5 py-0.2 rounded">
                              {task.subject}
                            </span>
                          )}
                          {task.dueTime && (
                            <span className="text-[10px] text-stone-500 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              <span>{task.dueTime}</span>
                            </span>
                          )}
                          {isKeyFocus && !task.completed && (
                            <span className="text-[10px] font-semibold text-emerald-900 bg-emerald-100 px-1.5 py-0.2 rounded">
                              Priority
                            </span>
                          )}
                          {task.assignedByName && (
                            <span className="text-[10px] font-medium text-emerald-900 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.2 rounded">
                              From: {task.assignedByName}
                            </span>
                          )}
                        </div>

                        {task.guardianNote && (
                          <p className="mt-1 p-1.5 bg-[#f4f8f2] rounded-lg border border-[#e2ece0] text-[11px] text-stone-600">
                            {task.guardianNote}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Class / Study Feedback Modal */}
      {feedbackModalBlock && (
        <ClassFeedbackModal
          isOpen={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
          block={feedbackModalBlock}
          defaultRole="teacher"
          childId={currentUser?.uid}
          childName={userProfile?.displayName}
          date={selectedDate}
        />
      )}
    </div>
  );
};

