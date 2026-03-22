import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Container,
  GitBranch,
  Download,
  Eye,
  Network,
  Shield,
  Layers,
  Cpu,
  Zap,
} from 'lucide-react';
import { CosmicAurora } from './landing/CosmicAurora';
import { GlassFeatureCard } from './landing/GlassFeatureCard';

// --- Typing YAML demo ---

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
        const isKey =
          line.includes(':') && !line.trimStart().startsWith('-');
        const indent = line.length - line.trimStart().length;
        const trimmed = line.trimStart();

        let content;
        if (trimmed.startsWith('-')) {
          const val = trimmed.slice(2);
          content = (
            <>
              <span
                style={{ paddingLeft: indent * 8, color: '#6b6055' }}
              >
                -{' '}
              </span>
              <span style={{ color: '#4ade80' }}>{val}</span>
            </>
          );
        } else if (isKey) {
          const [key, ...rest] = trimmed.split(':');
          const val = rest.join(':').trim();
          content = (
            <>
              <span
                style={{ paddingLeft: indent * 8, color: '#d4a843' }}
              >
                {key}
              </span>
              <span style={{ color: '#6b6055' }}>:</span>
              {val && (
                <span style={{ color: '#4ade80' }}> {val}</span>
              )}
            </>
          );
        } else {
          content = (
            <span style={{ color: '#a89880' }}>{line}</span>
          );
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
        <span
          className="inline-block h-4 w-2 animate-pulse"
          style={{ background: '#d4a843' }}
        />
      )}
    </pre>
  );
}

// --- Feature data ---

const features = [
  {
    icon: Container,
    title: 'Drag & Drop',
    desc: 'Build compose files visually with an intuitive canvas',
  },
  {
    icon: GitBranch,
    title: 'Dependencies',
    desc: 'Connect services to define depends_on relationships',
  },
  {
    icon: Download,
    title: 'Export YAML',
    desc: 'Download valid docker-compose.yml with one click',
  },
  {
    icon: Eye,
    title: 'Real-time Preview',
    desc: 'See YAML update in real time as you build',
  },
  {
    icon: Network,
    title: 'Network Config',
    desc: 'Automatic network creation and management',
  },
  {
    icon: Shield,
    title: 'Validation',
    desc: 'Built-in validation catches errors before deployment',
  },
  {
    icon: Layers,
    title: '16+ Stacks',
    desc: 'Pre-built stacks: MERN, LAMP, ELK, and more',
  },
  {
    icon: Cpu,
    title: 'AI Generation',
    desc: 'Generate compose files from natural language',
  },
  {
    icon: Zap,
    title: '111+ Services',
    desc: 'Marketplace with databases, caches, web servers',
  },
];

// --- Animation variants ---

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

// --- Landing Page ---

interface LandingPageProps {
  onEnter: () => void;
}

export function LandingPage({ onEnter }: LandingPageProps) {
  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: '#0a0806' }}
    >
      {/* Cosmic Aurora particle background */}
      <CosmicAurora particleCount={800} />

      {/* Nav */}
      <nav
        className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12"
        style={{
          background: 'rgba(20, 18, 16, 0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(212, 168, 67, 0.1)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="text-lg"
            style={{
              fontWeight: 800,
              letterSpacing: '-0.5px',
              color: '#d4a843',
            }}
          >
            ◆ VCompose
          </span>
        </div>
        <a
          href="https://github.com/zbrave/vcompose"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-all duration-200"
          style={{
            border: '1px solid rgba(212, 168, 67, 0.15)',
            background: 'rgba(26, 23, 20, 0.6)',
            backdropFilter: 'blur(8px)',
            color: '#a89880',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget;
            el.style.borderColor = 'rgba(212,168,67,0.4)';
            el.style.color = '#e8dcc8';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget;
            el.style.borderColor = 'rgba(212,168,67,0.15)';
            el.style.color = '#a89880';
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          Star on GitHub
        </a>
      </nav>

      {/* Hero Section — stagger animation */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-16 md:px-12 md:pt-24">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div
            variants={fadeUp}
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
            variants={fadeUp}
            className="max-w-3xl text-5xl font-black leading-[1.1] tracking-tight sm:text-6xl"
            style={{
              background:
                'linear-gradient(to right, #e8dcc8, #d4a843)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Visual Docker Compose
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-xl text-lg leading-relaxed"
            style={{ color: '#a89880' }}
          >
            Drag services. Draw connections. Get a production-ready{' '}
            <code
              className="rounded px-1.5 py-0.5 text-[0.9em]"
              style={{
                background: 'rgba(212,168,67,0.1)',
                color: '#d4a843',
              }}
            >
              docker-compose.yml
            </code>{' '}
            in seconds — right in your browser.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            variants={fadeUp}
            className="mt-10 flex items-center gap-4"
          >
            <button
              onClick={onEnter}
              className="rounded-lg px-6 py-3 text-base font-semibold transition-all duration-200"
              style={{
                background:
                  'linear-gradient(135deg, #d4a843, #a88030)',
                color: '#0a0806',
                boxShadow:
                  '0 0 20px rgba(212,168,67,0.3), 0 0 60px rgba(212,168,67,0.1)',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.boxShadow =
                  '0 0 30px rgba(212,168,67,0.5), 0 0 80px rgba(212,168,67,0.2)';
                el.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.boxShadow =
                  '0 0 20px rgba(212,168,67,0.3), 0 0 60px rgba(212,168,67,0.1)';
                el.style.transform = 'translateY(0)';
              }}
            >
              Start Building →
            </button>
            <a
              href="https://github.com/zbrave/vcompose"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg px-6 py-3 text-base font-medium transition-all duration-200"
              style={{
                background: 'rgba(26, 23, 20, 0.6)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(212,168,67,0.15)',
                color: '#a89880',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = 'rgba(212,168,67,0.4)';
                el.style.color = '#e8dcc8';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = 'rgba(212,168,67,0.15)';
                el.style.color = '#a89880';
              }}
            >
              View Source
            </a>
          </motion.div>

          {/* YAML Preview — glass container */}
          <motion.div variants={scaleIn} className="mt-16">
            <div
              className="overflow-hidden rounded-xl"
              style={{
                background: 'rgba(20, 18, 16, 0.7)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(212,168,67,0.15)',
                boxShadow:
                  '0 0 40px rgba(212,168,67,0.05), 0 20px 60px rgba(0,0,0,0.3)',
              }}
            >
              {/* Window chrome */}
              <div
                className="flex items-center gap-2 px-4 py-2"
                style={{
                  borderBottom:
                    '1px solid rgba(212,168,67,0.1)',
                }}
              >
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <div className="h-3 w-3 rounded-full bg-green-500/80" />
                <span
                  className="ml-3 text-xs font-mono"
                  style={{ color: '#6b6055' }}
                >
                  docker-compose.yml
                </span>
              </div>
              <div className="p-6">
                <TypingYaml />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
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
          <p className="mt-3 text-lg" style={{ color: '#a89880' }}>
            Zero config. Zero accounts. Just open and build.
          </p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.4 }}
            >
              <GlassFeatureCard
                icon={f.icon}
                title={f.title}
                description={f.desc}
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-32 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl p-12 text-center md:p-16"
          style={{
            background: 'rgba(26, 23, 20, 0.6)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(212,168,67,0.15)',
          }}
        >
          {/* Ambient gold glow */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 50% 0%, rgba(212,168,67,0.1), transparent 60%)',
            }}
          />

          <h2
            className="relative text-3xl font-bold md:text-4xl"
            style={{ color: '#e8dcc8' }}
          >
            Ready to build?
          </h2>
          <p
            className="relative mt-4 text-lg"
            style={{ color: '#a89880' }}
          >
            No signup. No install. Just click and compose.
          </p>
          <button
            onClick={onEnter}
            className="relative mt-8 rounded-lg px-10 py-4 text-lg font-semibold transition-all duration-200"
            style={{
              background:
                'linear-gradient(135deg, #d4a843, #a88030)',
              color: '#0a0806',
              boxShadow:
                '0 0 20px rgba(212,168,67,0.3), 0 0 60px rgba(212,168,67,0.1)',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.boxShadow =
                '0 0 30px rgba(212,168,67,0.5), 0 0 80px rgba(212,168,67,0.2)';
              el.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.boxShadow =
                '0 0 20px rgba(212,168,67,0.3), 0 0 60px rgba(212,168,67,0.1)';
              el.style.transform = 'translateY(0)';
            }}
          >
            Open VCompose
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer
        className="relative z-10 px-6 py-8 md:px-12"
        style={{ borderTop: '1px solid rgba(212,168,67,0.1)' }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="text-sm" style={{ color: '#6b6055' }}>
            Built for developers who ship.
          </span>
          <a
            href="https://github.com/zbrave/vcompose"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm transition-colors duration-200"
            style={{ color: '#6b6055' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#a89880';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#6b6055';
            }}
          >
            GitHub
          </a>
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
