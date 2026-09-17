import React, { useState } from 'react';
import { BookOpen, Check, Trash2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ReadingLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReadingLogModal: React.FC<ReadingLogModalProps> = ({ isOpen, onClose }) => {
  const { addReadingLog, readingLogs, deleteReadingLog, selectedDate, stats } = useApp();

  const [bookTitle, setBookTitle] = useState<string>('');
  const [minutesRead, setMinutesRead] = useState<number>(20);
  const [pagesRead, setPagesRead] = useState<number>(10);
  const [quote, setQuote] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookTitle.trim()) return;

    addReadingLog({
      date: selectedDate,
      bookTitle: bookTitle.trim(),
      minutesRead: Number(minutesRead) || 15,
      pagesRead: Number(pagesRead) || undefined,
      favoriteQuoteOrThought: quote.trim() || undefined,
    });

    setBookTitle('');
    setQuote('');
    onClose();
  };

  const todayLogs = readingLogs.filter((l) => l.date === selectedDate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/30 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-xl border border-stone-200 flex flex-col gap-3.5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-[#eef5eb] text-emerald-800">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-sm font-bold text-stone-900">
                Reading Log
              </h2>
              <p className="text-[11px] text-stone-500">
                Track daily reading time
              </p>
            </div>
          </div>
          <button
            id="close-reading-modal"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Streak summary */}
        <div className="flex items-center justify-between bg-[#edf5ea] p-2.5 rounded-xl border border-[#d6e5d2] text-xs">
          <span className="font-semibold text-emerald-950">
            {stats.readingStreak}d streak
          </span>
          <span className="text-stone-600">
            {readingLogs.length} logs
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Title
            </label>
            <input
              id="reading-book-title-input"
              type="text"
              required
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              placeholder="e.g. Book title or chapter"
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Minutes
              </label>
              <div className="flex items-center gap-1">
                {[15, 20, 30].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMinutesRead(m)}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold flex-1 transition-colors ${
                      minutesRead === m
                        ? 'bg-emerald-800 text-white'
                        : 'bg-[#edf3ea] text-stone-700'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Pages
              </label>
              <input
                id="reading-pages-input"
                type="number"
                min="1"
                max="500"
                value={pagesRead}
                onChange={(e) => setPagesRead(Number(e.target.value))}
                className="w-full px-3 py-1 text-xs rounded-xl border border-stone-300 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Favorite Line or Thought (Optional)
            </label>
            <textarea
              id="reading-quote-input"
              rows={2}
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder="A line or thought..."
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-white resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              id="reading-submit-btn"
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl shadow-xs flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          </div>
        </form>

        {/* Today's logs */}
        {todayLogs.length > 0 && (
          <div className="pt-2 border-t border-stone-100 flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-stone-600">
              Today's Logs ({todayLogs.length})
            </span>
            <div className="flex flex-col gap-1.5">
              {todayLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2 bg-[#f7faf5] rounded-xl border border-[#e4ede0] flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-stone-900">
                      {log.bookTitle}
                    </span>
                    <span className="text-stone-500 text-[11px] ml-2">
                      {log.minutesRead}m {log.pagesRead ? `• ${log.pagesRead}p` : ''}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteReadingLog(log.id)}
                    className="text-stone-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
