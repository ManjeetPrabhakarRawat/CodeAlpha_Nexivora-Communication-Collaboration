import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Video,
  Plus,
  Search,
  LogOut,
  Clock,
  Calendar,
  Users,
  Settings,
} from "lucide-react";

import { useAuthStore } from "../store/useAuthStore";
import { useMeetingStore } from "../store/useMeetingStore";

export default function Dashboard() {
  const [meetingCode, setMeetingCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState("");

  const { user, logout } = useAuthStore();

  const { createMeeting, recentMeetings, fetchRecentMeetings } =
    useMeetingStore();

  const navigate = useNavigate();

  useEffect(() => {
    fetchRecentMeetings();
  }, [fetchRecentMeetings]);

  /* --------------------------------
     Create meeting
  -------------------------------- */

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!meetingTitle.trim()) return;

    try {
      const meeting = await createMeeting(meetingTitle.trim());

      setMeetingTitle("");
      setIsCreating(false);

      navigate(`/meeting/${meeting.roomId}`);
    } catch (error) {
      console.error("Failed to create meeting:", error);
    }
  };

  /* --------------------------------
     Join meeting
  -------------------------------- */

  const handleJoinMeeting = (e: React.FormEvent) => {
    e.preventDefault();

    if (!meetingCode.trim()) return;

    let roomId = meetingCode.trim();

    /*
      If user pastes a full meeting URL,
      extract the room ID.
    */
    try {
      if (roomId.startsWith("http://") || roomId.startsWith("https://")) {
        const url = new URL(roomId);
        const parts = url.pathname.split("/").filter(Boolean);

        const meetingIndex = parts.indexOf("meeting");

        if (meetingIndex !== -1 && parts[meetingIndex + 1]) {
          roomId = parts[meetingIndex + 1];
        }
      }
    } catch {
      // Keep original value if it is not a valid URL.
    }

    navigate(`/meeting/${roomId}`);
  };

  /* --------------------------------
     Meeting status
  -------------------------------- */

  const canRejoin = (meeting: any) => {
    /*
      IMPORTANT:
      We only show Rejoin when the backend explicitly
      tells us that the meeting is active.

      This prevents every historical meeting from
      showing Rejoin forever.
    */

    return meeting?.status === "active" || meeting?.isActive === true;
  };

  /* --------------------------------
     Navigation
  -------------------------------- */

  const goTo = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-navy-900 flex text-white">
      {/* ==========================================
          SIDEBAR
      ========================================== */}

      <aside className="w-64 border-r border-white/10 hidden md:flex flex-col bg-navy-950">
        {/* Logo */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-10">
            <div className="bg-brand-600 p-2 rounded-lg">
              <img
                src="/nexivora.png"
                alt="Nexivora"
                className="w-5 h-5 object-contain"
              />
            </div>

            <span className="text-xl font-bold">Nexivora</span>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {/* Meetings */}
            <button
              type="button"
              onClick={() => goTo("/dashboard")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-brand-500/10 text-brand-400 font-medium transition-colors"
            >
              <Video className="w-5 h-5" />
              <span>Meetings</span>
            </button>

            {/* Calendar */}
            <button
              type="button"
              onClick={() => goTo("/calendar")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            >
              <Calendar className="w-5 h-5" />
              <span>Calendar</span>
            </button>

            {/* Contacts */}
            <button
              type="button"
              onClick={() => goTo("/contacts")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            >
              <Users className="w-5 h-5" />
              <span>Contacts</span>
            </button>

            {/* Settings */}
            <button
              type="button"
              onClick={() => goTo("/settings")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* User section */}
        <div className="mt-auto p-6 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center font-bold text-white uppercase border-2 border-navy-800">
              {user?.name?.charAt(0) || "U"}
            </div>

            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">
                {user?.name || "User"}
              </p>

              <p className="text-xs text-gray-400 truncate">
                {user?.email || ""}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ==========================================
          MAIN CONTENT
      ========================================== */}

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-white/10 bg-navy-950">
          <div className="flex items-center gap-2">
            <img
              src="/nexivora.png"
              alt="Nexivora"
              className="w-6 h-6 object-contain"
            />

            <span className="text-xl font-bold">Nexivora</span>
          </div>

          <button
            type="button"
            onClick={logout}
            className="p-2 text-gray-400 hover:text-white"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10 pb-24 md:pb-10">
          <div className="max-w-5xl mx-auto">
            {/* Welcome */}
            <header className="mb-10">
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user?.name?.split(" ")[0] || "User"}
              </h1>

              <p className="text-gray-400">
                Connect, collaborate, and create with your team.
              </p>
            </header>

            {/* =====================================
                MEETING CARDS
            ===================================== */}

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {/* Create meeting */}
              <div className="glass-panel p-6">
                <div className="bg-brand-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Video className="w-6 h-6 text-brand-400" />
                </div>

                <h2 className="text-xl font-bold mb-2">New Meeting</h2>

                <p className="text-gray-400 text-sm mb-6">
                  Create a new meeting and invite your team instantly.
                </p>

                {isCreating ? (
                  <form onSubmit={handleCreateMeeting} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Meeting Title"
                      value={meetingTitle}
                      onChange={(e) => setMeetingTitle(e.target.value)}
                      className="flex-1 bg-navy-950 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      autoFocus
                    />

                    <button
                      type="submit"
                      disabled={!meetingTitle.trim()}
                      className="bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Start
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsCreating(false);
                        setMeetingTitle("");
                      }}
                      className="bg-navy-700 hover:bg-navy-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsCreating(true)}
                    className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white py-3 rounded-lg font-medium transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Create Meeting
                  </button>
                )}
              </div>

              {/* Join meeting */}
              <div className="glass-panel p-6">
                <div className="bg-emerald-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-emerald-400" />
                </div>

                <h2 className="text-xl font-bold mb-2">Join Meeting</h2>

                <p className="text-gray-400 text-sm mb-6">
                  Enter a room ID or link to join an existing meeting.
                </p>

                <form onSubmit={handleJoinMeeting} className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-500" />
                    </div>

                    <input
                      type="text"
                      placeholder="Room ID or Link"
                      value={meetingCode}
                      onChange={(e) => setMeetingCode(e.target.value)}
                      className="w-full bg-navy-950 border border-white/10 rounded-lg pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!meetingCode.trim()}
                    className="bg-navy-700 hover:bg-navy-600 disabled:opacity-50 disabled:hover:bg-navy-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Join
                  </button>
                </form>
              </div>
            </div>

            {/* =====================================
                RECENT MEETINGS
            ===================================== */}

            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" />
                Recent Meetings
              </h2>

              {recentMeetings.length === 0 ? (
                <div className="glass-panel p-10 text-center flex flex-col items-center justify-center">
                  <Calendar className="w-12 h-12 text-gray-600 mb-4" />

                  <h3 className="text-lg font-medium text-gray-300">
                    No recent meetings
                  </h3>

                  <p className="text-gray-500 text-sm mt-1">
                    Your meeting history will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {recentMeetings.map((meeting: any) => {
                    const active = canRejoin(meeting);

                    return (
                      <div
                        key={meeting._id || meeting.roomId}
                        className={`glass-panel p-4 flex items-center justify-between transition-colors ${
                          active ? "hover:bg-navy-800/80" : ""
                        }`}
                      >
                        {/* Meeting information */}
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              active ? "bg-brand-500/20" : "bg-navy-700"
                            }`}
                          >
                            <Video
                              className={`w-5 h-5 ${
                                active ? "text-brand-400" : "text-gray-400"
                              }`}
                            />
                          </div>

                          <div>
                            <h4 className="font-medium">
                              {meeting.title || "Untitled Meeting"}
                            </h4>

                            <p className="text-xs text-gray-400 mt-0.5">
                              {meeting.createdAt
                                ? new Date(
                                    meeting.createdAt,
                                  ).toLocaleDateString()
                                : "Unknown date"}{" "}
                              • Room ID: {meeting.roomId}
                            </p>
                          </div>
                        </div>

                        {/* Meeting status / action */}
                        <div>
                          {active ? (
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/meeting/${meeting.roomId}`)
                              }
                              className="text-brand-400 hover:text-brand-300 text-sm font-medium px-3 py-2 rounded-lg hover:bg-brand-500/10 transition-colors"
                            >
                              Rejoin
                            </button>
                          ) : (
                            <span className="text-gray-500 text-sm">Ended</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          {/* Mobile Navigation */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#080d1a] border-t border-white/10">
            <div className="grid grid-cols-4 h-16">
              <button
                type="button"
                onClick={() => goTo("/dashboard")}
                className="flex flex-col items-center justify-center gap-1 text-brand-400"
              >
                <Video className="w-5 h-5" />
                <span className="text-[11px]">Meetings</span>
              </button>

              <button
                type="button"
                onClick={() => goTo("/calendar")}
                className="flex flex-col items-center justify-center gap-1 text-gray-400"
              >
                <Calendar className="w-5 h-5" />
                <span className="text-[11px]">Calendar</span>
              </button>

              <button
                type="button"
                onClick={() => goTo("/contacts")}
                className="flex flex-col items-center justify-center gap-1 text-gray-400"
              >
                <Users className="w-5 h-5" />
                <span className="text-[11px]">Contacts</span>
              </button>

              <button
                type="button"
                onClick={() => goTo("/settings")}
                className="flex flex-col items-center justify-center gap-1 text-gray-400"
              >
                <Settings className="w-5 h-5" />
                <span className="text-[11px]">Settings</span>
              </button>
            </div>
          </nav>
        </div>
      </main>
    </div>
  );
}
