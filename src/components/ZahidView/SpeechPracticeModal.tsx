import React, { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Leaf,
  MessageCircle,
  Mic,
  Play,
  Square,
  Trash2,
  Volume2,
  Wind,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { soundManager } from '../../utils/audio';
import { VoiceRecorder } from '../../utils/recorder';

interface SpeechPracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SpeechPracticeModal: React.FC<SpeechPracticeModalProps> = ({ isOpen, onClose }) => {
  const {
    speechExercises,
    todaySpeechLog,
    saveSpeechPracticeLog,
    selectedDate,
    stats,
  } = useApp();

  const enabledExercises = speechExercises.filter((e) => e.enabled);

  // Steps: 0: Warm-up, 1: Exercises, 2: Voice & Save
  const [step, setStep] = useState<number>(0);

  // Breathing warm-up state
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>('Inhale');
  const [breathSeconds, setBreathSeconds] = useState<number>(4);

  // Exercise tracking
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);
  const [completedExerciseIds, setCompletedExerciseIds] = useState<string[]>(
    todaySpeechLog?.completedExercises || []
  );

  // Voice recording state
  const recorderRef = useRef<VoiceRecorder | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [audioClipUrl, setAudioClipUrl] = useState<string | null>(
    todaySpeechLog?.audioDataUrl || null
  );
  const [isPlayingRecorded, setIsPlayingRecorded] = useState<boolean>(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const [notes, setNotes] = useState<string>(todaySpeechLog?.notes || '');

  // Breathing loop
  useEffect(() => {
    if (!isOpen || step !== 0) return;

    const interval = setInterval(() => {
      setBreathSeconds((prevSec) => {
        if (prevSec <= 1) {
          setBreathPhase((prevPhase) => {
            if (prevPhase === 'Inhale') return 'Hold';
            if (prevPhase === 'Hold') return 'Exhale';
            if (prevPhase === 'Exhale') return 'Rest';
            return 'Inhale';
          });
          return 4;
        }
        return prevSec - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, step]);

  // Voice recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  if (!isOpen) return null;

  const currentExercise = enabledExercises[currentExerciseIndex];

  const handleStartRecording = async () => {
    try {
      if (!recorderRef.current) {
        recorderRef.current = new VoiceRecorder();
      }
      await recorderRef.current.start();
      setIsRecording(true);
      setRecordingSeconds(0);
    } catch {
      // ignore
    }
  };

  const handleStopRecording = async () => {
    if (!recorderRef.current) return;
    try {
      const { dataUrl } = await recorderRef.current.stop();
      setIsRecording(false);
      setAudioClipUrl(dataUrl);
    } catch {
      setIsRecording(false);
    }
  };

  const handleTogglePlayRecorded = () => {
    if (!audioPlayerRef.current || !audioClipUrl) return;
    if (isPlayingRecorded) {
      audioPlayerRef.current.pause();
      setIsPlayingRecorded(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlayingRecorded(true);
    }
  };

  const handleExerciseDone = (exerciseId: string) => {
    if (!completedExerciseIds.includes(exerciseId)) {
      setCompletedExerciseIds((prev) => [...prev, exerciseId]);
      soundManager.playSoftTick();
    }
    if (currentExerciseIndex < enabledExercises.length - 1) {
      setCurrentExerciseIndex((prev) => prev + 1);
    } else {
      setStep(2);
    }
  };

  const handleFinishPractice = () => {
    saveSpeechPracticeLog({
      date: selectedDate,
      completed: true,
      skippedGentle: false,
      notes: notes.trim() || undefined,
      hasAudioRecording: !!audioClipUrl,
      audioDataUrl: audioClipUrl || undefined,
      audioDurationSec: recordingSeconds || undefined,
      completedExercises: completedExerciseIds,
    });
    onClose();
  };

  const handleNotToday = () => {
    saveSpeechPracticeLog({
      date: selectedDate,
      completed: false,
      skippedGentle: true,
      notes: 'Gentle rest day',
      completedExercises: [],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/30 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-xl border border-stone-200 flex flex-col gap-3.5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-[#eef5eb] text-emerald-800">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-sm font-bold text-stone-900">
                Speech Practice
              </h2>
              <p className="text-[11px] text-stone-500">
                Calm pacing & steady rhythm
              </p>
            </div>
          </div>
          <button
            id="close-speech-modal"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Tabs */}
        <div className="flex bg-[#e8efe5] p-1 rounded-2xl border border-[#d4e2cf]">
          <button
            onClick={() => setStep(0)}
            className={`flex-1 py-1 text-xs font-semibold rounded-xl transition-all ${
              step === 0 ? 'bg-white text-emerald-950 shadow-xs' : 'text-stone-600'
            }`}
          >
            1. Warm-Up
          </button>
          <button
            onClick={() => setStep(1)}
            className={`flex-1 py-1 text-xs font-semibold rounded-xl transition-all ${
              step === 1 ? 'bg-white text-emerald-950 shadow-xs' : 'text-stone-600'
            }`}
          >
            2. Prompts
          </button>
          <button
            onClick={() => setStep(2)}
            className={`flex-1 py-1 text-xs font-semibold rounded-xl transition-all ${
              step === 2 ? 'bg-white text-emerald-950 shadow-xs' : 'text-stone-600'
            }`}
          >
            3. Wrap-Up
          </button>
        </div>

        {/* STEP 0: Warm-Up */}
        {step === 0 && (
          <div className="flex flex-col items-center text-center gap-3 py-1">
            <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-[#edf5ea] px-2.5 py-0.5 rounded-full">
              <Wind className="w-3 h-3" />
              <span>Breathing Rhythm</span>
            </div>

            {/* Breathing Circle */}
            <div className="relative w-40 h-40 flex items-center justify-center my-1">
              <div
                className={`absolute inset-0 rounded-full transition-all duration-1000 ${
                  breathPhase === 'Inhale'
                    ? 'bg-[#d8ebd3] scale-105'
                    : breathPhase === 'Hold'
                    ? 'bg-[#c9e4c3] scale-105'
                    : breathPhase === 'Exhale'
                    ? 'bg-[#e2f0de] scale-95'
                    : 'bg-[#edf5ea] scale-95'
                }`}
              />
              <div className="relative z-10 flex flex-col items-center">
                <span className="text-sm font-bold text-stone-800">
                  {breathPhase}
                </span>
                <span className="text-2xl font-bold text-emerald-950 mt-0.5">
                  {breathSeconds}s
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full pt-1">
              <button
                id="speech-not-today-btn-step0"
                onClick={handleNotToday}
                className="px-3 py-1.5 rounded-xl border border-stone-200 text-stone-600 text-xs font-medium hover:bg-stone-50"
              >
                Skip
              </button>
              <button
                id="speech-next-to-exercises-btn"
                onClick={() => setStep(1)}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs flex items-center justify-center gap-1 shadow-xs"
              >
                <span>Prompts</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: Exercises */}
        {step === 1 && (
          <div className="flex flex-col gap-2.5">
            {enabledExercises.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#f7faf5] border border-[#e4ede0] flex flex-col items-center text-center gap-2">
                <p className="text-xs text-stone-600 leading-relaxed">
                  No speech prompts have been added yet. You can continue to voice reflection, or a guardian can add prompts in the planner.
                </p>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="mt-1 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold"
                >
                  Continue to Voice Reflection
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500">
                    {currentExerciseIndex + 1} of {enabledExercises.length}
                  </span>
                  <span className="font-semibold text-emerald-900 bg-[#edf5ea] px-2 py-0.5 rounded">
                    {currentExercise?.category || 'Exercise'}
                  </span>
                </div>

                {currentExercise ? (
                  <div className="p-3.5 rounded-2xl bg-[#f7faf5] border border-[#e4ede0] flex flex-col gap-2">
                    <div className="flex items-center gap-1.5">
                      {currentExercise.type === 'passage' && <BookOpen className="w-3.5 h-3.5 text-emerald-800" />}
                      {currentExercise.type === 'talking_prompt' && <MessageCircle className="w-3.5 h-3.5 text-emerald-800" />}
                      {currentExercise.type === 'word_of_day' && <Volume2 className="w-3.5 h-3.5 text-emerald-800" />}
                      <h3 className="font-semibold text-xs sm:text-sm text-stone-900">
                        {currentExercise.title}
                      </h3>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-[#e1ebd9]">
                      <p className="text-xs sm:text-sm font-medium text-stone-800 leading-relaxed">
                        {currentExercise.content}
                      </p>
                    </div>

                    {currentExercise.extraNotes && (
                      <p className="text-[11px] text-stone-500 italic">
                        {currentExercise.extraNotes}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-stone-400 text-center py-4">
                    Completed
                  </p>
                )}

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    disabled={currentExerciseIndex === 0}
                    onClick={() => setCurrentExerciseIndex((p) => Math.max(0, p - 1))}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <button
                    id="speech-mark-exercise-done-btn"
                    onClick={() => handleExerciseDone(currentExercise?.id || '')}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs flex items-center justify-center gap-1 shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {currentExerciseIndex === enabledExercises.length - 1
                        ? 'Done'
                        : 'Next'}
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP 2: Wrap-Up & Optional Audio */}
        {step === 2 && (
          <div className="flex flex-col gap-3">
            <div className="p-3 bg-[#f7faf5] rounded-2xl border border-[#e4ede0] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-950">
                  <Headphones className="w-3.5 h-3.5" />
                  <span>Voice Clip (Optional)</span>
                </div>
              </div>

              <div className="flex items-center gap-2 justify-center py-1">
                {!isRecording ? (
                  <button
                    id="speech-record-btn"
                    onClick={handleStartRecording}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Record</span>
                  </button>
                ) : (
                  <button
                    id="speech-stop-record-btn"
                    onClick={handleStopRecording}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-800 text-white text-xs font-semibold"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" />
                    <span>Stop ({recordingSeconds}s)</span>
                  </button>
                )}

                {audioClipUrl && !isRecording && (
                  <>
                    <button
                      id="speech-play-audio-btn"
                      onClick={handleTogglePlayRecorded}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-800 text-white text-xs font-semibold"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>{isPlayingRecorded ? 'Pause' : 'Play'}</span>
                    </button>
                    <audio
                      ref={audioPlayerRef}
                      src={audioClipUrl}
                      onEnded={() => setIsPlayingRecorded(false)}
                      className="hidden"
                    />
                    <button
                      onClick={() => setAudioClipUrl(null)}
                      className="p-1 text-stone-400 hover:text-stone-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Note (Optional)
              </label>
              <input
                id="speech-reflection-note"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How did it feel today..."
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-stone-100">
              <button
                id="speech-skip-recording-btn"
                onClick={handleNotToday}
                className="px-3 py-1.5 rounded-xl border border-stone-200 text-stone-600 text-xs font-medium hover:bg-stone-50"
              >
                Skip
              </button>
              <button
                id="speech-save-practice-btn"
                onClick={handleFinishPractice}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs flex items-center justify-center gap-1 shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save Practice</span>
              </button>
            </div>
          </div>
        )}

        <div className="text-[11px] text-stone-400 text-center">
          {stats.speechStreak}d streak
        </div>
      </div>
    </div>
  );
};
