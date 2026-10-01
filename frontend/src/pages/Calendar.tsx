import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Video,
  X,
  Copy,
  CheckCircle2,
  CalendarDays,
} from "lucide-react";

import { useMeetingStore } from "../store/useMeetingStore";

interface ScheduledMeeting {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  roomId: string;
}

export default function Calendar() {
  const navigate = useNavigate();
  const { createMeeting } = useMeetingStore();

  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("30");
  const [meetings, setMeetings] = useState<ScheduledMeeting[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("nexivora_scheduled_meetings");

    if (saved) {
      try {
        setMeetings(JSON.parse(saved));
      } catch {
        setMeetings([]);
      }
    }
  }, []);

  const saveMeetings = (updated: ScheduledMeeting[]) => {
    setMeetings(updated);

    localStorage.setItem(
      "nexivora_scheduled_meetings",
      JSON.stringify(updated),
    );
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !date || !time) return;

    try {
      setIsCreating(true);

      const meeting = await createMeeting(title.trim());

      const newMeeting: ScheduledMeeting = {
        id: crypto.randomUUID(),
        title: title.trim(),
        date,
        time,
        duration,
        roomId: meeting.roomId,
      };

      saveMeetings([...meetings, newMeeting]);

      setTitle("");
      setDate("");
      setTime("");
      setDuration("30");
      setShowModal(false);
    } catch (error) {
      console.error("Failed to schedule meeting:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteMeeting = (id: string) => {
    const updated = meetings.filter((meeting) => meeting.id !== id);
    saveMeetings(updated);
  };

  const copyMeetingLink = async (roomId: string, id: string) => {
    const link = `${window.location.origin}/meeting/${roomId}`;

    try {
      await navigator.clipboard.writeText(link);

      setCopiedId(id);

      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy meeting link:", error);
    }
  };

  const today = new Date();

  const formattedToday = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen w-full bg-navy-900 text-white">
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-30 w-full border-b border-white/10 bg-navy-950/95 backdrop-blur-md">
        <div className="w-full px-5 py-5 sm:px-6 lg:px-10">
          <div className="flex w-full flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            {/* Left */}
            <div className="flex min-w-0 items-center gap-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-white/5 hover:text-white"
                title="Back to dashboard"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold">Calendar</h1>

                <p className="mt-1 text-sm text-gray-400">
                  Manage your meetings and schedule
                </p>
              </div>
            </div>

            {/* New Meeting */}
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 py-3 font-semibold text-white transition hover:bg-brand-500 sm:w-auto"
            >
              <Plus className="h-5 w-5" />
              New Meeting
            </button>
          </div>
        </div>
      </header>

      {/* ================= MAIN ================= */}
      <main className="w-full px-5 py-7 sm:px-6 lg:px-10 lg:py-10">
        <div className="w-full">
          {/* ================= TODAY ================= */}
          <section className="mb-8 w-full rounded-2xl border border-white/10 bg-navy-800/70 p-5 shadow-lg sm:p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-500/20">
                <CalendarIcon className="h-7 w-7 text-brand-400" />
              </div>

              <div className="min-w-0">
                <p className="text-sm text-gray-400">Today</p>

                <h2 className="mt-1 truncate text-lg font-bold sm:text-xl">
                  {formattedToday}
                </h2>
              </div>
            </div>
          </section>

          {/* ================= UPCOMING ================= */}
          <section className="w-full">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-bold">Upcoming Meetings</h2>

                <p className="mt-1 text-sm text-gray-400">
                  Your scheduled meetings
                </p>
              </div>

              <span className="w-fit rounded-full bg-white/5 px-3 py-1 text-sm text-gray-400">
                {meetings.length} meeting
                {meetings.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Empty */}
            {meetings.length === 0 ? (
              <div className="flex min-h-[420px] w-full flex-col items-center justify-center rounded-2xl border border-white/10 bg-navy-800/70 p-8 text-center shadow-lg">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-700">
                  <CalendarDays className="h-8 w-8 text-gray-400" />
                </div>

                <h3 className="text-xl font-semibold text-gray-200">
                  No scheduled meetings
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-gray-400">
                  Your upcoming meetings will appear here when you schedule
                  them.
                </p>
              </div>
            ) : (
              /* IMPORTANT:
                 Full-width grid instead of narrow centered container
              */
              <div className="grid w-full grid-cols-1 gap-5 xl:grid-cols-2">
                {meetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="w-full rounded-2xl border border-white/10 bg-navy-800/70 p-5 shadow-lg transition hover:border-brand-500/30 hover:bg-navy-800"
                  >
                    {/* Meeting Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-500/15">
                          <Video className="h-6 w-6 text-brand-400" />
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-semibold">
                            {meeting.title}
                          </h3>

                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-400">
                            <span className="flex items-center gap-1.5">
                              <CalendarIcon className="h-4 w-4 shrink-0" />

                              {new Date(
                                `${meeting.date}T00:00:00`,
                              ).toLocaleDateString()}
                            </span>

                            <span className="flex items-center gap-1.5">
                              <Clock className="h-4 w-4 shrink-0" />

                              {meeting.time}
                            </span>

                            <span>{meeting.duration} min</span>
                          </div>
                        </div>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteMeeting(meeting.id)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-red-500/10 hover:text-red-400"
                        title="Remove meeting"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Room ID */}
                    <div className="mt-5 rounded-lg border border-white/5 bg-navy-950 p-3">
                      <p className="mb-1 text-xs text-gray-500">Room ID</p>

                      <p className="break-all text-sm text-gray-300">
                        {meeting.roomId}
                      </p>
                    </div>

                    {/* Buttons */}
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <button
                        onClick={() => navigate(`/meeting/${meeting.roomId}`)}
                        className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 font-medium transition hover:bg-brand-500"
                      >
                        <Video className="h-4 w-4" />
                        Join Meeting
                      </button>

                      <button
                        onClick={() =>
                          copyMeetingLink(meeting.roomId, meeting.id)
                        }
                        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-navy-700 px-4 py-2.5 font-medium transition hover:bg-navy-600"
                      >
                        {copiedId === meeting.id ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy Link
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* ================= CREATE MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
          <div className="my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-navy-900 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 p-5 sm:p-6">
              <div>
                <h2 className="text-xl font-bold">Schedule Meeting</h2>

                <p className="mt-1 text-sm text-gray-400">
                  Create a meeting for your team
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-white/5 hover:text-white"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleCreateMeeting}
              className="space-y-5 p-5 sm:p-6"
            >
              {/* Title */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Meeting title
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Team Standup"
                  required
                  autoFocus
                  className="w-full rounded-lg border border-white/10 bg-navy-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">Date</label>

                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full rounded-lg border border-white/10 bg-navy-950 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Time</label>

                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className="w-full rounded-lg border border-white/10 bg-navy-950 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Duration
                </label>

                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-navy-950 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value="15">15 minutes</option>

                  <option value="30">30 minutes</option>

                  <option value="45">45 minutes</option>

                  <option value="60">1 hour</option>

                  <option value="90">1.5 hours</option>

                  <option value="120">2 hours</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg bg-navy-700 px-4 py-3 font-medium transition hover:bg-navy-600"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isCreating || !title.trim() || !date || !time}
                  className="flex-1 rounded-lg bg-brand-600 px-4 py-3 font-semibold transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCreating ? "Creating..." : "Schedule Meeting"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
