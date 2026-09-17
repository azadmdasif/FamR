import React, { useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Clock,
  Mic,
  Sparkles,
  Timer,
  X,
  Settings,
} from 'lucide-react';
import { GuardianDashboard } from './components/GuardianView/GuardianDashboard';
import { Header } from './components/Header';
import { NotificationDrawer } from './components/NotificationDrawer';
import { ProgressDashboard } from './components/ProgressDashboard';
import { FocusTimerModal } from './components/ZahidView/FocusTimerModal';
import { ReadingLogModal } from './components/ZahidView/ReadingLogModal';
import { SpeechPracticeModal } from './components/ZahidView/SpeechPracticeModal';
import { ZahidHome } from './components/ZahidView/ZahidHome';
import { AuthModal } from './components/Auth/AuthModal';
import { LoginScreen } from './components/Auth/LoginScreen';
import { ProfileSettings } from './components/Profile/ProfileSettings';
import { AppProvider, useApp } from './context/AppContext';

const MainAppContent: React.FC = () => {
  const { role, currentUser, userProfile, authLoading, afterEndDayToast, dismissAfterEndDayToast } = useApp();

  // Modals state
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [isSpeechOpen, setIsSpeechOpen] = useState(false);
  const [isReadingOpen, setIsReadingOpen] = useState(false);

  // Active view: 'home' | 'progress' | 'settings'
  const [activeScreen, setActiveScreen] = useState<'home' | 'progress' | 'settings'>('home');

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f7f9f6] flex flex-col items-center justify-center p-6 text-stone-600">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-900 border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-medium text-stone-500">Loading Family Routine...</p>
      </div>
    );
  }

  // If user is not authenticated, show only the clean minimalist login screen
  if (!currentUser) {
    return <LoginScreen />;
  }

  // View is determined by current active role ('parent' vs 'child')
  const isParent = role === 'parent';

  return (
    <div className="min-h-screen bg-[#f7f9f6] text-[#27382b] flex flex-col font-sans">
      {/* Sticky Top Header */}
      <Header
        onOpenNotifications={() => setIsNotifsOpen(true)}
        activeScreen={activeScreen}
        onNavigateScreen={setActiveScreen}
      />

      {/* Floating Note Toast when phone is used after end day */}
      {afterEndDayToast && (
        <aside
          aria-label="Activity note"
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm bg-stone-900/90 text-stone-100 text-xs px-3.5 py-2.5 rounded-2xl shadow-lg border border-stone-700/50 backdrop-blur-md flex items-center justify-between gap-2 transition-all"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium tracking-tight">
              {afterEndDayToast}
            </span>
          </div>
          <button
            id="dismiss-usage-toast-btn"
            onClick={dismissAfterEndDayToast}
            className="p-1 text-stone-400 hover:text-stone-200 rounded-lg"
            aria-label="Dismiss note"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </aside>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 pt-3 pb-20">
        {activeScreen === 'settings' ? (
          <ProfileSettings onBack={() => setActiveScreen('home')} />
        ) : activeScreen === 'progress' ? (
          <ProgressDashboard onBack={() => setActiveScreen('home')} />
        ) : isParent ? (
          <GuardianDashboard onNavigateSettings={() => setActiveScreen('settings')} />
        ) : (
          <ZahidHome
            onOpenTimer={() => setIsTimerOpen(true)}
            onOpenSpeech={() => setIsSpeechOpen(true)}
            onOpenReading={() => setIsReadingOpen(true)}
            onOpenProgress={() => setActiveScreen('progress')}
          />
        )}
      </main>

      {/* Mobile Floating Bottom Bar for quick one-tap actions */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-[#e1ebd9] py-1.5 px-3 z-40">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <button
            id="nav-home-btn"
            onClick={() => setActiveScreen('home')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
              activeScreen === 'home'
                ? 'text-emerald-900 font-semibold'
                : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span className="text-[10px]">
              {isParent ? 'Planner' : 'Schedule'}
            </span>
          </button>

          {!isParent && (
            <>
              <button
                id="nav-timer-btn"
                onClick={() => setIsTimerOpen(true)}
                className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl text-stone-400 hover:text-emerald-900 transition-colors"
              >
                <Timer className="w-4 h-4" />
                <span className="text-[10px]">Timer</span>
              </button>

              <button
                id="nav-speech-btn"
                onClick={() => setIsSpeechOpen(true)}
                className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl text-stone-400 hover:text-emerald-900 transition-colors relative"
              >
                <Mic className="w-4 h-4" />
                <span className="text-[10px]">Speech</span>
              </button>

              <button
                id="nav-reading-btn"
                onClick={() => setIsReadingOpen(true)}
                className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl text-stone-400 hover:text-emerald-900 transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                <span className="text-[10px]">Reading</span>
              </button>
            </>
          )}

          <button
            id="nav-progress-btn"
            onClick={() => setActiveScreen(activeScreen === 'progress' ? 'home' : 'progress')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
              activeScreen === 'progress'
                ? 'text-emerald-900 font-semibold'
                : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px]">Growth</span>
          </button>

          <button
            id="nav-settings-btn"
            onClick={() => setActiveScreen(activeScreen === 'settings' ? 'home' : 'settings')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
              activeScreen === 'settings'
                ? 'text-emerald-900 font-semibold'
                : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="text-[10px]">Settings</span>
          </button>
        </div>
      </nav>

      {/* Global Modals */}
      <AuthModal />

      <NotificationDrawer
        isOpen={isNotifsOpen}
        onClose={() => setIsNotifsOpen(false)}
      />

      <FocusTimerModal
        isOpen={isTimerOpen}
        onClose={() => setIsTimerOpen(false)}
      />

      <SpeechPracticeModal
        isOpen={isSpeechOpen}
        onClose={() => setIsSpeechOpen(false)}
      />

      <ReadingLogModal
        isOpen={isReadingOpen}
        onClose={() => setIsReadingOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
