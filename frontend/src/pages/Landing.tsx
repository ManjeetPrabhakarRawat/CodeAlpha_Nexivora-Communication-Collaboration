import { Link } from "react-router-dom";
import { Video, Shield, Users, Layers, ArrowRight } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-navy-900 text-white selection:bg-brand-500/30">
      {/* Navbar */}
      <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-brand-600 p-2 rounded-lg">
            <img
              src="/nexivora.png"
              alt="Nexivora"
              className="w-6 h-6 object-contain"
            />
          </div>
          <span className="text-xl font-bold tracking-tight">Nexivora</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="text-sm font-medium hover:text-brand-500 transition-colors"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-500 text-sm font-medium mb-8 border border-brand-500/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
          </span>
          Nexivora 1.0 is now live
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl">
          Connect. Collaborate.{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-cyan-400">
            Create.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl leading-relaxed">
          The all-in-one virtual communication platform designed for modern
          teams. High-quality video, real-time whiteboarding, and secure
          messaging in one seamless experience.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <Link
            to="/register"
            className="w-full sm:w-auto bg-brand-600 hover:bg-brand-500 text-white px-8 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-500/25"
          >
            Start for free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Mockup */}
        <div className="mt-20 w-full max-w-5xl relative">
          <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-transparent to-transparent z-10"></div>
          <div className="glass-panel p-2 rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand-500/10 to-transparent"></div>
            <div className="bg-navy-950 rounded-xl aspect-video flex items-center justify-center relative overflow-hidden border border-white/5">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full h-full p-4">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-navy-800 rounded-lg border border-white/5 flex items-center justify-center relative overflow-hidden"
                  >
                    <div className="w-16 h-16 rounded-full bg-navy-700 flex items-center justify-center border-2 border-navy-600">
                      <Users className="w-6 h-6 text-gray-500" />
                    </div>
                    <div className="absolute bottom-2 left-2 bg-navy-900/80 px-2 py-1 rounded text-xs">
                      User {i + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features */}
      <section className="border-t border-white/5 bg-navy-900/50 py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Everything you need to collaborate
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Stop switching between apps. Nexivora brings your team's
              communication tools into a single, beautiful workspace.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-panel p-8">
              <div className="bg-brand-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <Video className="w-6 h-6 text-brand-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">HD Video Conferencing</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Crystal clear video calls with low latency. Share your screen,
                chat in real-time, and manage participants effortlessly.
              </p>
            </div>

            <div className="glass-panel p-8">
              <div className="bg-purple-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <Layers className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Interactive Whiteboard</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Brainstorm together with a real-time collaborative canvas. Draw,
                type, and map out ideas with your team instantly.
              </p>
            </div>

            <div className="glass-panel p-8">
              <div className="bg-emerald-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Secure & Private</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Your data is yours. End-to-end encrypted WebRTC connections
                ensure your meetings and files remain completely private.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-navy-950 py-10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-brand-600 p-2 rounded-lg">
                  <img
                    src="/nexivora.png"
                    alt="Nexivora"
                    className="w-5 h-5 object-contain"
                  />
                </div>
                <span className="text-xl font-bold tracking-tight">
                  Nexivora
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-6 max-w-sm leading-relaxed">
                Connect. Collaborate. Create. The all-in-one virtual
                communication platform designed for modern teams, remote
                workers, and creative groups.
              </p>
              <div className="flex gap-4">
                <a
                  href="https://github.com/ManjeetPrabhakarRawat"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="GitHub"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
                <a
                  href="https://linkedin.com/in/manjeet-prabhakar-rawat-548341351/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="LinkedIn"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-6">Product</h3>
              <ul className="space-y-4">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-brand-400 text-sm transition-colors"
                  >
                    Video Meetings
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-brand-400 text-sm transition-colors"
                  >
                    Screen Sharing
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-brand-400 text-sm transition-colors"
                  >
                    Whiteboard
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-brand-400 text-sm transition-colors"
                  >
                    File Sharing
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-brand-400 text-sm transition-colors"
                  >
                    Real-Time Chat
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-6">Explore</h3>
              <ul className="space-y-4">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-brand-400 text-sm transition-colors"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-brand-400 text-sm transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-brand-400 text-sm transition-colors"
                  >
                    Security
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-brand-400 text-sm transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-6">Resources</h3>
              <ul className="space-y-4">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-brand-400 text-sm transition-colors"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-brand-400 text-sm transition-colors"
                  >
                    Help Center
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-brand-400 text-sm transition-colors"
                  >
                    Privacy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-brand-400 text-sm transition-colors"
                  >
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between text-gray-500 text-sm">
            <p>© 2026 Nexivora. All rights reserved.</p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <span className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                All systems operational
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
