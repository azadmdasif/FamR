import React, { useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  ExternalLink,
  Info,
  Lock,
  Moon,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const FamilyLinkGuide: React.FC = () => {
  const { timeBlocks } = useApp();

  // Find bedtime block and free screen time block from routine
  const bedtimeBlock = timeBlocks.find((b) => b.category === 'bedtime') || {
    startTime: '21:30',
    endTime: '07:00',
  };
  const freeScreenBlock = timeBlocks.find((b) => b.isFreeScreenTime || b.category === 'free_time') || {
    startTime: '16:30',
    endTime: '17:30',
  };

  // State for checklist steps completed
  const [checklist, setChecklist] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('zahid_family_link_checklist');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleChecklist = (id: string) => {
    setChecklist((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      localStorage.setItem('zahid_family_link_checklist', JSON.stringify(updated));
      return updated;
    });
  };

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const [openAccordion, setOpenAccordion] = useState<string>('step1');

  const toggleAccordion = (id: string) => {
    setOpenAccordion((current) => (current === id ? '' : id));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#1b3824] to-[#264e33] text-white border border-[#16301e] shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-800/80 border border-emerald-600/40 flex items-center justify-center text-emerald-200">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm sm:text-base text-white">
                Google Family Link Pairing
              </h3>
              <p className="text-xs text-emerald-200">
                Enforce OS-level phone lock & track overall screen time
              </p>
            </div>
          </div>

          <span className="text-[11px] font-semibold bg-emerald-950/70 border border-emerald-700/50 text-emerald-200 px-2.5 py-1 rounded-full">
            iOS ↔ Android
          </span>
        </div>

        <p className="text-xs text-emerald-100/90 leading-relaxed">
          Because web browsers cannot monitor other apps when closed, pairing this planner with{' '}
          <strong className="text-white font-semibold">Google Family Link</strong> gives you complete automated enforcement on his Android device directly from your iPhone.
        </p>

        {/* Device Matrix Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-emerald-700/40">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-950/40 border border-emerald-700/30 text-xs">
            <Smartphone className="w-4 h-4 text-emerald-300 shrink-0" />
            <div>
              <span className="text-[10px] text-emerald-300 uppercase tracking-wider font-semibold block">
                Your Device (Guardian)
              </span>
              <span className="text-white font-medium">Apple iPhone / iPad (iOS)</span>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-950/40 border border-emerald-700/30 text-xs">
            <Smartphone className="w-4 h-4 text-emerald-300 shrink-0" />
            <div>
              <span className="text-[10px] text-emerald-300 uppercase tracking-wider font-semibold block">
                Zahid's Device (Supervised)
              </span>
              <span className="text-white font-medium">Android Phone</span>
            </div>
          </div>
        </div>
      </div>

      {/* Routine Sync Values Card */}
      <div className="p-4 rounded-3xl bg-white border border-[#e1ebd9] shadow-xs flex flex-col gap-2.5">
        <div className="flex items-center gap-2 text-stone-900">
          <Clock className="w-4 h-4 text-emerald-800" />
          <h4 className="font-display text-xs font-bold uppercase tracking-wider">
            Current Planner Schedule to Copy into Family Link
          </h4>
        </div>
        <p className="text-xs text-stone-500">
          Use these exact hours when setting up Bedtime Downtime and App Limits in Google Family Link:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
          {/* Bedtime Lock */}
          <div className="p-3 rounded-2xl bg-[#edf5eb] border border-[#cbe0c6] flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-950">
                <Moon className="w-3.5 h-3.5 text-emerald-800" />
                <span>Bedtime Lock (Downtime)</span>
              </div>
              <span className="text-sm font-bold text-stone-900 mt-0.5 block">
                {bedtimeBlock.startTime} – {bedtimeBlock.endTime}
              </span>
              <span className="text-[11px] text-stone-500">
                Phone automatically locks at End Day
              </span>
            </div>
            <button
              onClick={() => copyToClipboard(bedtimeBlock.startTime, 'bedtime')}
              className="p-2 rounded-xl bg-white border border-emerald-200 text-stone-700 hover:text-emerald-900 text-xs font-medium flex items-center gap-1 shadow-2xs"
            >
              {copiedKey === 'bedtime' ? (
                <Check className="w-3.5 h-3.5 text-emerald-700" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span className="text-[11px]">{copiedKey === 'bedtime' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Guaranteed Free Screen Time */}
          <div className="p-3 rounded-2xl bg-[#f5f8f3] border border-[#e1ece0] flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-800">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                <span>Free Screen Time Window</span>
              </div>
              <span className="text-sm font-bold text-stone-900 mt-0.5 block">
                {freeScreenBlock.startTime} – {freeScreenBlock.endTime}
              </span>
              <span className="text-[11px] text-stone-500">
                Allowed entertainment screen time
              </span>
            </div>
            <button
              onClick={() => copyToClipboard(freeScreenBlock.startTime, 'freetime')}
              className="p-2 rounded-xl bg-white border border-stone-200 text-stone-700 hover:text-emerald-900 text-xs font-medium flex items-center gap-1 shadow-2xs"
            >
              {copiedKey === 'freetime' ? (
                <Check className="w-3.5 h-3.5 text-emerald-700" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span className="text-[11px]">{copiedKey === 'freetime' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Step-by-Step Setup Guide Accordions */}
      <div className="flex flex-col gap-2">
        {/* STEP 1 */}
        <div className="rounded-2xl bg-white border border-[#e1ebd9] overflow-hidden transition-all shadow-xs">
          <button
            onClick={() => toggleAccordion('step1')}
            className="w-full p-3.5 sm:p-4 text-left flex items-center justify-between gap-3 hover:bg-[#fafcfa]"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-emerald-800 text-white text-xs font-bold flex items-center justify-center">
                1
              </span>
              <div>
                <h5 className="font-semibold text-xs sm:text-sm text-stone-900">
                  Install Google Family Link on your iPhone (iOS)
                </h5>
                <p className="text-[11px] text-stone-500">
                  The central control hub on your Apple device
                </p>
              </div>
            </div>
            {openAccordion === 'step1' ? (
              <ChevronUp className="w-4 h-4 text-stone-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-stone-400" />
            )}
          </button>

          {openAccordion === 'step1' && (
            <div className="px-4 pb-4 pt-1 border-t border-[#edf3ea] flex flex-col gap-3 text-xs text-stone-700">
              <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                <li>
                  Open the <strong>App Store</strong> on your iPhone and search for{' '}
                  <strong className="text-emerald-950 font-semibold">Google Family Link</strong>.
                </li>
                <li>Download and open the app.</li>
                <li>
                  Sign in with your <strong>Google Account</strong> (as Parent / Guardian).
                </li>
                <li>
                  Create a <strong>Family Group</strong> if you don't already have one.
                </li>
              </ol>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#f5f8f3] border border-[#e1ebd9]">
                <span className="text-[11px] font-medium text-stone-600">
                  Google Family Link on iOS App Store
                </span>
                <a
                  href="https://apps.apple.com/app/google-family-link/id1150085200"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>Open App Store</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!checklist['step1']}
                  onChange={() => toggleChecklist('step1')}
                  className="w-4 h-4 text-emerald-800 rounded border-stone-300 focus:ring-emerald-600"
                />
                <span className="text-xs font-medium text-stone-800">
                  Family Link installed & signed in on iPhone
                </span>
              </label>
            </div>
          )}
        </div>

        {/* STEP 2 */}
        <div className="rounded-2xl bg-white border border-[#e1ebd9] overflow-hidden transition-all shadow-xs">
          <button
            onClick={() => toggleAccordion('step2')}
            className="w-full p-3.5 sm:p-4 text-left flex items-center justify-between gap-3 hover:bg-[#fafcfa]"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-emerald-800 text-white text-xs font-bold flex items-center justify-center">
                2
              </span>
              <div>
                <h5 className="font-semibold text-xs sm:text-sm text-stone-900">
                  Connect Zahid's Android Device
                </h5>
                <p className="text-[11px] text-stone-500">
                  Link his Google account to your Family Group
                </p>
              </div>
            </div>
            {openAccordion === 'step2' ? (
              <ChevronUp className="w-4 h-4 text-stone-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-stone-400" />
            )}
          </button>

          {openAccordion === 'step2' && (
            <div className="px-4 pb-4 pt-1 border-t border-[#edf3ea] flex flex-col gap-3 text-xs text-stone-700">
              <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                <li>
                  On Zahid's Android phone, open <strong>Settings</strong>.
                </li>
                <li>
                  Tap <strong>Google</strong> (or <strong>Digital Wellbeing & Parental Controls</strong>).
                </li>
                <li>
                  Select <strong>Parental Controls</strong> &gt; <strong>Get Started</strong>.
                </li>
                <li>
                  Choose <strong>Child or teen</strong> and select his Google Account.
                </li>
                <li>
                  Enter your Guardian Google credentials or link with the invite code from your iPhone Family Link app.
                </li>
              </ol>

              <div className="p-2.5 bg-[#edf5eb] rounded-xl border border-[#cbe0c6] flex items-start gap-2">
                <Info className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                <p className="text-[11px] text-emerald-950 leading-relaxed">
                  Once linked, Android gives Family Link deep operating-system level control: it can lock the device, enforce bedtimes, block app uninstalls, and measure screen time down to the minute.
                </p>
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!checklist['step2']}
                  onChange={() => toggleChecklist('step2')}
                  className="w-4 h-4 text-emerald-800 rounded border-stone-300 focus:ring-emerald-600"
                />
                <span className="text-xs font-medium text-stone-800">
                  Zahid's Android phone linked to Family Group
                </span>
              </label>
            </div>
          )}
        </div>

        {/* STEP 3 */}
        <div className="rounded-2xl bg-white border border-[#e1ebd9] overflow-hidden transition-all shadow-xs">
          <button
            onClick={() => toggleAccordion('step3')}
            className="w-full p-3.5 sm:p-4 text-left flex items-center justify-between gap-3 hover:bg-[#fafcfa]"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-emerald-800 text-white text-xs font-bold flex items-center justify-center">
                3
              </span>
              <div>
                <h5 className="font-semibold text-xs sm:text-sm text-stone-900">
                  Configure Automated Bedtime Lock (Post-End Day)
                </h5>
                <p className="text-[11px] text-stone-500">
                  Lock all apps after {bedtimeBlock.startTime} automatically
                </p>
              </div>
            </div>
            {openAccordion === 'step3' ? (
              <ChevronUp className="w-4 h-4 text-stone-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-stone-400" />
            )}
          </button>

          {openAccordion === 'step3' && (
            <div className="px-4 pb-4 pt-1 border-t border-[#edf3ea] flex flex-col gap-3 text-xs text-stone-700">
              <p className="leading-relaxed">
                In the Family Link app on your iPhone:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                <li>
                  Tap on <strong>Zahid's profile</strong>.
                </li>
                <li>
                  Scroll to <strong>Bedtime</strong> (or <strong>Downtime</strong>) and tap <strong>Edit schedule</strong>.
                </li>
                <li>
                  Set <strong>Lock time</strong> to{' '}
                  <strong className="text-stone-900 font-semibold">{bedtimeBlock.startTime}</strong> and{' '}
                  <strong>Unlock time</strong> to{' '}
                  <strong className="text-stone-900 font-semibold">{bedtimeBlock.endTime}</strong>.
                </li>
                <li>
                  Under <strong>Always Allowed Apps</strong>, keep essential utilities:{' '}
                  <em>Phone (for emergency calls), Clock/Alarm, and Google Chrome</em> (so he can access this routine app).
                </li>
                <li>
                  All other apps (YouTube, Games, Social Media) will be completely inaccessible until morning.
                </li>
              </ol>

              <div className="p-2.5 bg-[#f5f8f3] rounded-xl border border-[#e1ece0] flex items-center justify-between text-xs">
                <span className="text-stone-600">Bedtime Lock Status:</span>
                <span className="font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md">
                  Active {bedtimeBlock.startTime} – {bedtimeBlock.endTime}
                </span>
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!checklist['step3']}
                  onChange={() => toggleChecklist('step3')}
                  className="w-4 h-4 text-emerald-800 rounded border-stone-300 focus:ring-emerald-600"
                />
                <span className="text-xs font-medium text-stone-800">
                  Bedtime downtime schedule configured in Family Link
                </span>
              </label>
            </div>
          )}
        </div>

        {/* STEP 4 */}
        <div className="rounded-2xl bg-white border border-[#e1ebd9] overflow-hidden transition-all shadow-xs">
          <button
            onClick={() => toggleAccordion('step4')}
            className="w-full p-3.5 sm:p-4 text-left flex items-center justify-between gap-3 hover:bg-[#fafcfa]"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-emerald-800 text-white text-xs font-bold flex items-center justify-center">
                4
              </span>
              <div>
                <h5 className="font-semibold text-xs sm:text-sm text-stone-900">
                  Set App Limits & Daily Screen Time
                </h5>
                <p className="text-[11px] text-stone-500">
                  Guarantee study focus and protect free screen time
                </p>
              </div>
            </div>
            {openAccordion === 'step4' ? (
              <ChevronUp className="w-4 h-4 text-stone-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-stone-400" />
            )}
          </button>

          {openAccordion === 'step4' && (
            <div className="px-4 pb-4 pt-1 border-t border-[#edf3ea] flex flex-col gap-3 text-xs text-stone-700">
              <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                <li>
                  In Family Link on your iPhone, go to <strong>App limits</strong>.
                </li>
                <li>
                  Set specific limits on entertainment apps (e.g., maximum 30–60 minutes per day for YouTube or games).
                </li>
                <li>
                  Set <strong>Daily Limit</strong> (e.g. 2 hours total entertainment).
                </li>
                <li>
                  During daytime study blocks, you can tap <strong className="text-emerald-950 font-semibold">"Lock now"</strong> from your iPhone to lock his Android device immediately if needed.
                </li>
              </ol>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!checklist['step4']}
                  onChange={() => toggleChecklist('step4')}
                  className="w-4 h-4 text-emerald-800 rounded border-stone-300 focus:ring-emerald-600"
                />
                <span className="text-xs font-medium text-stone-800">
                  App limits and daily allowances saved
                </span>
              </label>
            </div>
          )}
        </div>

        {/* STEP 5 */}
        <div className="rounded-2xl bg-white border border-[#e1ebd9] overflow-hidden transition-all shadow-xs">
          <button
            onClick={() => toggleAccordion('step5')}
            className="w-full p-3.5 sm:p-4 text-left flex items-center justify-between gap-3 hover:bg-[#fafcfa]"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-emerald-800 text-white text-xs font-bold flex items-center justify-center">
                5
              </span>
              <div>
                <h5 className="font-semibold text-xs sm:text-sm text-stone-900">
                  How to View Activity & Real-Time Screen Time on iOS
                </h5>
                <p className="text-[11px] text-stone-500">
                  Live reports and 1-tap remote lock from your iPhone
                </p>
              </div>
            </div>
            {openAccordion === 'step5' ? (
              <ChevronUp className="w-4 h-4 text-stone-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-stone-400" />
            )}
          </button>

          {openAccordion === 'step5' && (
            <div className="px-4 pb-4 pt-1 border-t border-[#edf3ea] flex flex-col gap-3 text-xs text-stone-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-3 bg-[#f5f8f3] rounded-xl border border-[#e1ece0]">
                  <h6 className="font-bold text-stone-900 mb-1 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-800" />
                    <span>Instant 1-Tap Lock</span>
                  </h6>
                  <p className="text-[11px] text-stone-600">
                    Open Family Link on iPhone &gt; Tap "Lock now" to instantly lock his Android screen without waiting for scheduled bedtime.
                  </p>
                </div>

                <div className="p-3 bg-[#f5f8f3] rounded-xl border border-[#e1ece0]">
                  <h6 className="font-bold text-stone-900 mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-800" />
                    <span>Per-App Usage Reports</span>
                  </h6>
                  <p className="text-[11px] text-stone-600">
                    View minute-by-minute breakdown of which apps were opened throughout the day and past bedtime.
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-[#edf5eb] rounded-xl border border-[#cbe0c6] flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                <p className="text-[11px] text-emerald-950 leading-relaxed">
                  <strong>Combined Strategy:</strong> Zahid uses this web app daily to build internal rhythm and agency by clicking "Start Day" and "End Day". Google Family Link acts as the quiet external guardrail that ensures phone downtime is respected.
                </p>
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!checklist['step5']}
                  onChange={() => toggleChecklist('step5')}
                  className="w-4 h-4 text-emerald-800 rounded border-stone-300 focus:ring-emerald-600"
                />
                <span className="text-xs font-medium text-stone-800">
                  Ready & monitored from iPhone
                </span>
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
