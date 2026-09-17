import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle,
  Coffee,
  Pause,
  Play,
  RotateCcw,
  Timer,
  Volume2,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { soundManager } from '../../utils/audio';

interface FocusTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubject?: string;
}

export const FocusTimerModal: React.FC<FocusTimerModalProps> = ({
  isOpen,
  onClose,
  defaultSubject = 'Study',
}) => {
  const { addFocusSession, stats, selectedDate } = useApp();

  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [selectedMinutes, setSelectedMinutes] = useState<number>(25);
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [ambientSound, setAmbientSound] = useState<'none' | 'brown' | 'rain'>('none');
  const [subject] = useState<string>(defaultSubject);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isRunning) {
      if (mode === 'focus') {
        setTimeLeft(selectedMinutes * 60);
      } else {
        setTimeLeft(5 * 60);
      }
    }
  }, [selectedMinutes, mode, isRunning]);

  useEffect(() => {
    if (isRunning && ambientSound !== 'none') {
      soundManager.startAmbient(ambientSound);
    } else {
      soundManager.stopAmbient();
    }
    return () => {
      soundManager.stopAmbient();
    };
  }, [isRunning, ambientSound]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            soundManager.stopAmbient();

            if (mode === 'focus') {
              addFocusSession({
                date: selectedDate,
                durationMinutes: selectedMinutes,
                targetSubject: subject,
              });
              setMode('break');
              setTimeLeft(5 * 60);
            } else {
              soundManager.playGentleChime(528, 3);
              setMode('focus');
              setTimeLeft(selectedMinutes * 60);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode, selectedMinutes, subject, selectedDate, addFocusSession]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const totalSeconds = mode === 'focus' ? selectedMinutes * 60 : 5 * 60;
  const progressPercent = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  const handleTogglePlay = () => {
    if (!isRunning) {
      soundManager.playGentleChime(440, 0.8);
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    soundManager.stopAmbient();
    setTimeLeft(mode === 'focus' ? selectedMinutes * 60 : 5 * 60);
  };

  const handleSelectMinutes = (m: number) => {
    if (isRunning) return;
    setSelectedMinutes(m);
    setTimeLeft(m * 60);
  };

  const handleFinishEarly = () => {
    if (mode === 'focus') {
      const elapsedMinutes = Math.max(1, Math.round((totalSeconds - timeLeft) / 60));
      addFocusSession({
        date: selectedDate,
        durationMinutes: elapsedMinutes,
        targetSubject: subject,
      });
      setIsRunning(false);
      soundManager.stopAmbient();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/30 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-xl border border-stone-200 flex flex-col items-center gap-4">
        {/* Header */}
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-[#eef5eb] text-emerald-800">
              {mode === 'focus' ? <Timer className="w-4 h-4" /> : <Coffee className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="font-display text-sm font-bold text-stone-900">
                {mode === 'focus' ? 'Study Timer' : 'Break'}
              </h2>
              <p className="text-[11px] text-stone-500">
                {mode === 'focus' ? subject : 'Rest & Breathe'}
              </p>
            </div>
          </div>
          <button
            id="close-timer-modal"
            onClick={() => {
              setIsRunning(false);
              soundManager.stopAmbient();
              onClose();
            }}
            className="p-1 text-stone-400 hover:text-stone-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex bg-[#e8efe5] p-1 rounded-2xl border border-[#d4e2cf] w-full">
          <button
            id="timer-mode-focus"
            onClick={() => {
              if (!isRunning) {
                setMode('focus');
                setTimeLeft(selectedMinutes * 60);
              }
            }}
            className={`flex-1 py-1 rounded-xl text-xs font-semibold transition-all ${
              mode === 'focus' ? 'bg-white text-emerald-950 shadow-xs' : 'text-stone-600'
            }`}
          >
            Focus ({selectedMinutes}m)
          </button>
          <button
            id="timer-mode-break"
            onClick={() => {
              if (!isRunning) {
                setMode('break');
                setTimeLeft(5 * 60);
              }
            }}
            className={`flex-1 py-1 rounded-xl text-xs font-semibold transition-all ${
              mode === 'break' ? 'bg-white text-emerald-950 shadow-xs' : 'text-stone-600'
            }`}
          >
            Break (5m)
          </button>
        </div>

        {/* Circular Progress */}
        <div className="relative w-44 h-44 flex items-center justify-center my-1">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke="#eaf1e7"
              strokeWidth="5"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke="#2e543b"
              strokeWidth="5"
              fill="transparent"
              strokeDasharray={276.46}
              strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
              strokeLinecap="round"
              className="transition-all duration-300 ease-out"
            />
          </svg>

          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="font-display font-bold text-3xl text-stone-900 tracking-tight">
              {formattedTime}
            </span>
          </div>
        </div>

        {/* Minutes Presets */}
        {mode === 'focus' && !isRunning && (
          <div className="flex items-center gap-1.5 justify-center flex-wrap">
            {[15, 20, 25, 30, 40].map((mins) => (
              <button
                key={mins}
                id={`focus-preset-${mins}`}
                onClick={() => handleSelectMinutes(mins)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedMinutes === mins
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-[#edf3ea] text-stone-700 hover:bg-[#dfeada]'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        )}

        {/* Sound toggle */}
        <div className="flex items-center justify-center gap-2 text-xs text-stone-600 bg-[#f7faf5] p-1.5 rounded-xl border border-[#e1ebd9] w-full">
          <Volume2 className="w-3.5 h-3.5 text-stone-400" />
          <div className="flex items-center gap-1">
            <button
              id="ambient-none"
              onClick={() => setAmbientSound('none')}
              className={`px-2 py-0.5 rounded-md font-medium text-[11px] ${
                ambientSound === 'none' ? 'bg-emerald-800 text-white' : 'text-stone-600'
              }`}
            >
              Mute
            </button>
            <button
              id="ambient-brown"
              onClick={() => setAmbientSound('brown')}
              className={`px-2 py-0.5 rounded-md font-medium text-[11px] ${
                ambientSound === 'brown' ? 'bg-emerald-800 text-white' : 'text-stone-600'
              }`}
            >
              Brown Noise
            </button>
            <button
              id="ambient-rain"
              onClick={() => setAmbientSound('rain')}
              className={`px-2 py-0.5 rounded-md font-medium text-[11px] ${
                ambientSound === 'rain' ? 'bg-emerald-800 text-white' : 'text-stone-600'
              }`}
            >
              Rain
            </button>
          </div>
        </div>

        {/* Play / Pause / Reset */}
        <div className="flex items-center gap-2 w-full justify-center">
          <button
            id="timer-reset-btn"
            onClick={handleReset}
            className="p-2.5 rounded-xl bg-[#edf3ea] hover:bg-[#dfeada] text-stone-600 transition-colors"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            id="timer-play-btn"
            onClick={handleTogglePlay}
            className="flex-1 max-w-[150px] py-2.5 px-4 rounded-xl text-white font-semibold text-xs bg-emerald-800 hover:bg-emerald-900 shadow-xs transition-all flex items-center justify-center gap-1.5"
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{timeLeft < totalSeconds ? 'Resume' : 'Start'}</span>
              </>
            )}
          </button>

          {isRunning && mode === 'focus' && (
            <button
              id="timer-finish-early-btn"
              onClick={handleFinishEarly}
              className="p-2.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 transition-colors"
              title="Save"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="text-[11px] font-medium text-stone-400">
          {stats.focusStreak}d streak • {stats.totalFocusMinutes}m total
        </div>
      </div>
    </div>
  );
};
