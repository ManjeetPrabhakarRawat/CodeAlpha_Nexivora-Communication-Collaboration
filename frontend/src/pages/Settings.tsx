import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Bell,
  Video,
  Shield,
  Check,
  Save,
  Mail,
  Camera,
  Mic,
  Settings as SettingsIcon,
  Monitor,
  CheckCircle2,
} from 'lucide-react';

import { useAuthStore } from '../store/useAuthStore';

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [notifications, setNotifications] = useState(true);
  const [camera, setCamera] = useState(true);
  const [microphone, setMicrophone] = useState(true);
  const [saved, setSaved] = useState(false);

  /* Load saved preferences */
  useEffect(() => {
    const savedPreferences = localStorage.getItem(
      'nexivora_preferences'
    );

    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences);

        if (typeof preferences.notifications === 'boolean') {
          setNotifications(preferences.notifications);
        }

        if (typeof preferences.camera === 'boolean') {
          setCamera(preferences.camera);
        }

        if (typeof preferences.microphone === 'boolean') {
          setMicrophone(preferences.microphone);
        }
      } catch {
        console.error('Failed to load Nexivora preferences');
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(
      'nexivora_preferences',
      JSON.stringify({
        notifications,
        camera,
        microphone,
      })
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen w-full bg-navy-900 text-white">
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-30 w-full border-b border-white/10 bg-navy-950/95 backdrop-blur-md">
        <div className="w-full px-5 py-5 sm:px-6 lg:px-10">
          <div className="flex w-full items-center gap-4">
            {/* Back */}
            <button
              onClick={() => navigate('/dashboard')}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-white/5 hover:text-white"
              aria-label="Back to dashboard"
              title="Back to dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            {/* Title */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <SettingsIcon className="hidden h-5 w-5 text-brand-400 sm:block" />

                <h1 className="truncate text-2xl font-bold">
                  Settings
                </h1>
              </div>

              <p className="mt-1 text-sm text-gray-400">
                Manage your Nexivora preferences
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ================= MAIN ================= */}
      <main className="w-full px-5 py-7 sm:px-6 lg:px-10 lg:py-10">
        <div className="w-full space-y-6">
          {/* ================= PROFILE ================= */}
          <section className="w-full rounded-2xl border border-white/10 bg-navy-800/70 p-5 shadow-lg sm:p-6">
            <SectionHeader
              icon={<User className="h-5 w-5 text-brand-400" />}
              title="Profile"
              description="Your account information"
            />

            <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
              {/* Name */}
              <div className="min-w-0">
                <label className="mb-2 block text-sm font-medium text-gray-400">
                  Name
                </label>

                <div className="flex min-h-[50px] items-center gap-3 rounded-lg border border-white/10 bg-navy-950 px-4">
                  <User className="h-4 w-4 shrink-0 text-gray-500" />

                  <span className="truncate text-sm text-gray-200">
                    {user?.name || 'User'}
                  </span>
                </div>
              </div>

              {/* Email */}
              <div className="min-w-0">
                <label className="mb-2 block text-sm font-medium text-gray-400">
                  Email
                </label>

                <div className="flex min-h-[50px] items-center gap-3 rounded-lg border border-white/10 bg-navy-950 px-4">
                  <Mail className="h-4 w-4 shrink-0 text-gray-500" />

                  <span className="truncate text-sm text-gray-200">
                    {user?.email || 'No email'}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ================= NOTIFICATIONS ================= */}
          <section className="w-full rounded-2xl border border-white/10 bg-navy-800/70 p-5 shadow-lg sm:p-6">
            <SectionHeader
              icon={<Bell className="h-5 w-5 text-brand-400" />}
              title="Notifications"
              description="Control meeting notifications"
            />

            <PreferenceRow
              icon={<Bell className="h-4 w-4" />}
              title="Meeting notifications"
              description="Receive notifications for upcoming meetings and invitations."
              enabled={notifications}
              onToggle={() =>
                setNotifications(!notifications)
              }
            />
          </section>

          {/* ================= MEETING PREFERENCES ================= */}
          <section className="w-full rounded-2xl border border-white/10 bg-navy-800/70 p-5 shadow-lg sm:p-6">
            <SectionHeader
              icon={<Video className="h-5 w-5 text-brand-400" />}
              title="Meeting Preferences"
              description="Configure your default meeting devices"
            />

            <div className="space-y-1">
              <PreferenceRow
                icon={<Camera className="h-4 w-4" />}
                title="Camera enabled"
                description="Start meetings with your camera enabled."
                enabled={camera}
                onToggle={() => setCamera(!camera)}
              />

              <PreferenceRow
                icon={<Mic className="h-4 w-4" />}
                title="Microphone enabled"
                description="Start meetings with your microphone enabled."
                enabled={microphone}
                onToggle={() =>
                  setMicrophone(!microphone)
                }
              />
            </div>
          </section>

          {/* ================= DEVICE STATUS ================= */}
          <section className="w-full rounded-2xl border border-white/10 bg-navy-800/70 p-5 shadow-lg sm:p-6">
            <SectionHeader
              icon={<Monitor className="h-5 w-5 text-brand-400" />}
              title="Device Preferences"
              description="Default device configuration for meetings"
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Camera */}
              <div className="rounded-xl border border-white/10 bg-navy-950 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
                    <Camera className="h-5 w-5 text-gray-300" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      Camera
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Default meeting state
                    </p>
                  </div>

                  <div className="ml-auto">
                    {camera ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Enabled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-500/10 px-2.5 py-1 text-xs font-medium text-gray-400">
                        Disabled
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Microphone */}
              <div className="rounded-xl border border-white/10 bg-navy-950 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
                    <Mic className="h-5 w-5 text-gray-300" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      Microphone
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Default meeting state
                    </p>
                  </div>

                  <div className="ml-auto">
                    {microphone ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Enabled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-500/10 px-2.5 py-1 text-xs font-medium text-gray-400">
                        Disabled
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ================= SECURITY ================= */}
          <section className="w-full rounded-2xl border border-white/10 bg-navy-800/70 p-5 shadow-lg sm:p-6">
            <SectionHeader
              icon={<Shield className="h-5 w-5 text-brand-400" />}
              title="Security"
              description="Account and meeting security"
            />

            <div className="flex items-start gap-3 rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                <Shield className="h-4 w-4 text-emerald-400" />
              </div>

              <div>
                <p className="text-sm font-medium text-gray-200">
                  Account protected
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Your account is protected by Nexivora
                  authentication and secure session handling.
                </p>
              </div>
            </div>
          </section>

          {/* ================= SAVE ================= */}
          <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full rounded-lg bg-navy-700 px-5 py-3 text-sm font-medium transition hover:bg-navy-600 sm:w-auto"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition sm:w-auto ${
                saved
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-brand-600 hover:bg-brand-500'
              }`}
            >
              {saved ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Preferences Saved
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Preferences
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

/* =========================================================
   SECTION HEADER
========================================================= */

type SectionHeaderProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

function SectionHeader({
  icon,
  title,
  description,
}: SectionHeaderProps) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500/20">
        {icon}
      </div>

      <div className="min-w-0">
        <h2 className="font-semibold text-white">
          {title}
        </h2>

        <p className="mt-0.5 text-xs text-gray-400">
          {description}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   PREFERENCE ROW
========================================================= */

type PreferenceRowProps = {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  icon?: React.ReactNode;
};

function PreferenceRow({
  title,
  description,
  enabled,
  onToggle,
  icon,
}: PreferenceRowProps) {
  return (
    <div className="flex items-center justify-between gap-5 rounded-xl border border-transparent px-2 py-4 transition hover:border-white/5 hover:bg-white/[0.02]">
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-gray-400">
            {icon}
          </div>
        )}

        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-200">
            {title}
          </p>

          <p className="mt-1 text-xs leading-5 text-gray-500">
            {description}
          </p>
        </div>
      </div>

      {/* Toggle */}
      <button
        type="button"
        onClick={onToggle}
        aria-label={`Toggle ${title}`}
        aria-pressed={enabled}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${
          enabled ? 'bg-brand-600' : 'bg-gray-700'
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-md transition-all duration-200 ${
            enabled ? 'left-6' : 'left-1'
          }`}
        />
      </button>
    </div>
  );
}