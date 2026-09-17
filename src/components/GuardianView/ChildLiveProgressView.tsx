import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  Flame,
  GraduationCap,
  Heart,
  Leaf,
  MessageSquare,
  Mic,
  Moon,
  Plus,
  Send,
  Shield,
  Smartphone,
  Sparkles,
  Sun,
  Timer,
  User,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LinkedChild, TimeBlock } from '../../types';
import { ClassFeedbackModal } from '../Common/ClassFeedbackModal';

interface ChildLiveProgressViewProps {
  selectedChild: LinkedChild | undefined;
  onSwitchToPlanner: () => void;
}

export const ChildLiveProgressView: React.FC<ChildLiveProgressViewProps> = ({
  selectedChild,
  onSwitchToPlanner,
}) => {
  const {
    timeBlocks,
    getBlocksForDay,
    tasks,
    getTasksForDate,
    speechLogs,
    readingLogs,
    focusSessions,
    currentDaySession,
    selectedDate,
    todayDateStr,
    getBlockSession,
    testSendReminder,
    triggerCelebration,
    playChime,
    classComments,
  } = useApp();

  const [currentTime, setCurrentTime] = useState<string>(() => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  });

  // Cheer / Encouragement state
  const [cheerMsg, setCheerMsg] = useState('');
  const [isSendingCheer, setIsSendingCheer] = useState(false);
  const [cheerFeedback, setCheerFeedback] = useState<string | null>(null);

  // Class feedback modal state
  const [feedbackBlock, setFeedbackBlock] = useState<TimeBlock | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentTime(
        `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
      );
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const getBlockMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const currentMinutes = getBlockMinutes(currentTime);

  // Selected date Day of Week
  const targetDateStr = selectedDate || todayDateStr;
  const isToday = targetDateStr === todayDateStr;
  const targetDateObj = new Date(targetDateStr + 'T00:00:00');
  const dayOfWeek = targetDateObj.getDay();

  // Filter timeblocks for today & this child
  const allDayBlocks = getBlocksForDay(dayOfWeek);
  const childBlocks = allDayBlocks.filter(
    (b) => !b.childId || b.childId === 'all' || (selectedChild && b.childId === selectedChild.id)
  );

  // Filter tasks for this date & this child
  const allDateTasks = getTasksForDate(targetDateStr);
  const childTasks = allDateTasks.filter(
    (t) => !t.childId || t.childId === 'all' || (selectedChild && t.childId === selectedChild.id)
  );

  // Today's speech & reading & focus logs for this child
  const childSpeechLogs = speechLogs.filter(
    (l) => l.date === targetDateStr && (!l.childId || (selectedChild && l.childId === selectedChild.id))
  );
  const childReadingLogs = readingLogs.filter(
    (l) => l.date === targetDateStr && (!l.childId || (selectedChild && l.childId === selectedChild.id))
  );
  const childFocusSessions = focusSessions.filter(
    (f) => f.date === targetDateStr && (!f.childId || (selectedChild && f.childId === selectedChild.id))
  );

  const totalFocusMinutesToday = childFocusSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalReadingMinutesToday = childReadingLogs.reduce((acc, r) => acc + r.minutesRead, 0);

  // Determine current active block and next block
  let activeBlock: TimeBlock | undefined;
  let nextBlock: TimeBlock | undefined;

  for (let i = 0; i < childBlocks.length; i++) {
    const block = childBlocks[i];
    const startM = getBlockMinutes(block.startTime);
    let endM = getBlockMinutes(block.endTime);
    if (endM < startM) endM += 24 * 60;

    let testCurrent = currentMinutes;
    if (endM > 24 * 60 && currentMinutes < startM) {
      testCurrent += 24 * 60;
    }

    if (testCurrent >= startM && testCurrent < endM) {
      activeBlock = block;
      nextBlock = childBlocks[i + 1];
      break;
    } else if (testCurrent < startM && !nextBlock) {
      nextBlock = block;
    }
  }

  // Calculate completed blocks count
  const completedBlocksCount = childBlocks.filter((b) => {
    const session = getBlockSession(b.id, targetDateStr);
    if (session?.isEnded) return true;
    const endM = getBlockMinutes(b.endTime);
    // If block ended in past today
    return isToday && currentMinutes >= endM;
  }).length;

  const completedTasksCount = childTasks.filter((t) => t.completed).length;

  // Calculate overall day completion percentage
  const totalScoreItems = childBlocks.length + childTasks.length + (childSpeechLogs.length > 0 ? 1 : 0);
  const completedScoreItems = completedBlocksCount + completedTasksCount + (childSpeechLogs.length > 0 ? 1 : 0);
  const completionPercentage =
    totalScoreItems > 0 ? Math.round((completedScoreItems / totalScoreItems) * 100) : 0;

  const handleSendCheer = (customText?: string) => {
    const textToSend = customText || cheerMsg.trim() || 'Super proud of your dedication today! Keep shining ⭐';
    setIsSendingCheer(true);
    testSendReminder('Cheer from Parent 👏', textToSend);
    playChime();
    triggerCelebration();
    setCheerFeedback('Cheer sent to your child!');
    setCheerMsg('');
    setTimeout(() => {
      setIsSendingCheer(false);
      setCheerFeedback(null);
    }, 2500);
  };

  const childDisplayName = selectedChild?.name || 'Selected Child';

  return (
    <div className="flex flex-col gap-4">
      {/* Live Status Header Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#1d3525] to-[#2b4c36] text-white border border-[#1b2f22] shadow-sm flex flex-col gap-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 font-bold text-lg shrink-0">
              {childDisplayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-white">
                  {childDisplayName}'s Live Day
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-emerald-200/80">
                {targetDateObj.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={onSwitchToPlanner}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Open Planner</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Live Day State Bar */}
        <div className="p-2.5 rounded-2xl bg-black/20 border border-emerald-700/30 flex items-center justify-between gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-emerald-800 text-emerald-100">
              {!currentDaySession?.isStarted ? (
                <Sun className="w-3.5 h-3.5" />
              ) : !currentDaySession?.isEnded ? (
                <Clock className="w-3.5 h-3.5" />
              ) : (
                <Moon className="w-3.5 h-3.5" />
              )}
            </div>
            <span className="text-emerald-100 font-medium">
              {!currentDaySession?.isStarted
                ? 'Day session not started yet'
                : !currentDaySession?.isEnded
                ? `Day active since ${currentDaySession.startedAt}`
                : `Day completed at ${currentDaySession.endedAt}`}
            </span>
          </div>

          {activeBlock && (
            <div className="flex items-center gap-1.5 text-emerald-200 text-xs font-semibold">
              <span className="text-stone-300 font-normal">Current:</span>
              <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-400/30 rounded-lg text-white">
                {activeBlock.title} ({activeBlock.startTime} - {activeBlock.endTime})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Metric Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Overall Completion */}
        <div className="p-3.5 rounded-2xl bg-white border border-[#e1ebd9] flex flex-col justify-between gap-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              Day Progress
            </span>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
              {completionPercentage}%
            </span>
          </div>
          <div>
            <div className="text-xl font-bold font-display text-stone-900">
              {completedScoreItems}/{totalScoreItems} <span className="text-xs font-normal text-stone-500">done</span>
            </div>
            <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className="bg-emerald-800 h-full rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tasks Progress */}
        <div className="p-3.5 rounded-2xl bg-white border border-[#e1ebd9] flex flex-col justify-between gap-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              Tasks
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold font-display text-stone-900">
              {completedTasksCount}/{childTasks.length}
            </div>
            <span className="text-[11px] text-stone-500">
              {childTasks.length - completedTasksCount === 0 && childTasks.length > 0
                ? 'All tasks completed'
                : `${childTasks.length - completedTasksCount} remaining`}
            </span>
          </div>
        </div>

        {/* Focus Timer */}
        <div className="p-3.5 rounded-2xl bg-white border border-[#e1ebd9] flex flex-col justify-between gap-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              Focus Time
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800">
              <Timer className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold font-display text-stone-900">
              {totalFocusMinutesToday}m
            </div>
            <span className="text-[11px] text-stone-500">
              {childFocusSessions.length} focus sessions
            </span>
          </div>
        </div>

        {/* Reading & Speech */}
        <div className="p-3.5 rounded-2xl bg-white border border-[#e1ebd9] flex flex-col justify-between gap-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              Speech & Reading
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold font-display text-stone-900">
              {totalReadingMinutesToday}m <span className="text-xs font-normal text-stone-500">read</span>
            </div>
            <span className="text-[11px] text-stone-500">
              {childSpeechLogs.length > 0 ? '✓ Speech completed' : 'Speech pending'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Routine Timeline & Tasks Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Scheduled Routine Blocks Live Tracker */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#e1ebd9] shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-800" />
              <h3 className="font-display text-sm sm:text-base font-bold text-stone-900">
                Routine Timeline
              </h3>
            </div>
            <span className="text-xs text-stone-500 font-medium">
              {completedBlocksCount}/{childBlocks.length} completed
            </span>
          </div>

          {childBlocks.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#f8faf7] border border-dashed border-[#d5e2cf] text-center flex flex-col items-center gap-2 my-2">
              <Clock className="w-8 h-8 text-stone-400" />
              <p className="text-xs text-stone-600 font-medium">
                No routine blocks scheduled for {childDisplayName} on this day.
              </p>
              <button
                type="button"
                onClick={onSwitchToPlanner}
                className="px-3 py-1.5 bg-emerald-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-900 transition-colors shadow-xs"
              >
                Plan Routine Now
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {childBlocks.map((block) => {
                const session = getBlockSession(block.id, targetDateStr);
                const isBlockDone = session?.isEnded || (isToday && currentMinutes >= getBlockMinutes(block.endTime));
                const isBlockActive = activeBlock?.id === block.id;

                return (
                  <div
                    key={block.id}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isBlockActive
                        ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-200'
                        : isBlockDone
                        ? 'bg-[#f8faf7] border-[#e1ebd9] opacity-80'
                        : 'bg-white border-[#e1ebd9]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                          isBlockDone
                            ? 'bg-emerald-100 text-emerald-800'
                            : isBlockActive
                            ? 'bg-emerald-800 text-white animate-pulse'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {isBlockDone ? '✓' : <Clock className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold ${
                              isBlockDone ? 'text-stone-600 line-through' : 'text-stone-900'
                            }`}
                          >
                            {block.title}
                          </span>
                          {block.isFreeScreenTime && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                              Free Time
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-stone-500 block">
                          {block.startTime} – {block.endTime}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-right">
                      {isBlockActive ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-xs flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          <span>Active Now</span>
                        </span>
                      ) : isBlockDone ? (
                        <span className="text-[11px] font-semibold text-emerald-800">
                          Completed
                        </span>
                      ) : (
                        <span className="text-[10px] text-stone-400 font-medium">
                          Scheduled
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Live Tasks Checklist & Live Encouragement */}
        <div className="flex flex-col gap-4">
          {/* Tasks Checklist */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#e1ebd9] shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-800" />
                <h3 className="font-display text-sm sm:text-base font-bold text-stone-900">
                  Key Focus Tasks
                </h3>
              </div>
              <span className="text-xs text-stone-500 font-medium">
                {completedTasksCount}/{childTasks.length} done
              </span>
            </div>

            {childTasks.length === 0 ? (
              <div className="p-5 rounded-2xl bg-[#f8faf7] border border-dashed border-[#d5e2cf] text-center flex flex-col items-center gap-2">
                <CheckCircle2 className="w-7 h-7 text-stone-400" />
                <p className="text-xs text-stone-600 font-medium">
                  No tasks assigned to {childDisplayName} for today.
                </p>
                <button
                  type="button"
                  onClick={onSwitchToPlanner}
                  className="px-3 py-1.5 bg-emerald-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-900 transition-colors shadow-xs"
                >
                  Assign a Task in Planner
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {childTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3 rounded-2xl border transition-all flex items-start justify-between gap-2.5 ${
                      task.completed
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : task.priority === 'key_focus'
                        ? 'bg-amber-50/40 border-amber-200'
                        : 'bg-white border-[#e1ebd9]'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                          task.completed
                            ? 'bg-emerald-600 text-white'
                            : 'border-2 border-stone-300 text-transparent'
                        }`}
                      >
                        ✓
                      </div>
                      <div>
                        <span
                          className={`text-xs font-bold block ${
                            task.completed ? 'text-stone-500 line-through' : 'text-stone-900'
                          }`}
                        >
                          {task.title}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {task.subject && (
                            <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.2 rounded font-medium">
                              {task.subject}
                            </span>
                          )}
                          {task.dueTime && (
                            <span className="text-[10px] text-stone-400 font-mono">
                              Due {task.dueTime}
                            </span>
                          )}
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                              task.priority === 'key_focus'
                                ? 'bg-amber-200 text-amber-900'
                                : 'bg-stone-100 text-stone-600'
                            }`}
                          >
                            {task.priority === 'key_focus' ? 'Key Focus' : task.priority}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        task.completed
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {task.completed ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Cheer / Encouragement Box */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#e1ebd9] shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-stone-900">
                <Heart className="w-4 h-4 text-rose-600" />
                <h3 className="font-display text-sm font-bold">
                  Send Live Encouragement
                </h3>
              </div>
              <span className="text-[10px] text-stone-400">Instantly alerts child</span>
            </div>

            <p className="text-xs text-stone-600">
              Send a gentle high-five or custom praise directly to {childDisplayName}'s screen.
            </p>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => handleSendCheer('Great focus today! So proud of you ⭐')}
                className="px-2.5 py-1 rounded-xl bg-[#f0f6ee] hover:bg-[#e1ebd9] text-emerald-950 text-xs font-semibold border border-[#d5e2cf] transition-colors"
              >
                👏 Great focus!
              </button>
              <button
                type="button"
                onClick={() => handleSendCheer('Take your time and breathe. You’ve got this 🌿')}
                className="px-2.5 py-1 rounded-xl bg-[#f0f6ee] hover:bg-[#e1ebd9] text-emerald-950 text-xs font-semibold border border-[#d5e2cf] transition-colors"
              >
                🌿 You got this!
              </button>
              <button
                type="button"
                onClick={() => handleSendCheer('Keep going, free screen time is earned soon 🎮')}
                className="px-2.5 py-1 rounded-xl bg-[#f0f6ee] hover:bg-[#e1ebd9] text-emerald-950 text-xs font-semibold border border-[#d5e2cf] transition-colors"
              >
                ⭐ Almost there!
              </button>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={cheerMsg}
                onChange={(e) => setCheerMsg(e.target.value)}
                placeholder="Type a loving encouragement note..."
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-hidden"
              />
              <button
                type="button"
                disabled={isSendingCheer || !cheerMsg.trim()}
                onClick={() => handleSendCheer()}
                className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-40 flex items-center gap-1 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </div>

            {cheerFeedback && (
              <p className="text-xs text-emerald-800 font-semibold bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                {cheerFeedback}
              </p>
            )}
          </div>

          {/* Class Feedback & Teacher Activity Logs */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#e1ebd9] shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-800" />
                <h3 className="font-display text-sm sm:text-base font-bold text-stone-900">
                  Classes Feedback & Notes
                </h3>
              </div>
              <span className="text-xs text-stone-500 font-medium">
                {classComments.filter(c => (!selectedChild?.id || c.childId === selectedChild.id || !c.childId) && c.date === selectedDate).length} recorded
              </span>
            </div>

            {/* List of class blocks with quick add or logged comments */}
            {(() => {
              const todayClassBlocks = childBlocks.filter(b => b.category === 'classes' || b.category === 'study');
              const relevantComments = classComments.filter(
                c => (!selectedChild?.id || c.childId === selectedChild.id || !c.childId) && c.date === selectedDate
              );

              return (
                <div className="flex flex-col gap-2.5">
                  {relevantComments.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {relevantComments.map((comment) => (
                        <div
                          key={comment.id}
                          className="p-3 rounded-2xl bg-[#fbfdfa] border border-[#e2ece0] flex flex-col gap-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-stone-900">{comment.blockTitle}</span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                  comment.role === 'teacher'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                    : comment.role === 'student'
                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                    : 'bg-stone-100 text-stone-700'
                                }`}
                              >
                                {comment.role} • {comment.authorName}
                              </span>
                            </div>
                            <span className="text-[10px] text-stone-400 font-mono">
                              {comment.timestamp}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] mt-0.5">
                            <div className="p-1.5 rounded-lg bg-white border border-[#e8efe5]">
                              <span className="font-semibold text-stone-500 block text-[10px]">
                                Topics Covered:
                              </span>
                              <p className="text-stone-800 font-medium">{comment.topicsCovered}</p>
                            </div>

                            <div className="p-1.5 rounded-lg bg-white border border-[#e8efe5]">
                              <span className="font-semibold text-stone-500 block text-[10px]">
                                Homework Given:
                              </span>
                              <p className="text-stone-800 font-medium">
                                {comment.homeworkGiven || 'None assigned'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] pt-1">
                            <div className="flex items-center gap-1">
                              <span className="text-stone-500 text-[10px]">Prev Homework:</span>
                              <span
                                className={`font-semibold px-1.5 py-0.2 rounded text-[10px] ${
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
                                  : 'N/A'}
                              </span>
                            </div>

                            {comment.optionalComments && (
                              <span className="text-stone-500 italic truncate max-w-[200px]" title={comment.optionalComments}>
                                Note: {comment.optionalComments}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-[#f8faf7] border border-dashed border-[#d5e2cf] text-center">
                      <p className="text-xs text-stone-500">
                        No class feedback logged yet for {selectedDate}.
                      </p>
                    </div>
                  )}

                  {/* Quick buttons to add feedback for any class block */}
                  {todayClassBlocks.length > 0 && (
                    <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-semibold text-stone-500">Log Feedback:</span>
                      {todayClassBlocks.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            setFeedbackBlock(b);
                            setIsFeedbackOpen(true);
                          }}
                          className="px-2 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Plus className="w-3 h-3 text-amber-700" />
                          <span>{b.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Evening Downtime Guardrail Note */}
          <div className="p-3.5 rounded-2xl bg-[#f8faf7] border border-[#e1ebd9] flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-emerald-800 shrink-0" />
              <div>
                <span className="font-bold text-stone-800 block">Evening Downtime Guardrail</span>
                <span className="text-[11px] text-stone-500">
                  {currentDaySession?.afterEndDayNotes && currentDaySession.afterEndDayNotes.length > 0
                    ? `${currentDaySession.afterEndDayNotes.length} after-hours activities logged`
                    : 'No late-night screen time recorded today'}
                </span>
              </div>
            </div>

            {currentDaySession?.afterEndDayNotes && currentDaySession.afterEndDayNotes.length > 0 ? (
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px]">
                Active Alert
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-bold text-[10px]">
                Healthy
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Class Feedback Modal */}
      {feedbackBlock && (
        <ClassFeedbackModal
          isOpen={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
          block={feedbackBlock}
          defaultRole="teacher"
          childId={selectedChild?.id}
          childName={selectedChild?.name}
          date={selectedDate}
        />
      )}
    </div>
  );
};
