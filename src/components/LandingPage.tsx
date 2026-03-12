import { useState, useEffect, useRef } from 'react';

const YAML_LINES = [
  'version: "3.8"',
  'services:',
  '  nginx:',
  '    image: nginx:alpine',
  '    ports:',
  '      - 80:80',
  '    depends_on:',
  '      - api',
  '  api:',
  '    image: node:20-alpine',
  '    ports:',
  '      - 3000:3000',
  '    depends_on:',
  '      - postgres',
  '      - redis',
  '  postgres:',
  '    image: postgres:16-alpine',
  '    environment:',
  '      POSTGRES_DB: app',
  '  redis:',
  '    image: redis:7-alpine',
];

function TypingYaml() {
  const [visibleLines, setVisibleLines] = useState(0);
  const containerRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (visibleLines < YAML_LINES.length) {
      const timeout = setTimeout(
        () => setVisibleLines((v) => v + 1),
        120 + Math.random() * 80,
      );
      return () => clearTimeout(timeout);
    }
  }, [visibleLines]);

  return (
    <pre
      ref={containerRef}
      className="font-mono text-[13px] leading-relaxed"
    >
      {YAML_LINES.slice(0, visibleLines).map((line, i) => {
        const isKey = line.includes(':') && !line.trimStart().startsWith('-');
        const indent = line.length - line.trimStart().length;
        const trimmed = line.trimStart();

        let content;
        if (trimmed.startsWith('-')) {
          const val = trimmed.slice(2);
          content = (
            <>
              <span style={{ paddingLeft: indent * 8 }} className="text-slate-500">- </span>
              <span className="text-amber-400">{val}</span>
            </>
          );
        } else if (isKey) {
          const [key, ...rest] = trimmed.split(':');
          const val = rest.join(':').trim();
          content = (
            <>
              <span style={{ paddingLeft: indent * 8 }} className="text-blue-400">{key}</span>
              <span className="text-slate-500">:</span>
              {val && <span className="text-emerald-400"> {val}</span>}
            </>
          );
        } else {
          content = <span className="text-slate-400">{line}</span>;
        }

        return (
          <div
            key={i}
            className="animate-fadeSlideIn"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            {content}
          </div>
        );
      })}
      {visibleLines < YAML_LINES.length && (
        <span className="inline-block h-4 w-2 animate-pulse bg-blue-400" />
      )}
    </pre>
  );
}

const FEATURES = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="8" height="8" rx="1" />
        <rect x="14" y="6" width="8" height="8" rx="1" />
        <rect x="8" y="14" width="8" height="8" rx="1" />
        <path d="M10 10h4" />
        <path d="M12 14v-4" />
      </svg>
    ),
    title: 'Drag & Drop',
    desc: 'Preset services onto a visual canvas. Nginx, Postgres, Redis, Node — or fully custom.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    title: 'Real-time YAML',
    desc: 'Every change reflects instantly. Copy to clipboard or download the file — zero delay.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
    title: 'Smart Dependencies',
    desc: 'Draw connections between services — depends_on and shared networks are handled automatically.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    title: 'Fully Private',
    desc: 'No backend. No accounts. No telemetry. Your data never leaves the browser.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
    title: 'Import Existing',
    desc: 'Paste any docker-compose.yml to visualize, understand, and edit it on the canvas.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
    title: 'Validation',
    desc: 'Real-time warnings for missing images, port conflicts, and misconfigured services.',
  },
];

interface LandingPageProps {
  onEnter: () => void;
}

export function LandingPage({ onEnter }: LandingPageProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0e1a]">
      {/* Background grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Gradient orbs */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-blue-600/[0.07] blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 top-1/3 h-[400px] w-[400px] rounded-full bg-indigo-500/[0.05] blur-[100px]" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12">
        <div className="flex items-center gap-2.5">
          <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
            <rect x="8" y="16" width="48" height="36" rx="4" fill="#2563eb" />
            <rect x="14" y="22" width="10" height="8" rx="1.5" fill="#93c5fd" />
            <rect x="27" y="22" width="10" height="8" rx="1.5" fill="#93c5fd" />
            <rect x="40" y="22" width="10" height="8" rx="1.5" fill="#93c5fd" />
            <rect x="14" y="34" width="10" height="8" rx="1.5" fill="#60a5fa" />
            <rect x="27" y="34" width="10" height="8" rx="1.5" fill="#60a5fa" />
            <rect x="40" y="34" width="10" height="8" rx="1.5" fill="#60a5fa" />
          </svg>
          <span className="text-lg font-bold tracking-tight text-white">VCompose</span>
        </div>
        <a
          href="https://github.com/zbrave/vcompose"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-800/40 px-4 py-2 text-sm text-slate-300 backdrop-blur-sm transition-all hover:border-slate-600 hover:bg-slate-700/50 hover:text-white"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          Star on GitHub
        </a>
      </nav>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-12 md:px-12 md:pt-20">
        <div
          className={`transition-all duration-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
        >
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/[0.08] px-4 py-1.5 text-sm text-blue-400">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
            Free & Open Source
          </div>

          <h1
            className="max-w-3xl text-5xl font-extrabold leading-[1.1] tracking-tight text-white md:text-7xl"
            style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace" }}
          >
            Docker Compose,{' '}
            <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-400 bg-clip-text text-transparent">
              visually.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-400 md:text-xl">
            Drag services. Draw connections. Get a production-ready{' '}
            <code className="rounded bg-slate-800/80 px-1.5 py-0.5 text-[0.9em] text-blue-300">
              docker-compose.yml
            </code>{' '}
            in seconds — right in your browser.
          </p>

          <div className="mt-10 flex items-center gap-4">
            <button
              onClick={onEnter}
              className="group relative overflow-hidden rounded-xl bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-500 hover:shadow-blue-500/30 active:scale-[0.98]"
            >
              <span className="relative z-10">Start Building</span>
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </button>
            <a
              href="https://github.com/zbrave/vcompose"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-slate-700 px-8 py-3.5 text-base font-medium text-slate-300 transition-all hover:border-slate-500 hover:text-white"
            >
              View Source
            </a>
          </div>
        </div>

        {/* Hero visual — YAML preview */}
        <div
          className={`mt-16 transition-all delay-300 duration-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}
        >
          <div className="overflow-hidden rounded-2xl border border-slate-700/50 bg-[#0d1117] shadow-2xl shadow-black/40">
            {/* Window chrome */}
            <div className="flex items-center gap-2 border-b border-slate-700/50 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-red-500/80" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
              <div className="h-3 w-3 rounded-full bg-green-500/80" />
              <span className="ml-3 text-xs text-slate-500 font-mono">docker-compose.yml</span>
            </div>
            <div className="p-6">
              <TypingYaml />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24 md:px-12">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Everything you need, nothing you don't
          </h2>
          <p className="mt-3 text-slate-400 text-lg">
            Zero config. Zero accounts. Just open and build.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="group rounded-2xl border border-slate-800/60 bg-slate-900/30 p-6 backdrop-blur-sm transition-all hover:border-slate-700 hover:bg-slate-800/40"
            >
              <div className="mb-4 inline-flex rounded-xl border border-slate-700/40 bg-slate-800/60 p-3 text-blue-400 transition-colors group-hover:border-blue-500/30 group-hover:text-blue-300">
                {f.icon}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">{f.title}</h3>
              <p className="text-sm leading-relaxed text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-32 md:px-12">
        <div className="relative overflow-hidden rounded-3xl border border-slate-700/40 bg-gradient-to-br from-slate-900 via-slate-800/50 to-slate-900 p-12 text-center md:p-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.08),transparent_60%)]" />
          <h2 className="relative text-3xl font-bold text-white md:text-4xl">
            Ready to build?
          </h2>
          <p className="relative mt-4 text-lg text-slate-400">
            No signup. No install. Just click and compose.
          </p>
          <button
            onClick={onEnter}
            className="relative mt-8 rounded-xl bg-blue-600 px-10 py-4 text-lg font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 hover:shadow-blue-500/30 active:scale-[0.98]"
          >
            Open VCompose
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/60 px-6 py-8 md:px-12">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="text-sm text-slate-600">
            Built for developers who ship.
          </span>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/zbrave/vcompose"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap');

        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeSlideIn {
          animation: fadeSlideIn 0.3s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
