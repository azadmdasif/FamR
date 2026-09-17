import React from 'react';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Leaf,
  LogIn,
  Moon,
  Settings,
  Shield,
  Sparkles,
  Sun,
  User,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  onOpenNotifications: () => void;
  activeScreen?: 'home' | 'progress' | 'settings';
  onNavigateScreen?: (screen: 'home' | 'progress' | 'settings') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  activeScreen,
  onNavigateScreen,
}) => {
  const {
    role,
    setRole,
    selectedDate,
    setSelectedDate,
    todayDateStr,
    notifications,
    currentDaySession,
    startDay,
    endDay,
    currentUser,
    userProfile,
    updateUserProfile,
    setIsAuthModalOpen,
    linkedChildren,
    activeChildId,
    setActiveChildId,
  } = useApp();

  const unreadNotifs = notifications.filter((n) => !n.read).length;

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(todayDateStr);
  };

  const isToday = selectedDate === todayDateStr;

  const dateObj = new Date(selectedDate + 'T00:00:00');
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const activeChild = linkedChildren.find((c) => c.id === activeChildId) || linkedChildren[0];

  return (
    <header className="sticky top-0 z-30 bg-[#f7f9f6]/95 backdrop-blur-md border-b border-[#e1ebd9] px-3 sm:px-6 py-2">
      <div className="max-w-4xl mx-auto flex flex-col gap-2">
        {/* Top row: Brand + Account / Role Switcher + Notifs */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-800 flex items-center justify-center text-emerald-50 shadow-xs">
              <Leaf className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-semibold text-emerald-950 tracking-tight text-sm sm:text-base">
                Family Routine
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Account / Profile Button */}
            <button
              id="header-account-btn"
              onClick={() => {
                if (onNavigateScreen) {
                  onNavigateScreen('settings');
                } else {
                  setIsAuthModalOpen(true);
                }
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all shadow-xs ${
                activeScreen === 'settings'
                  ? 'bg-emerald-800 text-white border-emerald-800'
                  : 'bg-white border-[#d5e2cf] text-stone-800 hover:bg-[#edf3ea]'
              }`}
              title="Profile & Settings"
            >
              {currentUser && userProfile ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="max-w-[80px] sm:max-w-[120px] truncate">
                    {userProfile.displayName}
                  </span>
                  <span className={`text-[10px] capitalize ${activeScreen === 'settings' ? 'text-emerald-200' : 'text-stone-400'}`}>
                    ({role})
                  </span>
                </>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5 text-emerald-800" />
                  <span>Account</span>
                </>
              )}
            </button>

            {/* Settings Quick Icon Button */}
            <button
              id="header-settings-btn"
              onClick={() => {
                if (onNavigateScreen) {
                  onNavigateScreen(activeScreen === 'settings' ? 'home' : 'settings');
                } else {
                  setIsAuthModalOpen(true);
                }
              }}
              className={`p-1.5 rounded-full transition-colors ${
                activeScreen === 'settings'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-stone-700 hover:bg-[#e4ede0]'
              }`}
              title="Settings & Family Planner"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Role switcher segmented pill */}
            <div className="bg-[#e7eee2] p-0.5 rounded-full flex items-center border border-[#d5e2cf]">
              <button
                id="role-btn-child"
                onClick={() => {
                  setRole('child');
                  if (currentUser && userProfile) {
                    updateUserProfile({ role: 'child' });
                  }
                }}
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all ${
                  role === 'child'
                    ? 'bg-white text-emerald-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Switch to Child view"
              >
                <Sparkles className="w-3 h-3" />
                <span>Child</span>
              </button>
              <button
                id="role-btn-parent"
                onClick={() => {
                  setRole('parent');
                  if (currentUser && userProfile) {
                    updateUserProfile({ role: 'parent' });
                  }
                }}
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all ${
                  role === 'parent'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Switch to Parent view"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Parent</span>
              </button>
            </div>

            {/* Notification button */}
            <button
              id="header-notif-btn"
              onClick={onOpenNotifications}
              className="relative p-1.5 rounded-full text-emerald-900 hover:bg-[#e4ede0] transition-colors"
              aria-label="Alerts"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-700 ring-2 ring-white" />
              )}
            </button>
          </div>
        </div>

        {/* Second row: Date Selector + Active Child Mapping (for Parent) + Start/End Day */}
        <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
          {/* Date Picker */}
          <div className="flex items-center gap-0.5 bg-[#edf3ea] rounded-xl p-0.5 border border-[#d9e5d4]">
            <button
              id="date-nav-prev"
              onClick={handlePrevDay}
              className="p-1 rounded-lg text-stone-600 hover:bg-[#dfeada] transition-colors"
              aria-label="Previous Day"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              id="date-nav-today"
              onClick={handleToday}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors ${
                isToday
                  ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                  : 'text-stone-700 hover:bg-[#dfeada]'
              }`}
            >
              Today
            </button>
            <span className="text-xs font-medium text-stone-800 px-1 min-w-[76px] text-center">
              {formattedDate}
            </span>
            <button
              id="date-nav-next"
              onClick={handleNextDay}
              className="p-1 rounded-lg text-stone-600 hover:bg-[#dfeada] transition-colors"
              aria-label="Next Day"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* If Parent role: Active Child Selector to decide who they are setting routines & tasks for */}
          {role === 'parent' && linkedChildren.length > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-[11px] text-stone-500 font-medium hidden md:inline">
                Managing:
              </span>
              <div className="flex items-center gap-1 bg-[#edf3ea] border border-[#d9e5d4] p-0.5 rounded-xl">
                {linkedChildren.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => setActiveChildId(child.id)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all ${
                      activeChildId === child.id
                        ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                        : 'text-stone-700 hover:bg-[#dfeada]'
                    }`}
                  >
                    {child.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Start / End Day button in header (Only for child view) */}
          {role === 'child' && (
            <div className="flex items-center ml-auto">
              {!currentDaySession?.isStarted ? (
                <button
                  id="header-start-day-btn"
                  onClick={() => startDay()}
                  className="flex items-center gap-1.5 px-3 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-medium transition-all shadow-xs"
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Start Day</span>
                </button>
              ) : !currentDaySession?.isEnded ? (
                <button
                  id="header-end-day-btn"
                  onClick={() => endDay()}
                  className="flex items-center gap-1.5 px-3 py-1 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-medium transition-all shadow-xs"
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>End Day</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#edf3ea] border border-[#d9e5d4] rounded-xl text-stone-700 text-xs font-medium">
                  <Moon className="w-3.5 h-3.5 text-stone-500" />
                  <span>Ended {currentDaySession.endedAt}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
