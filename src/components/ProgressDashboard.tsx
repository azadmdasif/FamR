import React from 'react';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Heart,
  Leaf,
  Mic,
  Sparkles,
  Timer,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ProgressDashboardProps {
  onBack: () => void;
  onOpenReviewModal?: () => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ onBack }) => {
  const {
    stats,
    speechLogs,
    readingLogs,
    focusSessions,
    weeklyReview,
  } = useApp();

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const getDayLetter = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()];
  };

  return (
    <div className="flex flex-col gap-4 pb-16">
      {/* Top back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-semibold text-stone-600 hover:text-emerald-950 bg-[#edf3ea] hover:bg-[#dfeada] px-3 py-1.5 rounded-xl transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Schedule</span>
        </button>
        <span className="text-xs text-stone-500 font-medium">
          Growth & Consistency
        </span>
      </div>

      {/* Hero Banner */}
      <div className="bg-[#284432] text-white rounded-3xl p-5 sm:p-6 shadow-xs border border-[#1e3426] flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-xs text-emerald-200">
          <Leaf className="w-3.5 h-3.5" />
          <span>Steady Pace</span>
        </div>
        <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-white">
          Consistency Over Perfection
        </h2>
        <p className="text-xs text-emerald-200/90 leading-relaxed max-w-md">
          Every breath, page, and completed task matters. Rest days count too.
        </p>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Speech */}
        <div className="p-3.5 rounded-2xl bg-white border border-[#e1ebd9] flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-[#eef5eb] text-emerald-800">
              <Mic className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold text-emerald-900 bg-emerald-100 px-1.5 py-0.2 rounded">
              {stats.speechStreak}d
            </span>
          </div>
          <div>
            <span className="font-display text-xl font-bold text-stone-900">
              {speechLogs.length}
            </span>
            <p className="text-[11px] text-stone-500 font-medium">
              Speech Days
            </p>
          </div>
        </div>

        {/* Focus */}
        <div className="p-3.5 rounded-2xl bg-white border border-[#e1ebd9] flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-[#eef5eb] text-emerald-800">
              <Timer className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold text-emerald-900 bg-emerald-100 px-1.5 py-0.2 rounded">
              {stats.focusStreak}d
            </span>
          </div>
          <div>
            <span className="font-display text-xl font-bold text-stone-900">
              {stats.totalFocusMinutes}m
            </span>
            <p className="text-[11px] text-stone-500 font-medium">
              Study Focus
            </p>
          </div>
        </div>

        {/* Reading */}
        <div className="p-3.5 rounded-2xl bg-white border border-[#e1ebd9] flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-[#eef5eb] text-emerald-800">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold text-emerald-900 bg-emerald-100 px-1.5 py-0.2 rounded">
              {stats.readingStreak}d
            </span>
          </div>
          <div>
            <span className="font-display text-xl font-bold text-stone-900">
              {readingLogs.length}
            </span>
            <p className="text-[11px] text-stone-500 font-medium">
              Reading Logs
            </p>
          </div>
        </div>

        {/* Tasks */}
        <div className="p-3.5 rounded-2xl bg-white border border-[#e1ebd9] flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-[#eef5eb] text-emerald-800">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold text-emerald-900 bg-emerald-100 px-1.5 py-0.2 rounded">
              Done
            </span>
          </div>
          <div>
            <span className="font-display text-xl font-bold text-stone-900">
              {stats.completedTasksCount}
            </span>
            <p className="text-[11px] text-stone-500 font-medium">
              Tasks
            </p>
          </div>
        </div>
      </div>

      {/* 7-Day Consistency Grid */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#e1ebd9] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-800" />
            <h3 className="font-display text-sm font-bold text-stone-900">
              7-Day Rhythm
            </h3>
          </div>
          <span className="text-xs text-stone-400">Past Week</span>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {last7Days.map((dateStr) => {
            const hasSpeech = speechLogs.some((l) => l.date === dateStr);
            const hasReading = readingLogs.some((l) => l.date === dateStr);
            const hasFocus = focusSessions.some((l) => l.date === dateStr);

            return (
              <div
                key={dateStr}
                className="p-2.5 bg-[#f7faf5] rounded-2xl border border-[#e4ede0] flex flex-col items-center gap-1.5 text-center"
              >
                <span className="text-xs font-semibold text-stone-700">
                  {getDayLetter(dateStr)}
                </span>
                <span className="text-[10px] text-stone-400">
                  {dateStr.slice(8)}
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      hasSpeech ? 'bg-emerald-800' : 'bg-stone-200'
                    }`}
                    title="Speech"
                  />
                  <span
                    className={`w-2 h-2 rounded-full ${
                      hasReading ? 'bg-emerald-600' : 'bg-stone-200'
                    }`}
                    title="Reading"
                  />
                  <span
                    className={`w-2 h-2 rounded-full ${
                      hasFocus ? 'bg-emerald-400' : 'bg-stone-200'
                    }`}
                    title="Study"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-4 text-[11px] text-stone-500 pt-2 border-t border-stone-100 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-800" />
            <span>Speech</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span>Reading</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Focus</span>
          </span>
        </div>
      </div>

      {/* Weekly Review Summary */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#e1ebd9] flex flex-col gap-2.5">
        <div className="flex items-center gap-1.5">
          <Heart className="w-4 h-4 text-emerald-800" />
          <h3 className="font-display text-sm font-bold text-stone-900">
            Weekly Notes
          </h3>
        </div>

        <div className="flex flex-col gap-2">
          {weeklyReview.guardianNotes && (
            <div className="p-2.5 bg-[#f7faf5] rounded-xl border border-[#e4ede0] text-xs">
              <span className="font-semibold text-emerald-950 block mb-0.5">
                Guardian Note
              </span>
              <p className="text-stone-700 leading-relaxed">
                {weeklyReview.guardianNotes}
              </p>
            </div>
          )}

          {(weeklyReview.childHighlight || weeklyReview.zahidHighlight) && (
            <div className="p-2.5 bg-[#edf5ea] rounded-xl border border-[#d6e5d2] text-xs">
              <span className="font-semibold text-emerald-950 block mb-0.5">
                Child Highlight
              </span>
              <p className="text-stone-700 leading-relaxed">
                {weeklyReview.childHighlight || weeklyReview.zahidHighlight}
              </p>
            </div>
          )}

          {!weeklyReview.guardianNotes && !weeklyReview.childHighlight && !weeklyReview.zahidHighlight && (
            <p className="text-xs text-stone-500 italic p-3 bg-[#f7faf5] rounded-xl border border-[#e4ede0]">
              No weekly review notes recorded yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
