import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Container, GitBranch, Download, Eye, Network, Shield, Layers, Cpu, Zap } from 'lucide-react';

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
    <pre ref={containerRef} className="font-mono text-[13px] leading-relaxed">
      {YAML_LINES.slice(0, visibleLines).map((line, i) => {
        const isKey = line.includes(':') && !line.trimStart().startsWith('-');
        const indent = line.length - line.trimStart().length;
        const trimmed = line.trimStart();

        let content;
        if (trimmed.startsWith('-')) {
          const val = trimmed.slice(2);
          content = (
            <>
              <span style={{ paddingLeft: indent * 8 }} className="text-text-muted">- </span>
              <span style={{ color: '#4ade80' }}>{val}</span>
            </>
          );
        } else if (isKey) {
          const [key, ...rest] = trimmed.split(':');
          const val = rest.join(':').trim();
          content = (
            <>
              <span style={{ paddingLeft: indent * 8 }} className="text-accent">{key}</span>
              <span className="text-text-muted">:</span>
              {val && <span style={{ color: '#4ade80' }}> {val}</span>}
            </>
          );
        } else {
          content = <span className="text-text-secondary">{line}</span>;
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
        <span className="inline-block h-4 w-2 animate-pulse" style={{ background: '#d4a843' }} />
      )}
    </pre>
  );
}

const features = [
  { icon: Container, title: 'Drag & Drop', desc: 'Build compose files visually with an intuitive canvas' },
  { icon: GitBranch, title: 'Dependencies', desc: 'Connect services to define depends_on relationships' },
  { icon: Download, title: 'Export YAML', desc: 'Download valid docker-compose.yml with one click' },
  { icon: Eye, title: 'Real-time Preview', desc: 'See YAML update in real time as you build' },
  { icon: Network, title: 'Network Config', desc: 'Automatic network creation and management' },
  { icon: Shield, title: 'Validation', desc: 'Built-in validation catches errors before deployment' },
  { icon: Layers, title: '16+ Stacks', desc: 'Pre-built stacks: MERN, LAMP, ELK, and more' },
  { icon: Cpu, title: 'AI Generation', desc: 'Generate compose files from natural language' },
  { icon: Zap, title: '111+ Services', desc: 'Marketplace with databases, caches, web servers' },
];

interface LandingPageProps {
  onEnter: () => void;
}

export function LandingPage({ onEnter }: LandingPageProps) {
  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#141210' }}>
      {/* Background grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(212,168,67,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(212,168,67,0.03) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-1/2 left-1/4 h-[600px] w-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(212,168,67,0.3), transparent 70%)' }}
        />
        <div
          className="absolute top-1/3 right-1/4 h-[400px] w-[400px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(212,168,67,0.2), transparent 70%)' }}
        />
      </div>

      {/* Nav */}
      <nav
        className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12 border-b"
        style={{
          background: 'rgba(20,18,16,0.8)',
          backdropFilter: 'blur(12px)',
          borderColor: '#2d2a25',
        }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="text-lg text-accent"
            style={{ fontWeight: 800, letterSpacing: '-0.5px' }}
          >
            ◆ VCompose
          </span>
        </div>
        <a
          href="https://github.com/zbrave/vcompose"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-all"
          style={{
            border: '1px solid #2d2a25',
            background: 'rgba(38,34,32,0.6)',
            color: '#a89880',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(212,168,67,0.3)';
            (e.currentTarget as HTMLAnchorElement).style.color = '#e8dcc8';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor = '#2d2a25';
            (e.currentTarget as HTMLAnchorElement).style.color = '#a89880';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          Star on GitHub
        </a>
      </nav>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-16 md:px-12 md:pt-24">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.0 }}
          className="mb-8 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs"
          style={{
            background: 'rgba(212,168,67,0.1)',
            border: '1px solid rgba(212,168,67,0.2)',
            color: '#d4a843',
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full animate-pulse"
            style={{ background: '#d4a843' }}
          />
          Free &amp; Open Source
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-3xl text-5xl font-black leading-[1.1] tracking-tight sm:text-6xl"
          style={{
            background: 'linear-gradient(to right, #e8dcc8, #d4a843)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Visual Docker Compose
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 max-w-xl text-lg leading-relaxed text-text-secondary"
        >
          Drag services. Draw connections. Get a production-ready{' '}
          <code
            className="rounded px-1.5 py-0.5 text-[0.9em]"
            style={{ background: '#262220', color: '#d4a843' }}
          >
            docker-compose.yml
          </code>{' '}
          in seconds — right in your browser.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10 flex items-center gap-4"
        >
          <button
            onClick={onEnter}
            className="rounded-lg px-6 py-3 text-base font-semibold transition-colors"
            style={{ background: '#d4a843', color: '#141210' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#a88a35';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#d4a843';
            }}
          >
            Start Building
          </button>
          <a
            href="https://github.com/zbrave/vcompose"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg px-6 py-3 text-base font-medium transition-colors"
            style={{
              background: '#262220',
              border: '1px solid #2d2a25',
              color: '#a89880',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(212,168,67,0.3)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = '#2d2a25';
            }}
          >
            View Source
          </a>
        </motion.div>

        {/* YAML Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-16"
        >
          <div
            className="overflow-hidden rounded-xl"
            style={{ background: '#1e1b18', border: '1px solid #2d2a25' }}
          >
            {/* Window chrome */}
            <div
              className="flex items-center gap-2 px-4 py-2 border-b"
              style={{ background: '#1e1b18', borderColor: '#2d2a25' }}
            >
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="ml-3 text-xs font-mono" style={{ color: '#6b6055' }}>
                docker-compose.yml
              </span>
            </div>
            <div className="p-6">
              <TypingYaml />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h2
            className="text-3xl font-bold tracking-tight md:text-4xl"
            style={{ color: '#e8dcc8' }}
          >
            Everything you need, nothing you don't
          </h2>
          <p className="mt-3 text-lg text-text-secondary">
            Zero config. Zero accounts. Just open and build.
          </p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.4 }}
                className="group relative rounded-lg p-5 transition-all hover:-translate-y-1"
                style={{
                  background: '#1e1b18',
                  border: '1px solid #2d2a25',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(212,168,67,0.3)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#2d2a25';
                }}
              >
                {/* Left bar indicator */}
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r transition-all duration-300 group-hover:h-8"
                  style={{
                    height: '24px',
                    background: '#6b6055',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = '#d4a843';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = '#6b6055';
                  }}
                />

                <div className="flex items-start gap-4">
                  <div
                    className="shrink-0 p-2 rounded-lg"
                    style={{ background: 'rgba(212,168,67,0.1)', color: '#d4a843' }}
                  >
                    <Icon size={18} />
                  </div>
                  <div>
                    <h3 className="font-medium" style={{ color: '#e8dcc8' }}>
                      {f.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                      {f.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-32 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl p-12 text-center md:p-16"
          style={{
            background: 'linear-gradient(135deg, #1e1b18 0%, #262220 50%, #1e1b18 100%)',
            border: '1px solid rgba(212,168,67,0.15)',
          }}
        >
          {/* Subtle amber tint overlay */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'radial-gradient(circle at 50% 0%, rgba(212,168,67,0.06), transparent 60%)',
            }}
          />

          <h2 className="relative text-3xl font-bold md:text-4xl" style={{ color: '#e8dcc8' }}>
            Ready to build?
          </h2>
          <p className="relative mt-4 text-lg text-text-secondary">
            No signup. No install. Just click and compose.
          </p>
          <button
            onClick={onEnter}
            className="relative mt-8 rounded-lg px-10 py-4 text-lg font-semibold transition-colors"
            style={{ background: '#d4a843', color: '#141210' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#a88a35';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#d4a843';
            }}
          >
            Open VCompose
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer
        className="relative z-10 px-6 py-8 md:px-12"
        style={{ borderTop: '1px solid #2d2a25' }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="text-sm text-text-muted">Built for developers who ship.</span>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/zbrave/vcompose"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-text-muted transition-colors hover:text-text-secondary"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>

      <style>{`
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
