import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  HelpCircle,
  MessageSquare,
  Plus,
  Send,
  Trash2,
  User,
  X,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ClassFeedbackComment, TimeBlock } from '../../types';

interface ClassFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  block: TimeBlock | { id: string; title: string; category?: string };
  defaultRole?: 'teacher' | 'student' | 'parent';
  childId?: string;
  childName?: string;
  date?: string;
}

export const ClassFeedbackModal: React.FC<ClassFeedbackModalProps> = ({
  isOpen,
  onClose,
  block,
  defaultRole,
  childId,
  childName,
  date,
}) => {
  const {
    currentUser,
    userProfile,
    selectedDate,
    todayDateStr,
    classComments,
    addClassComment,
    deleteClassComment,
    addTask,
    linkedChildren,
  } = useApp();

  const effectiveDate = date || selectedDate || todayDateStr;
  const now = new Date();
  const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const resolvedChild =
    linkedChildren.find((c) => c.id === childId) ||
    linkedChildren[0] || { id: 'default', name: childName || 'Student' };

  // Form state
  const initialAuthorRole: 'teacher' | 'student' | 'parent' =
    defaultRole || (userProfile?.role === 'parent' ? 'teacher' : 'student');

  const [authorRole, setAuthorRole] = useState<'teacher' | 'student' | 'parent'>(initialAuthorRole);
  const [authorName, setAuthorName] = useState<string>(
    userProfile?.displayName || (initialAuthorRole === 'teacher' ? 'Teacher' : resolvedChild.name || 'Student')
  );
  const [activityDate, setActivityDate] = useState<string>(effectiveDate);
  const [activityTime, setActivityTime] = useState<string>(currentTimeStr);
  const [topicsCovered, setTopicsCovered] = useState<string>('');
  const [homeworkGiven, setHomeworkGiven] = useState<string>('');
  const [previousHomeworkFinished, setPreviousHomeworkFinished] = useState<'yes' | 'no' | 'partial' | 'n/a'>('yes');
  const [optionalComments, setOptionalComments] = useState<string>('');
  const [autoCreateTask, setAutoCreateTask] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      const initialRole = defaultRole || (userProfile?.role === 'parent' ? 'teacher' : 'student');
      setAuthorRole(initialRole);
      setAuthorName(initialRole === 'teacher' ? 'Teacher' : resolvedChild.name || 'Student');
      setActivityDate(effectiveDate);
      setActivityTime(currentTimeStr);
      setTopicsCovered('');
      setHomeworkGiven('');
      setPreviousHomeworkFinished('yes');
      setOptionalComments('');
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, block.id, defaultRole]);

  if (!isOpen) return null;

  // Filter comments for this block
  const blockComments = classComments.filter(
    (c) => c.blockId === block.id && (!childId || !c.childId || c.childId === childId)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicsCovered.trim()) {
      setErrorMsg('Please enter the topics covered in this class.');
      return;
    }

    const timestamp = new Date(`${activityDate}T${activityTime}:00`).toISOString();

    addClassComment({
      blockId: block.id,
      blockTitle: block.title,
      childId: childId || resolvedChild.id,
      childName: childName || resolvedChild.name,
      date: activityDate,
      time: activityTime,
      timestamp,
      authorRole,
      authorName: authorName.trim() || (authorRole === 'teacher' ? 'Teacher' : 'Student'),
      topicsCovered: topicsCovered.trim(),
      homeworkGiven: homeworkGiven.trim(),
      previousHomeworkFinished,
      optionalComments: optionalComments.trim() || undefined,
    });

    // Optionally auto-create a Task on the child's checklist if homework was assigned
    if (autoCreateTask && homeworkGiven.trim()) {
      addTask({
        title: `Homework: ${homeworkGiven.trim().slice(0, 50)}${homeworkGiven.trim().length > 50 ? '...' : ''}`,
        subject: block.title,
        dueDate: activityDate,
        priority: 'normal',
        childId: childId || resolvedChild.id,
        childName: childName || resolvedChild.name,
        parentNote: `Assigned in class "${block.title}": ${homeworkGiven.trim()}`,
      });
    }

    setSuccessMsg('Class comment recorded successfully!');
    setTopicsCovered('');
    setHomeworkGiven('');
    setOptionalComments('');
    setErrorMsg(null);

    setTimeout(() => {
      setSuccessMsg(null);
    }, 3000);
  };

  const getRoleBadge = (role: 'teacher' | 'student' | 'parent') => {
    switch (role) {
      case 'teacher':
        return {
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          label: 'Teacher',
        };
      case 'student':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          label: 'Student',
        };
      case 'parent':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          label: 'Parent / Guardian',
        };
    }
  };

  const getHwStatusBadge = (status: 'yes' | 'no' | 'partial' | 'in_progress' | 'n/a') => {
    switch (status) {
      case 'yes':
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          label: 'Finished Previous Homework',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
        };
      case 'in_progress':
        return {
          bg: 'bg-amber-100 text-amber-800 border-amber-200',
          label: 'In Progress',
          icon: <AlertCircle className="w-3.5 h-3.5 text-amber-600" />,
        };
      case 'partial':
        return {
          bg: 'bg-amber-100 text-amber-800 border-amber-200',
          label: 'Partially Finished',
          icon: <AlertCircle className="w-3.5 h-3.5 text-amber-600" />,
        };
      case 'no':
        return {
          bg: 'bg-rose-100 text-rose-800 border-rose-200',
          label: 'Not Finished',
          icon: <X className="w-3.5 h-3.5 text-rose-600" />,
        };
      case 'n/a':
      default:
        return {
          bg: 'bg-stone-100 text-stone-700 border-stone-200',
          label: 'N/A (No Previous HW)',
          icon: <HelpCircle className="w-3.5 h-3.5 text-stone-500" />,
        };
    }
  };

  return (
    <div
      id="class-feedback-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="class-feedback-modal-container"
        className="bg-white rounded-2xl max-w-2xl w-full border border-stone-200 shadow-xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                  Teacher &amp; Study Comments Log
                </span>
                {resolvedChild.name && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
                    {resolvedChild.name}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white">{block.title}</h2>
            </div>
          </div>
          <button
            id="close-class-feedback-modal-btn"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200/60 pb-3">
                <h3 className="font-semibold text-stone-800 text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-600" />
                  Add Teacher&apos;s Comments &amp; Study Notes
                </h3>
                <span className="text-xs text-stone-500">All fields timestamped automatically</span>
              </div>

              {/* Role & Author selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                    Who is recording this?
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-200/70 rounded-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthorRole('teacher');
                        if (authorName === 'Student' || authorName === 'Parent') setAuthorName('Teacher');
                      }}
                      className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                        authorRole === 'teacher'
                          ? 'bg-white text-stone-900 shadow-xs font-semibold'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Teacher
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthorRole('student');
                        if (authorName === 'Teacher' || authorName === 'Parent') setAuthorName(resolvedChild.name || 'Student');
                      }}
                      className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                        authorRole === 'student'
                          ? 'bg-white text-stone-900 shadow-xs font-semibold'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Student
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthorRole('parent');
                        if (authorName === 'Teacher' || authorName === 'Student') setAuthorName('Parent');
                      }}
                      className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                        authorRole === 'parent'
                          ? 'bg-white text-stone-900 shadow-xs font-semibold'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Parent
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                    Author Name
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="e.g. Mr. David, or Student Name"
                      className="w-full pl-8 pr-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                    />
                  </div>
                </div>
              </div>

              {/* Date and Time of Activity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-stone-500" />
                    Date of Activity
                  </label>
                  <input
                    type="date"
                    value={activityDate}
                    onChange={(e) => setActivityDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-stone-500" />
                    Time of Activity
                  </label>
                  <input
                    type="time"
                    value={activityTime}
                    onChange={(e) => setActivityTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>
              </div>

              {/* a: Topics Covered */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white font-bold text-[10px] mr-1.5">
                    a
                  </span>
                  Topics Covered <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={topicsCovered}
                  onChange={(e) => setTopicsCovered(e.target.value)}
                  placeholder="What concepts, chapter, formulas, or materials were taught today?"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-800 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              {/* b: Homework Given */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white font-bold text-[10px] mr-1.5">
                    b
                  </span>
                  Homework Given
                </label>
                <textarea
                  rows={2}
                  value={homeworkGiven}
                  onChange={(e) => setHomeworkGiven(e.target.value)}
                  placeholder="Assignments, workbook pages, exercises to complete..."
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-800 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
                {homeworkGiven.trim() && (
                  <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoCreateTask}
                      onChange={(e) => setAutoCreateTask(e.target.checked)}
                      className="rounded-sm border-stone-300 text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                    />
                    <span className="text-[11px] text-stone-600">
                      Also add this homework to {resolvedChild.name}'s daily task checklist
                    </span>
                  </label>
                )}
              </div>

              {/* c: Previous Homework Finished or Not */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white font-bold text-[10px] mr-1.5">
                    c
                  </span>
                  Previous Homework Finished or Not:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviousHomeworkFinished('yes')}
                    className={`py-2 px-3 text-xs rounded-lg border font-medium flex items-center justify-center gap-1.5 transition-all ${
                      previousHomeworkFinished === 'yes'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20 font-semibold'
                        : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Yes, Finished
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviousHomeworkFinished('partial')}
                    className={`py-2 px-3 text-xs rounded-lg border font-medium flex items-center justify-center gap-1.5 transition-all ${
                      previousHomeworkFinished === 'partial'
                        ? 'bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20 font-semibold'
                        : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    Partial
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviousHomeworkFinished('no')}
                    className={`py-2 px-3 text-xs rounded-lg border font-medium flex items-center justify-center gap-1.5 transition-all ${
                      previousHomeworkFinished === 'no'
                        ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20 font-semibold'
                        : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <X className="w-3.5 h-3.5 text-rose-600" />
                    Not Finished
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviousHomeworkFinished('n/a')}
                    className={`py-2 px-3 text-xs rounded-lg border font-medium flex items-center justify-center gap-1.5 transition-all ${
                      previousHomeworkFinished === 'n/a'
                        ? 'bg-stone-100 border-stone-400 text-stone-800 ring-2 ring-stone-400/20 font-semibold'
                        : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-stone-400" />
                    N/A
                  </button>
                </div>
              </div>

              {/* d: Optional Comments */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-stone-400 text-white font-bold text-[10px] mr-1.5">
                    d
                  </span>
                  Optional Comments
                </label>
                <textarea
                  rows={2}
                  value={optionalComments}
                  onChange={(e) => setOptionalComments(e.target.value)}
                  placeholder="Additional observations, attention/energy level, student questions, notes for parents..."
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-800 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              {/* Save Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  id="save-class-feedback-btn"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 hover:shadow-md cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Save Class Comment
                </button>
              </div>
            </div>
          </form>

          {/* History / Previous Comments for this class block */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-stone-500" />
                Class Activity Log ({blockComments.length})
              </h4>
              <span className="text-[11px] text-stone-500">Sorted most recent first</span>
            </div>

            {blockComments.length === 0 ? (
              <div className="text-center py-6 px-4 bg-stone-50 border border-dashed border-stone-200 rounded-xl text-stone-500 text-xs">
                No comments recorded for this class yet. Fill in the form above after the class session!
              </div>
            ) : (
              <div className="space-y-3">
                {blockComments.map((comment) => {
                  const roleBadge = getRoleBadge(comment.authorRole);
                  const hwBadge = getHwStatusBadge(comment.previousHomeworkFinished);

                  return (
                    <div
                      key={comment.id}
                      className="p-4 bg-white border border-stone-200 rounded-xl shadow-2xs space-y-2.5 hover:border-stone-300 transition-colors"
                    >
                      {/* Top row: Author, Date, Time, Role */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${roleBadge.bg}`}
                          >
                            {roleBadge.label}: {comment.authorName}
                          </span>
                          <span className="text-[11px] text-stone-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {comment.date}
                          </span>
                          <span className="text-[11px] text-stone-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {comment.time}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${hwBadge.bg}`}
                          >
                            {hwBadge.icon}
                            {hwBadge.label}
                          </span>

                          <button
                            type="button"
                            onClick={() => deleteClassComment(comment.id)}
                            title="Delete this comment"
                            className="p-1 text-stone-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* a: Topics Covered */}
                      <div className="text-xs">
                        <span className="font-semibold text-stone-700">a. Topics Covered: </span>
                        <span className="text-stone-800">{comment.topicsCovered}</span>
                      </div>

                      {/* b: Homework Given */}
                      {comment.homeworkGiven && (
                        <div className="text-xs">
                          <span className="font-semibold text-stone-700">b. Homework Given: </span>
                          <span className="text-stone-800">{comment.homeworkGiven}</span>
                        </div>
                      )}

                      {/* d: Optional Comments */}
                      {comment.optionalComments && (
                        <div className="text-xs bg-stone-50 p-2.5 rounded-lg border border-stone-200/60 text-stone-700">
                          <span className="font-semibold text-stone-700">d. Comments: </span>
                          {comment.optionalComments}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <span>Date and time of activity are recorded with every comment.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
