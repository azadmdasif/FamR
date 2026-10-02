import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Edit2,
  HeartHandshake,
  LogOut,
  Mail,
  Moon,
  Plus,
  RefreshCw,
  Shield,
  Sparkles,
  Sun,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ProfileSettingsProps {
  onBack: () => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ onBack }) => {
  const {
    currentUser,
    userProfile,
    updateUserProfile,
    signOutUser,
    role,
    setRole,
    linkedChildren,
    addLinkedChild,
    removeLinkedChild,
    activeChildId,
    setActiveChildId,
    pendingLinkRequests,
    sentLinkRequests,
    sendChildLinkRequest,
    sendParentLinkRequest,
    respondToLinkRequest,
    cancelLinkRequest,
    syncLinkedChildren,
    currentDaySession,
    startDay,
    endDay,
    resetDaySession,
    notificationsEnabled,
    requestNotificationPermission,
    testSendReminder,
  } = useApp();

  // Profile edit state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(userProfile?.displayName || '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameSaveMsg, setNameSaveMsg] = useState<string | null>(null);

  // Quick Add Child state
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddName, setQuickAddName] = useState('');

  // Link Child modal state
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'child' | 'parent'>('child');
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Copied code feedback
  const [copiedCode, setCopiedCode] = useState(false);
  const [isRespondingToReq, setIsRespondingToReq] = useState<string | null>(null);

  // Sign out confirmation
  const [isConfirmingSignOut, setIsConfirmingSignOut] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const handleSyncChildren = async () => {
    setIsSyncing(true);
    setSyncMsg(null);
    try {
      const res = await syncLinkedChildren();
      if (res.success && res.count > 0) {
        setSyncMsg(`Sync complete! ${res.count} child profile(s) connected.`);
      } else {
        setSyncMsg('All child links are up to date.');
      }
      setTimeout(() => setSyncMsg(null), 3500);
    } catch {
      setSyncMsg('Sync checked.');
      setTimeout(() => setSyncMsg(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNameValue.trim()) return;
    setIsSavingName(true);
    setNameSaveMsg(null);
    try {
      await updateUserProfile({ displayName: editNameValue.trim() });
      setNameSaveMsg('Name updated successfully!');
      setIsEditingName(false);
      setTimeout(() => setNameSaveMsg(null), 3000);
    } catch {
      setNameSaveMsg('Failed to update name. Please try again.');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleCopyCode = () => {
    const code = userProfile?.familyId || 'family-routine-home';
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleQuickAddChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddName.trim()) return;
    addLinkedChild(quickAddName.trim());
    setQuickAddName('');
    setIsQuickAddOpen(false);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setIsSendingInvite(true);
    setInviteFeedback(null);
    try {
      const res =
        inviteRole === 'child'
          ? await sendChildLinkRequest(inviteEmail.trim(), inviteName.trim())
          : await sendParentLinkRequest(inviteEmail.trim(), inviteName.trim());

      if (res.success) {
        setInviteFeedback({ type: 'success', text: res.message });
        setInviteEmail('');
        setInviteName('');
      } else {
        setInviteFeedback({ type: 'error', text: res.message });
      }
    } catch {
      setInviteFeedback({ type: 'error', text: 'Failed to send invite request.' });
    } finally {
      setIsSendingInvite(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto pb-20">
      {/* Top Bar with Back Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#d5e2cf] text-stone-700 hover:bg-[#edf3ea] text-xs font-semibold shadow-xs transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Planner</span>
        </button>

        <span className="text-[11px] text-stone-500 font-medium">
          Logged in as <strong className="text-stone-800">{userProfile?.email}</strong>
        </span>
      </div>

      {/* SECTION 1: USER PROFILE & ACCOUNT */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#e1ebd9] shadow-xs flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-bold text-xl shadow-xs border border-emerald-200">
              {userProfile?.displayName ? (
                userProfile.displayName.charAt(0).toUpperCase()
              ) : (
                <User className="w-7 h-7" />
              )}
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold font-display text-stone-900 tracking-tight">
                  {userProfile?.displayName || 'Family User'}
                </h2>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300/60 uppercase tracking-wider">
                  {role === 'parent' ? <Shield className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                  {role === 'parent' ? 'Parent / Guardian' : 'Child Account'}
                </span>
              </div>
              <p className="text-xs text-stone-500">{userProfile?.email || 'No email attached'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {!isEditingName ? (
              <button
                type="button"
                onClick={() => {
                  setEditNameValue(userProfile?.displayName || '');
                  setIsEditingName(true);
                }}
                className="px-3 py-1.5 rounded-xl border border-[#d5e2cf] text-xs font-semibold text-stone-700 hover:bg-[#f2f7f0] flex items-center gap-1.5 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5 text-stone-500" />
                <span>Edit Name</span>
              </button>
            ) : null}

            {!isConfirmingSignOut ? (
              <button
                type="button"
                onClick={() => setIsConfirmingSignOut(true)}
                className="px-3 py-1.5 rounded-xl border border-rose-200 text-xs font-semibold text-rose-700 hover:bg-rose-50 flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 p-1 rounded-xl">
                <span className="text-[11px] text-rose-800 font-semibold px-1.5">Sure?</span>
                <button
                  type="button"
                  onClick={async () => {
                    await signOutUser();
                  }}
                  className="px-2.5 py-1 bg-rose-700 text-white rounded-lg text-xs font-bold hover:bg-rose-800"
                >
                  Yes, Sign Out
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingSignOut(false)}
                  className="px-2 py-1 text-xs text-stone-500 hover:text-stone-800"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Edit Name Form */}
        {isEditingName && (
          <form
            onSubmit={handleSaveName}
            className="p-3.5 rounded-2xl bg-[#f7faf5] border border-[#e4ede0] flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
          >
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                required
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-hidden"
              />
            </div>
            <div className="flex items-center gap-2 sm:self-end">
              <button
                type="button"
                onClick={() => setIsEditingName(false)}
                className="px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingName}
                className="px-4 py-1.5 text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl shadow-xs disabled:opacity-50"
              >
                {isSavingName ? 'Saving...' : 'Save Name'}
              </button>
            </div>
          </form>
        )}

        {nameSaveMsg && (
          <p className="text-xs font-semibold text-emerald-800 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
            {nameSaveMsg}
          </p>
        )}

        {/* Dual-Role Switcher & Household Code Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[#edf3ea]">
          <div className="p-3.5 bg-[#f8faf7] rounded-2xl border border-[#e1ebd9] flex flex-col justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-700" />
                Active View Mode
              </span>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Switch between Parent planner controls and the Child routine interface anytime.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={() => {
                  setRole('parent');
                  if (currentUser && userProfile) {
                    updateUserProfile({ role: 'parent' });
                  }
                }}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  role === 'parent'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-white text-stone-700 border border-[#d5e2cf] hover:bg-[#edf3ea]'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Parent Mode</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('child');
                  if (currentUser && userProfile) {
                    updateUserProfile({ role: 'child' });
                  }
                }}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  role === 'child'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-white text-stone-700 border border-[#d5e2cf] hover:bg-[#edf3ea]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Child Mode</span>
              </button>
            </div>
          </div>

          <div className="p-3.5 bg-[#f8faf7] rounded-2xl border border-[#e1ebd9] flex flex-col justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-700" />
                Family Household ID
              </span>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Unique identifier for synchronizing routines across devices in your home.
              </p>
            </div>
            <div className="flex items-center justify-between gap-2 p-2 bg-white rounded-xl border border-[#d5e2cf] mt-1">
              <code className="text-xs font-mono font-bold text-stone-800 truncate">
                {userProfile?.familyId || 'family-routine-home'}
              </code>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors border border-emerald-200"
              >
                {copiedCode ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3 text-emerald-700" />}
                <span>{copiedCode ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: SHIFTED PARENT ROUTINE PLANNER & SETTINGS BANNER */}
      <div className="bg-[#213829] text-white rounded-3xl p-5 sm:p-6 shadow-sm border border-[#1b2f22] flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-700/50 flex items-center justify-center text-emerald-100 shrink-0 border border-emerald-600/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-base sm:text-lg font-bold tracking-tight text-white">
                  Parent Routine Planner
                </h2>
                <span className="text-[10px] font-bold bg-emerald-800 text-emerald-200 border border-emerald-600/40 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Admin
                </span>
              </div>
              <p className="text-xs text-emerald-200/80">
                Set schedules, assign key focus tasks, and map child routines
              </p>
            </div>
          </div>

          {/* Day Session Status pill */}
          <div className="bg-emerald-950/70 p-2.5 rounded-2xl border border-emerald-700/40 flex items-center justify-between sm:justify-start gap-3 text-xs self-stretch sm:self-auto">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-800 text-emerald-100">
                {!currentDaySession?.isStarted ? (
                  <Sun className="w-4 h-4" />
                ) : !currentDaySession?.isEnded ? (
                  <Clock className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </div>
              <div>
                <span className="text-emerald-100 font-semibold block">
                  {!currentDaySession?.isStarted
                    ? 'Day not started'
                    : !currentDaySession?.isEnded
                    ? `Started at ${currentDaySession.startedAt}`
                    : `Ended at ${currentDaySession.endedAt}`}
                </span>
                {currentDaySession?.afterEndDayNotes && currentDaySession.afterEndDayNotes.length > 0 && (
                  <span className="text-[10px] text-emerald-300 font-medium block">
                    {currentDaySession.afterEndDayNotes.length} after-hours activity logged
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {currentDaySession?.isStarted && !currentDaySession?.isEnded ? (
                <button
                  type="button"
                  onClick={() => endDay()}
                  className="px-2.5 py-1 bg-stone-700 hover:bg-stone-600 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
                >
                  End Day
                </button>
              ) : currentDaySession?.isEnded ? (
                <button
                  type="button"
                  onClick={() => resetDaySession()}
                  className="px-2 py-1 text-[11px] text-emerald-300 hover:text-white underline"
                >
                  Reset
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Children Management Row */}
        <div className="pt-3 border-t border-emerald-700/40 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-emerald-200/90 font-semibold flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-emerald-300" />
                <span>Children ({linkedChildren.length}):</span>
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {linkedChildren.length === 0 ? (
                  <span className="text-xs text-emerald-300/70 italic">
                    No children added yet. Use Link Child or Quick Add below.
                  </span>
                ) : (
                  linkedChildren.map((child) => (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => setActiveChildId(child.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                        activeChildId === child.id
                          ? 'bg-emerald-500 text-stone-950 shadow-xs ring-2 ring-emerald-300'
                          : 'bg-emerald-950/80 text-emerald-200 hover:bg-emerald-900 border border-emerald-700/50'
                      }`}
                      title="Click to set active for planning"
                    >
                      <User className="w-3 h-3" />
                      <span>{child.name}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setIsLinkModalOpen(true);
                  setInviteFeedback(null);
                }}
                className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/50 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
              >
                <HeartHandshake className="w-3.5 h-3.5 text-emerald-300" />
                <span>Link Child</span>
              </button>

              <button
                type="button"
                onClick={handleSyncChildren}
                disabled={isSyncing}
                className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-200 border border-emerald-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                title="Re-check cloud and link requests for newly accepted children"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-300 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Children'}</span>
              </button>

              {!isQuickAddOpen ? (
                <button
                  type="button"
                  onClick={() => setIsQuickAddOpen(true)}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-emerald-200 border border-emerald-600/40 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors"
                  title="Quick Nickname"
                >
                  <Plus className="w-3 h-3" />
                  <span>Quick Add</span>
                </button>
              ) : (
                <form onSubmit={handleQuickAddChild} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    required
                    value={quickAddName}
                    onChange={(e) => setQuickAddName(e.target.value)}
                    placeholder="Child's name"
                    className="px-2.5 py-1 text-xs bg-white text-stone-900 rounded-lg focus:outline-hidden placeholder:text-stone-400"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 bg-emerald-500 text-stone-950 font-bold rounded-lg text-xs"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsQuickAddOpen(false)}
                    className="px-2 py-1 text-emerald-300 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                </form>
              )}
            </div>
            {syncMsg && (
              <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>{syncMsg}</span>
              </div>
            )}
          </div>

          {/* Children Detailed List */}
          {linkedChildren.length > 0 && (
            <div className="bg-emerald-950/50 rounded-2xl border border-emerald-700/30 p-3 flex flex-col gap-2">
              <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                Linked Child Accounts
              </span>
              <div className="flex flex-col gap-1.5">
                {linkedChildren.map((child) => (
                  <div
                    key={child.id}
                    className="flex items-center justify-between p-2.5 bg-emerald-900/40 border border-emerald-700/30 rounded-xl text-xs text-white"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-800 flex items-center justify-center text-emerald-200">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-semibold block">{child.name}</span>
                        {child.email && (
                          <span className="text-[10px] text-emerald-300/70">{child.email}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {activeChildId === child.id ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-stone-950 text-[10px] font-bold">
                          Active Target
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActiveChildId(child.id)}
                          className="px-2 py-0.5 rounded-md bg-emerald-800 hover:bg-emerald-700 text-emerald-200 text-[10px] font-medium"
                        >
                          Set Active
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Remove ${child.name} from linked children?`)) {
                            removeLinkedChild(child.id);
                          }
                        }}
                        className="p-1 text-rose-300 hover:text-rose-100 hover:bg-rose-900/40 rounded-lg transition-colors"
                        title="Remove child"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: INCOMING & OUTGOING LINK REQUESTS */}
      {((pendingLinkRequests && pendingLinkRequests.length > 0) ||
        (sentLinkRequests && sentLinkRequests.length > 0)) && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#e1ebd9] shadow-xs flex flex-col gap-3.5">
          <h3 className="font-display text-sm sm:text-base font-bold text-stone-900 flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-emerald-800" />
            <span>Family Link Invitations</span>
          </h3>

          {/* Pending Incoming */}
          {pendingLinkRequests && pendingLinkRequests.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                Incoming Connection Requests
              </span>
              {pendingLinkRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-between gap-3 flex-wrap"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
                      <HeartHandshake className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                        {req.type === 'child_requests_parent' ? 'Child Request' : 'Parent Invitation'}
                      </span>
                      <p className="text-xs font-semibold text-stone-900">
                        {req.type === 'child_requests_parent'
                          ? `${req.childName || 'A child'} (${req.childEmail}) wants you as parent`
                          : `${req.parentName || 'A parent'} (${req.parentEmail}) invited you as child`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={isRespondingToReq === req.id}
                      onClick={async () => {
                        setIsRespondingToReq(req.id);
                        await respondToLinkRequest(req.id, false);
                        setIsRespondingToReq(null);
                      }}
                      className="px-2.5 py-1 text-xs rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 disabled:opacity-50"
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      disabled={isRespondingToReq === req.id}
                      onClick={async () => {
                        setIsRespondingToReq(req.id);
                        await respondToLinkRequest(req.id, true);
                        setIsRespondingToReq(null);
                      }}
                      className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-800 text-white hover:bg-emerald-900 flex items-center gap-1 disabled:opacity-50"
                    >
                      <Check className="w-3 h-3" />
                      <span>{isRespondingToReq === req.id ? 'Connecting...' : 'Accept & Connect'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sent Outgoing */}
          {sentLinkRequests && sentLinkRequests.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                Sent Invitations
              </span>
              {sentLinkRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-3 rounded-2xl bg-[#f8faf7] border border-[#e1ebd9] flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-stone-400" />
                    <div>
                      <span className="font-semibold text-stone-800">
                        {req.childEmail || req.parentEmail}
                      </span>
                      <span className="text-[10px] text-stone-400 ml-1.5">
                        ({req.type === 'parent_invites_child' ? 'Child invite' : 'Parent invite'})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        req.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : req.status === 'accepted'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {req.status}
                    </span>
                    {req.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => cancelLinkRequest(req.id)}
                        className="text-[11px] text-rose-600 hover:text-rose-800 underline"
                      >
                        Cancel
                      </button>
                    )}
                    {req.status === 'accepted' && (
                      <button
                        type="button"
                        onClick={async () => {
                          const targetId = req.childUid || req.id;
                          const isAlreadyLinked = linkedChildren.some(
                            (c) => c.id === targetId || (req.childEmail && c.email?.toLowerCase() === req.childEmail.toLowerCase())
                          );
                          if (!isAlreadyLinked) {
                            addLinkedChild(req.childName || req.childEmail?.split('@')[0] || 'Child', req.childEmail);
                          } else {
                            const match = linkedChildren.find(
                              (c) => c.id === targetId || (req.childEmail && c.email?.toLowerCase() === req.childEmail.toLowerCase())
                            );
                            if (match) setActiveChildId(match.id);
                          }
                        }}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-lg transition-colors ${
                          activeChildId === (req.childUid || req.id)
                            ? 'bg-emerald-800 text-white'
                            : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        }`}
                      >
                        {activeChildId === (req.childUid || req.id) ? '✓ Active' : 'Activate'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: PREFERENCES & NOTIFICATIONS */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#e1ebd9] shadow-xs flex flex-col gap-3">
        <h3 className="font-display text-sm sm:text-base font-bold text-stone-900 flex items-center gap-2">
          <Bell className="w-4 h-4 text-emerald-800" />
          <span>Reminders & System Sync</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 bg-[#f8faf7] rounded-2xl border border-[#e1ebd9] flex flex-col justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-stone-800 block">Device Notifications</span>
              <p className="text-xs text-stone-500 mt-0.5">
                Gentle chimes and reminder banners when routine blocks start.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={async () => {
                  const granted = await requestNotificationPermission();
                  if (granted) {
                    testSendReminder('Routine Ready', 'Gentle reminders are now active.');
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  notificationsEnabled
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-emerald-800 text-white hover:bg-emerald-900'
                }`}
              >
                {notificationsEnabled ? 'Notifications Active' : 'Enable Notifications'}
              </button>
              {notificationsEnabled && (
                <button
                  type="button"
                  onClick={() => testSendReminder('Test Reminder', 'Here is a gentle routine chime.')}
                  className="px-2.5 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-xl border border-stone-200"
                >
                  Test Sound
                </button>
              )}
            </div>
          </div>

          <div className="p-3.5 bg-[#f8faf7] rounded-2xl border border-[#e1ebd9] flex flex-col justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-stone-800 block">Database Synchronization</span>
              <p className="text-xs text-stone-500 mt-0.5">
                Persistent cloud storage connected via Google Firebase Firestore.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-semibold mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-time sync operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* LINK CHILD DIALOG MODAL */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 p-5 sm:p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-stone-900">
                    Link Family Member
                  </h3>
                  <p className="text-xs text-stone-500">
                    Invite child or co-parent by their email address
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsLinkModalOpen(false);
                  setInviteFeedback(null);
                }}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Role selector for invitation */}
            <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl">
              <button
                type="button"
                onClick={() => setInviteRole('child')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  inviteRole === 'child'
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Invite as Child
              </button>
              <button
                type="button"
                onClick={() => setInviteRole('parent')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  inviteRole === 'parent'
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Invite as Parent
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Email Address <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Display Name (Optional)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="e.g. Alex"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-hidden"
                  />
                </div>
              </div>

              {inviteFeedback && (
                <div
                  className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                    inviteFeedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {inviteFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{inviteFeedback.text}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsLinkModalOpen(false);
                    setInviteFeedback(null);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSendingInvite}
                  className="px-4 py-1.5 text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl shadow-xs disabled:opacity-50"
                >
                  {isSendingInvite ? 'Sending...' : 'Send Link Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
