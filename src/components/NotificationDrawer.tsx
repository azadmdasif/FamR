import React from 'react';
import { BellRing, CheckCircle, Clock, Trash2, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const {
    notifications,
    dismissNotification,
    clearAllNotifications,
    testSendReminder,
    notificationsEnabled,
    requestNotificationPermission,
  } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-stone-900/30 backdrop-blur-xs">
      <div className="bg-white w-full max-w-xs h-full shadow-xl border-l border-stone-200 flex flex-col p-4">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-[#eef5eb] text-emerald-800">
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-sm font-bold text-stone-900">
                Reminders
              </h2>
              <p className="text-[11px] text-stone-500">
                Block & task alerts
              </p>
            </div>
          </div>
          <button
            id="close-notif-drawer"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Device Alert setting */}
        <div className="my-2.5 p-3 bg-[#f7faf5] rounded-xl border border-[#e4ede0] flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-800">
              Alerts
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                notificationsEnabled
                  ? 'bg-emerald-100 text-emerald-950'
                  : 'bg-stone-200 text-stone-600'
              }`}
            >
              {notificationsEnabled ? 'Active' : 'Off'}
            </span>
          </div>
          {!notificationsEnabled ? (
            <button
              id="enable-device-notif-btn"
              onClick={requestNotificationPermission}
              className="w-full py-1 px-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold transition-colors mt-1"
            >
              Enable
            </button>
          ) : (
            <button
              id="test-reminder-chime-btn"
              onClick={() =>
                testSendReminder(
                  'Upcoming: Free Screen Time',
                  '10 minutes until protected free time.'
                )
              }
              className="w-full py-1 px-2.5 bg-[#edf3ea] hover:bg-[#dfeada] text-stone-800 rounded-lg text-xs font-semibold transition-colors mt-1"
            >
              Test Chime
            </button>
          )}
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-2">
          {notifications.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-stone-400">
              <CheckCircle className="w-6 h-6 mb-1 text-stone-300" />
              <p className="text-xs font-medium">All clear</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className="p-2.5 bg-[#f7faf5] rounded-xl border border-[#e4ede0] flex flex-col gap-0.5"
              >
                <div className="flex items-start justify-between gap-1">
                  <span className="text-xs font-semibold text-stone-900">
                    {n.title}
                  </span>
                  <button
                    onClick={() => dismissNotification(n.id)}
                    className="text-stone-400 hover:text-stone-600 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-[11px] text-stone-600 leading-snug">
                  {n.message}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-stone-400 mt-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  <span>{n.time}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <div className="pt-2 border-t border-stone-100 flex justify-end">
            <button
              id="clear-all-notifs-btn"
              onClick={clearAllNotifications}
              className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1 font-medium"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
