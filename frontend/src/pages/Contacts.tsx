import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  UserPlus,
  Search,
  Users,
  Video,
  X,
  Mail,
  Trash2,
  UserRound,
} from "lucide-react";

import { useAuthStore } from "../store/useAuthStore";

interface Contact {
  id: string;
  name: string;
  email: string;
  status: "online" | "offline";
}

export default function Contacts() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("nexivora_contacts");

    if (saved) {
      try {
        setContacts(JSON.parse(saved));
      } catch {
        setContacts([]);
      }
    }
  }, []);

  const saveContacts = (updated: Contact[]) => {
    setContacts(updated);
    localStorage.setItem("nexivora_contacts", JSON.stringify(updated));
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) return;

    const newContact: Contact = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email.trim(),
      status: "offline",
    };

    saveContacts([...contacts, newContact]);

    setName("");
    setEmail("");
    setShowModal(false);
  };

  const removeContact = (id: string) => {
    saveContacts(contacts.filter((contact) => contact.id !== id));
  };

  const filteredContacts = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return contacts;

    return contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(query) ||
        contact.email.toLowerCase().includes(query),
    );
  }, [contacts, search]);

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
                <h1 className="truncate text-2xl font-bold">Contacts</h1>

                <p className="mt-1 text-sm text-gray-400">
                  Connect with your team
                </p>
              </div>
            </div>

            {/* Add Contact */}
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 py-3 font-semibold text-white transition hover:bg-brand-500 sm:w-auto"
            >
              <UserPlus className="h-5 w-5" />
              Add Contact
            </button>
          </div>
        </div>
      </header>

      {/* ================= MAIN ================= */}
      <main className="w-full px-5 py-7 sm:px-6 lg:px-10 lg:py-10">
        <div className="w-full space-y-8">
          {/* ================= SEARCH ================= */}
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts by name or email..."
              className="w-full rounded-xl border border-white/10 bg-navy-950 px-4 py-4 pl-12 text-white outline-none transition placeholder:text-gray-600 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {/* ================= YOUR ACCOUNT ================= */}
          <section className="w-full">
            <div className="mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                Your Account
              </h2>
            </div>

            <div className="w-full rounded-2xl border border-white/10 bg-navy-800/70 p-5 shadow-lg sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                {/* User */}
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xl font-bold uppercase shadow-lg shadow-brand-600/20">
                    {user?.name?.charAt(0) || "U"}
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold">
                      {user?.name || "User"}
                    </h3>

                    <p className="mt-1 truncate text-sm text-gray-400">
                      {user?.email || "No email"}
                    </p>
                  </div>
                </div>

                {/* Online */}
                <div className="flex w-fit items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                  Online
                </div>
              </div>
            </div>
          </section>

          {/* ================= CONTACTS ================= */}
          <section className="w-full">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-bold">Your Contacts</h2>

                <p className="mt-1 text-sm text-gray-400">
                  People you collaborate with
                </p>
              </div>

              <span className="w-fit rounded-full bg-white/5 px-3 py-1 text-sm text-gray-400">
                {filteredContacts.length} contact
                {filteredContacts.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Empty */}
            {filteredContacts.length === 0 ? (
              <div className="flex min-h-[420px] w-full flex-col items-center justify-center rounded-2xl border border-white/10 bg-navy-800/70 p-8 text-center shadow-lg">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-700">
                  {search ? (
                    <Search className="h-8 w-8 text-gray-400" />
                  ) : (
                    <Users className="h-8 w-8 text-gray-400" />
                  )}
                </div>

                <h3 className="text-xl font-semibold text-gray-200">
                  {search ? "No contacts found" : "No contacts yet"}
                </h3>

                <p className="mt-2 max-w-lg text-sm leading-6 text-gray-400">
                  {search
                    ? "Try searching with a different name or email."
                    : "Add teammates and collaborators to quickly start meetings with them."}
                </p>
              </div>
            ) : (
              /* ================= CONTACT GRID ================= */
              <div className="grid w-full grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="w-full rounded-2xl border border-white/10 bg-navy-800/70 p-5 shadow-lg transition hover:border-brand-500/30 hover:bg-navy-800"
                  >
                    {/* Contact Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {/* Avatar */}
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-lg font-bold uppercase text-brand-400">
                          {contact.name.charAt(0)}
                        </div>

                        {/* Details */}
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-white">
                            {contact.name}
                          </h3>

                          <div className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-gray-400">
                            <Mail className="h-3.5 w-3.5 shrink-0" />

                            <span className="truncate">{contact.email}</span>
                          </div>
                        </div>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => removeContact(contact.id)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-red-500/10 hover:text-red-400"
                        title="Remove contact"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Status */}
                    <div className="mt-5 flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          contact.status === "online"
                            ? "bg-emerald-400 shadow-sm shadow-emerald-400/50"
                            : "bg-gray-500"
                        }`}
                      />

                      <span className="text-sm capitalize text-gray-400">
                        {contact.status}
                      </span>
                    </div>

                    {/* Start Meeting */}
                    <button
                      onClick={() => navigate("/dashboard")}
                      className="mt-5 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-navy-700 px-4 py-2.5 font-medium transition hover:bg-brand-600"
                    >
                      <Video className="h-4 w-4" />
                      Start Meeting
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* ================= ADD CONTACT MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
          <div className="my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-navy-900 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 p-5 sm:p-6">
              <div>
                <h2 className="text-xl font-bold">Add Contact</h2>

                <p className="mt-1 text-sm text-gray-400">
                  Add a teammate or collaborator
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
            <form onSubmit={handleAddContact} className="space-y-5 p-5 sm:p-6">
              {/* Name */}
              <div>
                <label className="mb-2 block text-sm font-medium">Name</label>

                <div className="relative">
                  <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />

                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                    autoFocus
                    className="w-full rounded-lg border border-white/10 bg-navy-950 px-4 py-3 pl-10 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium">Email</label>

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    required
                    className="w-full rounded-lg border border-white/10 bg-navy-950 px-4 py-3 pl-10 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
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
                  className="flex-1 rounded-lg bg-brand-600 px-4 py-3 font-semibold transition hover:bg-brand-500"
                >
                  Add Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
