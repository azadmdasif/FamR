import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import {
  Shield,
  Sparkles,
  LogIn,
  UserPlus,
  Lock,
  Mail,
  User,
  HeartHandshake,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Users,
  Plus,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const AuthModal: React.FC = () => {
  const {
    currentUser,
    userProfile,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    updateUserProfile,
    signOutUser,
    isAuthModalOpen,
    setIsAuthModalOpen,
    role,
    setRole,
    linkedChildren,
    addLinkedChild,
    removeLinkedChild,
    linkedParents,
    addLinkedParent,
    removeLinkedParent,
    activeChildId,
    setActiveChildId,
    pendingLinkRequests,
    sentLinkRequests,
    sendChildLinkRequest,
    sendParentLinkRequest,
    respondToLinkRequest,
    cancelLinkRequest,
  } = useApp();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  // While registering, person selects their initial role
  const [signupStep, setSignupStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('parent');
  const [roleAccepted, setRoleAccepted] = useState(false);
  const [familyCode, setFamilyCode] = useState('family-routine-home');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // For first-time Google sign-in if role hasn't been explicitly selected
  const [googleNeedsRoleSetup, setGoogleNeedsRoleSetup] = useState(false);

  // Profile family tab selector
  const [familySectionTab, setFamilySectionTab] = useState<'children' | 'parents' | 'requests'>('children');

  // Child invitation input in profile view
  const [inviteChildEmail, setInviteChildEmail] = useState('');
  const [inviteChildName, setInviteChildName] = useState('');
  const [inviteMsg, setInviteMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [isAddingChild, setIsAddingChild] = useState(false);

  // Parent invitation input in profile view
  const [inviteParentEmail, setInviteParentEmail] = useState('');
  const [inviteParentName, setInviteParentName] = useState('');
  const [parentInviteMsg, setParentInviteMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSendingParentInvite, setIsSendingParentInvite] = useState(false);
  const [isAddingParent, setIsAddingParent] = useState(false);

  const [isRespondingToReq, setIsRespondingToReq] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  // Step 1 -> Step 2 validation
  const handleProceedToRole = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password.trim() || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSignupStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        if (!email.trim() || !password.trim()) {
          throw new Error('Please enter both email and password.');
        }
        await signInWithEmail(email.trim(), password);
      } else {
        if (!displayName.trim()) {
          throw new Error('Please enter your name.');
        }
        if (!email.trim() || !password.trim()) {
          throw new Error('Please enter both email and password.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        if (!roleAccepted) {
          throw new Error(`Please confirm and accept your role as ${selectedRole === 'parent' ? 'Parent (Guardian)' : 'Child'} before continuing.`);
        }
        await signUpWithEmail(
          email.trim(),
          password,
          displayName.trim(),
          selectedRole,
          familyCode.trim() || 'family-routine-home'
        );
      }
      setIsAuthModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup' && !roleAccepted) {
        throw new Error(
          `Please check the box to confirm and accept the role of ${selectedRole === 'parent' ? 'Parent' : 'Child'}.`
        );
      }

      const roleChoice = selectedRole || role || 'child';
      const familyChoice = familyCode.trim() || 'family-routine-home';

      const result = await signInWithGoogle(roleChoice, familyChoice);

      // If user was brand-new and hadn't accepted role on sign-up screen, prompt them
      if (result.isNewUser && mode === 'signin' && !roleAccepted) {
        setGoogleNeedsRoleSetup(true);
      } else {
        setIsAuthModalOpen(false);
      }
    } catch (err: any) {
      if (
        err.code === 'auth/popup-closed-by-user' ||
        err.code === 'auth/cancelled-popup-request'
      ) {
        return;
      }
      console.error(err);
      setError(err.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinishGoogleRoleSetup = async () => {
    if (!roleAccepted) {
      setError('Please check the box to confirm and accept your role.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await updateUserProfile({
        role: selectedRole,
        familyId: familyCode.trim() || 'family-routine-home',
        linkedChildren:
          selectedRole === 'parent'
            ? [{ id: 'child-default', name: 'Child Account' }]
            : undefined,
      });
      setGoogleNeedsRoleSetup(false);
      setIsAuthModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to update role.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyFamilyCode = () => {
    const code = userProfile?.familyId || familyCode;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Preset demo accounts for quick sign in / role testing
  const handleQuickDemoSignIn = async (targetRole: UserRole) => {
    setError(null);
    setLoading(true);
    try {
      const demoEmail = targetRole === 'child' ? 'child@family.app' : 'parent@family.app';
      const demoPassword = 'Password123!';
      const demoName = targetRole === 'child' ? 'Child Account' : 'Parent Account';

      try {
        await signInWithEmail(demoEmail, demoPassword);
      } catch {
        // If demo user doesn't exist yet, sign up automatically
        await signUpWithEmail(demoEmail, demoPassword, demoName, targetRole, 'family-routine-home');
      }
      setIsAuthModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Quick demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 relative animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 w-8 h-8 rounded-full flex items-center justify-center bg-stone-100 hover:bg-stone-200 transition-colors"
          aria-label="Close"
        >
          ✕
        </button>

        {/* If new Google User needs to confirm role */}
        {currentUser && googleNeedsRoleSetup ? (
          <div className="flex flex-col gap-4 py-2">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-800 text-white mb-2 shadow-xs">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl font-bold text-stone-900">
                Welcome to Family Routine!
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Select your account role to complete registration
              </p>
            </div>

            {/* Multi-Role Support Callout */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2 text-xs text-emerald-950">
              <HeartHandshake className="w-4 h-4 shrink-0 text-emerald-800 mt-0.5" />
              <div className="leading-snug">
                <strong>Dual-Role Ready:</strong> You can be a parent to your children and a child to your parents. Select your initial primary mode below — you can switch roles anytime.
              </div>
            </div>

            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  1. Choose Your Account Role <span className="text-rose-600">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('parent')}
                    className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all text-left ${
                      selectedRole === 'parent'
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs ring-2 ring-emerald-600'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Shield className="w-4 h-4" />
                      <span className="font-bold text-sm">Parent</span>
                    </div>
                    <span className="text-[10px] opacity-80 text-center font-normal leading-tight">
                      Full controls. Set routines & assign tasks. Child view disabled.
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('child')}
                    className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all text-left ${
                      selectedRole === 'child'
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs ring-2 ring-emerald-600'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      <span className="font-bold text-sm">Child</span>
                    </div>
                    <span className="text-[10px] opacity-80 text-center font-normal leading-tight">
                      Follow daily schedule, focus timer, & speech practice.
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  2. Your Name or Nickname
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={selectedRole === 'parent' ? 'e.g. Mom, Dad' : 'e.g. Alex'}
                    className="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2 p-2.5 bg-[#f4f8f2] border border-[#d5e2cf] rounded-xl text-xs text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={roleAccepted}
                  onChange={(e) => setRoleAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-emerald-800 border-stone-300 focus:ring-emerald-700"
                />
                <span className="leading-snug">
                  I confirm my initial role as{' '}
                  <strong className="text-emerald-900 capitalize font-bold">
                    {selectedRole === 'parent' ? 'Parent (Guardian)' : 'Child'}
                  </strong>{' '}
                  and understand I can switch views or connect to both children and parents anytime.
                </span>
              </label>

              <button
                type="button"
                onClick={handleFinishGoogleRoleSetup}
                disabled={loading || !roleAccepted}
                className="w-full mt-2 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-98 disabled:opacity-50"
              >
                {loading
                  ? 'Saving...'
                  : selectedRole === 'parent'
                  ? 'Complete Registration as Parent'
                  : 'Complete Registration as Child'}
              </button>
            </div>
          </div>
        ) : currentUser && userProfile ? (
          /* Signed In User Profile View */
          <div className="flex flex-col items-center text-center gap-3.5 py-1">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
              {userProfile.role === 'parent' ? (
                <Shield className="w-7 h-7" />
              ) : (
                <Sparkles className="w-7 h-7" />
              )}
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold uppercase tracking-wider mb-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Signed In as {userProfile.role === 'parent' ? 'Parent' : 'Child'}</span>
              </div>
              <h3 className="font-display text-lg sm:text-xl font-bold text-stone-900">{userProfile.displayName}</h3>
              <p className="text-xs text-stone-500">{userProfile.email}</p>
            </div>

            {/* Household & Child Mapping Card */}
            <div className="w-full bg-[#f8faf7] p-3.5 rounded-2xl border border-[#e1ebd9] text-xs text-stone-600 text-left flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-800 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-700" />
                  Family Household Link
                </span>
                <button
                  onClick={handleCopyFamilyCode}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-[#d5e2cf] text-[11px] font-medium text-emerald-900 hover:bg-emerald-50"
                  title="Copy Household Code"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3 text-stone-500" />}
                  <span>{userProfile.familyId}</span>
                </button>
              </div>

              {/* Family Links Segmented Tabs */}
              <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFamilySectionTab('children')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                    familySectionTab === 'children'
                      ? 'bg-white text-emerald-950 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  My Children ({linkedChildren.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFamilySectionTab('parents')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                    familySectionTab === 'parents'
                      ? 'bg-white text-emerald-950 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  My Parents ({linkedParents.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFamilySectionTab('requests')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all relative ${
                    familySectionTab === 'requests'
                      ? 'bg-white text-emerald-950 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Requests
                  {pendingLinkRequests.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 bg-rose-600 text-white text-[10px] rounded-full font-bold">
                      {pendingLinkRequests.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Tab 1: Children */}
              {familySectionTab === 'children' && (
                <div className="flex flex-col gap-2.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-stone-800">
                      Linked Children ({linkedChildren.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingChild(!isAddingChild)}
                      className="text-[11px] font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{isAddingChild ? 'Close' : 'Invite / Link Child'}</span>
                    </button>
                  </div>

                  {isAddingChild && (
                    <div className="p-3 bg-white rounded-xl border border-emerald-200 flex flex-col gap-2 shadow-xs">
                      <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                        <HeartHandshake className="w-3.5 h-3.5" />
                        Send Link Request to Child's Email
                      </span>
                      <p className="text-[10px] text-stone-500 leading-snug">
                        Your child will receive an invitation banner in their portal to Accept & Connect.
                      </p>
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (!inviteChildEmail) return;
                          setIsSendingInvite(true);
                          setInviteMsg(null);
                          const res = await sendChildLinkRequest(inviteChildEmail, inviteChildName);
                          setIsSendingInvite(false);
                          if (res.success) {
                            setInviteMsg({ type: 'success', text: res.message });
                            setInviteChildEmail('');
                            setInviteChildName('');
                          } else {
                            setInviteMsg({ type: 'error', text: res.message });
                          }
                        }}
                        className="flex flex-col gap-1.5"
                      >
                        <input
                          type="email"
                          required
                          value={inviteChildEmail}
                          onChange={(e) => setInviteChildEmail(e.target.value)}
                          placeholder="Child account email (e.g. child@example.com)"
                          className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-[#d5e2cf] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                        />
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={inviteChildName}
                            onChange={(e) => setInviteChildName(e.target.value)}
                            placeholder="Child's name (optional)"
                            className="flex-1 px-2.5 py-1.5 text-xs bg-stone-50 border border-[#d5e2cf] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                          />
                          <button
                            type="submit"
                            disabled={isSendingInvite}
                            className="px-3 py-1.5 bg-emerald-800 text-white rounded-lg text-xs font-bold hover:bg-emerald-900 disabled:opacity-50"
                          >
                            {isSendingInvite ? 'Sending...' : 'Send Request'}
                          </button>
                        </div>
                      </form>
                      {inviteMsg && (
                        <div
                          className={`p-2 rounded-lg text-[11px] font-medium ${
                            inviteMsg.type === 'success'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {inviteMsg.text}
                        </div>
                      )}
                    </div>
                  )}

                  {linkedChildren.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {linkedChildren.map((child) => (
                        <div
                          key={child.id}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                            activeChildId === child.id
                              ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                              : 'bg-white border-[#d5e2cf] text-stone-700 hover:bg-[#edf3ea]'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setActiveChildId(child.id)}
                            className="text-left font-medium"
                          >
                            {child.name}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeLinkedChild(child.id)}
                            className="ml-1 text-stone-400 hover:text-rose-500 text-[10px]"
                            title="Remove child"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-stone-500 italic">
                      No children linked yet. Click "Invite / Link Child" to send a link request.
                    </p>
                  )}

                  {/* Sent requests status */}
                  {sentLinkRequests && sentLinkRequests.filter(r => r.type !== 'child_requests_parent').length > 0 && (
                    <div className="flex flex-col gap-1 pt-1 border-t border-[#e1ebd9]">
                      <span className="text-[11px] font-bold text-stone-700">Sent Child Invitations:</span>
                      {sentLinkRequests
                        .filter(r => r.type !== 'child_requests_parent')
                        .map((req) => (
                          <div
                            key={req.id}
                            className="flex items-center justify-between text-[11px] p-1.5 bg-white rounded-lg border border-[#e1ebd9]"
                          >
                            <span className="truncate text-stone-700">
                              {req.childName ? `${req.childName} (${req.childEmail})` : req.childEmail}
                            </span>
                            <div className="flex items-center gap-1">
                              {req.status === 'pending' ? (
                                <>
                                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold">
                                    Pending acceptance
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => cancelLinkRequest(req.id)}
                                    className="text-stone-400 hover:text-rose-600 px-1"
                                    title="Cancel invite"
                                  >
                                    ✕
                                  </button>
                                </>
                              ) : req.status === 'accepted' ? (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">
                                  Accepted
                                </span>
                              ) : (
                                <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">
                                  Declined
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Parents */}
              {familySectionTab === 'parents' && (
                <div className="flex flex-col gap-2.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-stone-800">
                      Linked Parents ({linkedParents.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingParent(!isAddingParent)}
                      className="text-[11px] font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{isAddingParent ? 'Close' : 'Request / Link Parent'}</span>
                    </button>
                  </div>

                  {isAddingParent && (
                    <div className="p-3 bg-white rounded-xl border border-emerald-200 flex flex-col gap-2 shadow-xs">
                      <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                        <HeartHandshake className="w-3.5 h-3.5" />
                        Send Link Request to Parent's Email
                      </span>
                      <p className="text-[10px] text-stone-500 leading-snug">
                        Your parent will receive a request to link with you and help organize your daily tasks.
                      </p>
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (!inviteParentEmail) return;
                          setIsSendingParentInvite(true);
                          setParentInviteMsg(null);
                          const res = await sendParentLinkRequest(inviteParentEmail, inviteParentName);
                          setIsSendingParentInvite(false);
                          if (res.success) {
                            setParentInviteMsg({ type: 'success', text: res.message });
                            setInviteParentEmail('');
                            setInviteParentName('');
                          } else {
                            setParentInviteMsg({ type: 'error', text: res.message });
                          }
                        }}
                        className="flex flex-col gap-1.5"
                      >
                        <input
                          type="email"
                          required
                          value={inviteParentEmail}
                          onChange={(e) => setInviteParentEmail(e.target.value)}
                          placeholder="Parent account email (e.g. mom@example.com)"
                          className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-[#d5e2cf] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                        />
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={inviteParentName}
                            onChange={(e) => setInviteParentName(e.target.value)}
                            placeholder="Parent's name (optional)"
                            className="flex-1 px-2.5 py-1.5 text-xs bg-stone-50 border border-[#d5e2cf] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                          />
                          <button
                            type="submit"
                            disabled={isSendingParentInvite}
                            className="px-3 py-1.5 bg-emerald-800 text-white rounded-lg text-xs font-bold hover:bg-emerald-900 disabled:opacity-50"
                          >
                            {isSendingParentInvite ? 'Sending...' : 'Send Request'}
                          </button>
                        </div>
                      </form>
                      {parentInviteMsg && (
                        <div
                          className={`p-2 rounded-lg text-[11px] font-medium ${
                            parentInviteMsg.type === 'success'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {parentInviteMsg.text}
                        </div>
                      )}
                    </div>
                  )}

                  {linkedParents.length > 0 ? (
                    <div className="flex flex-col gap-1.5">
                      {linkedParents.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#d5e2cf] text-xs"
                        >
                          <div className="flex flex-col">
                            <span className="font-bold text-stone-900">{p.name}</span>
                            <span className="text-[11px] text-stone-500">{p.email}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeLinkedParent(p.id)}
                            className="text-stone-400 hover:text-rose-600 text-xs px-2 py-1 rounded-lg hover:bg-stone-100"
                            title="Unlink parent"
                          >
                            Unlink
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-stone-500 italic">
                      No parents linked yet. Click "Request / Link Parent" or share your email ({userProfile.email}).
                    </p>
                  )}

                  {/* Sent parent requests status */}
                  {sentLinkRequests && sentLinkRequests.filter(r => r.type === 'child_requests_parent').length > 0 && (
                    <div className="flex flex-col gap-1 pt-1 border-t border-[#e1ebd9]">
                      <span className="text-[11px] font-bold text-stone-700">Sent Parent Requests:</span>
                      {sentLinkRequests
                        .filter(r => r.type === 'child_requests_parent')
                        .map((req) => (
                          <div
                            key={req.id}
                            className="flex items-center justify-between text-[11px] p-1.5 bg-white rounded-lg border border-[#e1ebd9]"
                          >
                            <span className="truncate text-stone-700">
                              {req.parentName ? `${req.parentName} (${req.parentEmail})` : req.parentEmail}
                            </span>
                            <div className="flex items-center gap-1">
                              {req.status === 'pending' ? (
                                <>
                                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold">
                                    Pending
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => cancelLinkRequest(req.id)}
                                    className="text-stone-400 hover:text-rose-600 px-1"
                                    title="Cancel request"
                                  >
                                    ✕
                                  </button>
                                </>
                              ) : req.status === 'accepted' ? (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">
                                  Accepted
                                </span>
                              ) : (
                                <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">
                                  Declined
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Incoming Requests */}
              {familySectionTab === 'requests' && (
                <div className="flex flex-col gap-2.5 pt-1">
                  {pendingLinkRequests && pendingLinkRequests.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {pendingLinkRequests.map((req) => (
                        <div
                          key={req.id}
                          className="p-2.5 rounded-xl bg-white border border-emerald-300 shadow-xs flex flex-col gap-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                              {req.type === 'child_requests_parent' ? 'Child Request' : 'Parent Invitation'}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-xs text-stone-900">
                              {req.type === 'child_requests_parent'
                                ? `${req.childName || 'A child'} wants you to be their parent`
                                : `${req.parentName || 'A parent'} wants to link as your parent`}
                            </span>
                            <span className="text-[11px] text-stone-500">
                              {req.type === 'child_requests_parent' ? req.childEmail : req.parentEmail}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 justify-end">
                            <button
                              type="button"
                              disabled={isRespondingToReq === req.id}
                              onClick={async () => {
                                setIsRespondingToReq(req.id);
                                await respondToLinkRequest(req.id, false);
                                setIsRespondingToReq(null);
                              }}
                              className="px-2.5 py-1 text-xs rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-100"
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
                              className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-800 text-white hover:bg-emerald-900 flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>{isRespondingToReq === req.id ? 'Connecting...' : 'Accept & Connect'}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-3 text-stone-500 text-xs flex flex-col gap-1">
                      <p>No incoming requests.</p>
                      <p className="text-[11px] text-stone-400">
                        Share your email (<strong className="text-stone-700">{userProfile.email}</strong>) to connect.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Role Switcher & Editor */}
            <div className="w-full p-3 rounded-2xl bg-[#edf3ea] border border-[#d5e2cf] text-xs text-stone-800 flex flex-col gap-2.5 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                  {userProfile.role === 'parent' ? (
                    <Shield className="w-4 h-4 text-emerald-800" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-emerald-800" />
                  )}
                  <span>Current Role: {userProfile.role === 'parent' ? 'Parent (Guardian)' : 'Child'}</span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                  Editable
                </span>
              </div>

              <p className="text-[11px] text-stone-600 leading-snug">
                Need to switch between managing routines as a Guardian and experiencing the child view? Select your desired role below:
              </p>

              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  id="profile-switch-to-parent-btn"
                  type="button"
                  onClick={async () => {
                    await updateUserProfile({ role: 'parent' });
                    setRole('parent');
                  }}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    (userProfile.role || role) === 'parent'
                      ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                      : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Parent Mode</span>
                </button>

                <button
                  id="profile-switch-to-child-btn"
                  type="button"
                  onClick={async () => {
                    await updateUserProfile({ role: 'child' });
                    setRole('child');
                  }}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    (userProfile.role || role) === 'child'
                      ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                      : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Child Mode</span>
                </button>
              </div>
            </div>

            <div className="w-full pt-1">
              <button
                id="profile-signout-btn"
                onClick={async () => {
                  await signOutUser();
                  setIsAuthModalOpen(false);
                }}
                className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          /* Sign In or Multi-Step Sign Up Form */
          <div className="flex flex-col gap-3.5">
            {mode === 'signup' && signupStep === 2 ? (
              /* Step 2: Role Selection AFTER email address login */
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setSignupStep(1);
                    }}
                    className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 font-semibold transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Change Email</span>
                  </button>
                  <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2.5 py-0.5 rounded-full">
                    Step 2 of 2
                  </span>
                </div>

                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-emerald-800 text-white mb-1.5 shadow-xs">
                    <Shield className="w-5 h-5" />
                  </div>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-stone-900">
                    Select Your Account Role
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Account: <strong className="text-emerald-950 font-semibold">{email}</strong>
                  </p>
                </div>

                {/* Strict Role Separation Policy Warning */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2 text-xs text-amber-900">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
                  <div className="leading-snug">
                    <strong>Strict Role Policy:</strong> When a person is registered as a parent, they cannot be a child. The child view will be completely removed for this parent account.
                  </div>
                </div>

                {error && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      1. Choose Your Role <span className="text-rose-600">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedRole('parent')}
                        className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all text-left ${
                          selectedRole === 'parent'
                            ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs ring-2 ring-emerald-600'
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <Shield className="w-4 h-4" />
                          <span className="font-bold text-sm">Parent</span>
                        </div>
                        <span className="text-[10px] opacity-85 text-center font-normal leading-tight">
                          Manage schedule, routines & tasks. Child view disabled.
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRole('child')}
                        className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all text-left ${
                          selectedRole === 'child'
                            ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs ring-2 ring-emerald-600'
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <Sparkles className="w-4 h-4" />
                          <span className="font-bold text-sm">Child</span>
                        </div>
                        <span className="text-[10px] opacity-85 text-center font-normal leading-tight">
                          Follow daily routines, check off tasks, & speech practice.
                        </span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      2. Your Name or Nickname <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder={selectedRole === 'parent' ? 'e.g. Mom or Dad' : 'e.g. Alex'}
                        className="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Role Confirmation Checkbox */}
                  <label className="flex items-start gap-2 p-2.5 bg-[#f4f8f2] border border-[#d5e2cf] rounded-xl text-xs text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={roleAccepted}
                      onChange={(e) => setRoleAccepted(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-emerald-800 border-stone-300 focus:ring-emerald-700"
                    />
                    <span className="leading-snug">
                      I confirm my initial role as{' '}
                      <strong className="text-emerald-900 capitalize font-bold">
                        {selectedRole === 'parent' ? 'Parent (Guardian)' : 'Child'}
                      </strong>{' '}
                      and understand I can switch views or connect to both children and parents anytime.
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={loading || !roleAccepted}
                    className="w-full mt-1 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-98 disabled:opacity-50"
                  >
                    {loading ? (
                      <span>Creating Account...</span>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>
                          {selectedRole === 'parent'
                            ? 'Complete Registration as Parent'
                            : 'Complete Registration as Child'}
                        </span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              /* Sign In Form or Step 1 of Sign Up (Email & Password) */
              <>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-emerald-800 text-white mb-2 shadow-xs">
                    <Shield className="w-5 h-5" />
                  </div>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-stone-900">
                    {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {mode === 'signin'
                      ? 'Welcome back! Sign in to access your portal'
                      : 'Step 1: Enter your email address and password'}
                  </p>
                </div>

                {/* Google Sign In Button */}
                <div className="flex flex-col gap-2">
                  <button
                    id="google-signin-action-btn"
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 hover:border-stone-400 rounded-2xl text-xs font-bold flex items-center justify-center gap-2.5 transition-all shadow-xs active:scale-98 disabled:opacity-50"
                  >
                    <GoogleIcon className="w-4 h-4 shrink-0" />
                    <span>
                      {mode === 'signin' ? 'Continue with Google' : 'Sign up with Google'}
                    </span>
                  </button>
                </div>

                {/* Quick 1-Tap Demo Logins */}
                <div className="bg-[#f5f8f3] p-2.5 rounded-2xl border border-[#e1ebd9] flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider text-center">
                    Quick 1-Tap Testing Access
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickDemoSignIn('child')}
                      disabled={loading}
                      className="p-2 bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all shadow-xs active:scale-98"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Child Account</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDemoSignIn('parent')}
                      disabled={loading}
                      className="p-2 bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all shadow-xs active:scale-98"
                    >
                      <Shield className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Parent Account</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 my-0.5">
                  <div className="h-px bg-stone-200 flex-1" />
                  <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">or with email</span>
                  <div className="h-px bg-stone-200 flex-1" />
                </div>

                {error && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <form
                  onSubmit={mode === 'signin' ? handleSubmit : handleProceedToRole}
                  className="flex flex-col gap-2.5"
                >
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@example.com"
                        className="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-1 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-98 disabled:opacity-50"
                  >
                    {loading ? (
                      <span>Processing...</span>
                    ) : mode === 'signin' ? (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>Sign In with Email</span>
                      </>
                    ) : (
                      <>
                        <span>Continue: Choose Account Role</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="text-center pt-1 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setMode(mode === 'signin' ? 'signup' : 'signin');
                      setSignupStep(1);
                    }}
                    className="text-xs text-emerald-800 hover:underline font-semibold"
                  >
                    {mode === 'signin'
                      ? "Don't have an account? Sign Up"
                      : 'Already have an account? Sign In'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
