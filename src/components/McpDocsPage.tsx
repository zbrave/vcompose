import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Copy,
  Check,
  Terminal,
  ShieldCheck,
  FileCode2,
  Lightbulb,
  Sparkles,
  MessageSquare,
  Plug,
} from 'lucide-react';

// --- Animation variants ---

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

// --- Custom code style ---

const codeStyle: Record<string, React.CSSProperties> = {
  ...(oneDark as Record<string, React.CSSProperties>),
  'code[class*="language-"]': {
    ...((oneDark as Record<string, React.CSSProperties>)['code[class*="language-"]']),
    background: 'transparent',
    fontSize: '13px',
  },
  'pre[class*="language-"]': {
    ...((oneDark as Record<string, React.CSSProperties>)['pre[class*="language-"]']),
    background: 'transparent',
    margin: 0,
    padding: '16px',
  },
};

// --- Copy Button ---

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-all duration-200"
      style={{
        background: copied ? 'rgba(74, 222, 128, 0.15)' : 'rgba(212, 168, 67, 0.1)',
        border: `1px solid ${copied ? 'rgba(74, 222, 128, 0.3)' : 'rgba(212, 168, 67, 0.2)'}`,
        color: copied ? '#4ade80' : '#a89880',
      }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

// --- Code Block ---

function CodeBlock({ code, language }: { code: string; language: string }) {
  return (
    <div
      className="overflow-hidden rounded-lg"
      style={{
        background: 'rgba(15, 13, 11, 0.8)',
        border: '1px solid rgba(212, 168, 67, 0.1)',
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ borderBottom: '1px solid rgba(212, 168, 67, 0.08)' }}
      >
        <span className="font-mono text-xs" style={{ color: '#6b6055' }}>
          {language}
        </span>
        <CopyButton text={code} />
      </div>
      <SyntaxHighlighter language={language === 'bash' ? 'bash' : 'json'} style={codeStyle}>
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

// --- Glass Card ---

function GlassCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl p-6 ${className}`}
      style={{
        background: 'rgba(26, 23, 20, 0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(212, 168, 67, 0.15)',
      }}
    >
      {children}
    </div>
  );
}

// --- Setup tabs data ---

const SETUP_TABS = [
  {
    label: 'Claude Code',
    code: `# Option 1: CLI
claude mcp add docker-compose-mcp -- npx docker-compose-mcp

# Option 2: Config file (~/.claude/claude_desktop_config.json)
{
  "mcpServers": {
    "docker-compose-mcp": {
      "command": "npx",
      "args": ["docker-compose-mcp"]
    }
  }
}`,
    language: 'bash',
  },
  {
    label: 'Cursor',
    code: `// .cursor/mcp.json
{
  "mcpServers": {
    "docker-compose-mcp": {
      "command": "npx",
      "args": ["docker-compose-mcp"]
    }
  }
}`,
    language: 'json',
  },
  {
    label: 'VS Code',
    code: `// .vscode/settings.json
{
  "mcp": {
    "servers": {
      "docker-compose-mcp": {
        "command": "npx",
        "args": ["docker-compose-mcp"]
      }
    }
  }
}`,
    language: 'json',
  },
  {
    label: 'Generic',
    code: `Transport: stdio
Command: npx docker-compose-mcp`,
    language: 'bash',
  },
];

// --- Tools data ---

const TOOLS = [
  {
    icon: FileCode2,
    name: 'generate-compose',
    title: 'Generate Docker Compose',
    description:
      'Generate a docker-compose.yml from a list of service names. Automatically configures images, ports, environment variables, dependencies, and networks.',
    inputs: [
      { name: 'services', type: 'string[]', required: true },
    ],
  },
  {
    icon: ShieldCheck,
    name: 'validate-compose',
    title: 'Validate Docker Compose',
    description:
      'Validate a docker-compose.yml file. Returns semantic errors and warnings.',
    inputs: [{ name: 'yaml', type: 'string', required: true }],
  },
  {
    icon: Terminal,
    name: 'parse-compose',
    title: 'Parse Docker Compose',
    description:
      'Parse a docker-compose.yml into structured data. Returns services, networks, volumes, and dependencies.',
    inputs: [{ name: 'yaml', type: 'string', required: true }],
  },
  {
    icon: Lightbulb,
    name: 'get-recommendations',
    title: 'Get Service Recommendations',
    description:
      'Get recommended companion services for a given service. E.g., "postgres" recommends pgadmin, redis, node.',
    inputs: [
      { name: 'service', type: 'string', required: true },
      { name: 'existing', type: 'string[]', required: false },
    ],
  },
  {
    icon: Sparkles,
    name: 'ai-generate-compose',
    title: 'AI Generate Docker Compose',
    description:
      'Use AI (LLM) to generate or optimize a docker-compose.yml. Requires user API key for the chosen provider.',
    inputs: [
      { name: 'prompt', type: 'string', required: true },
      { name: 'provider', type: "'anthropic' | 'openai' | 'gemini' | 'glm'", required: true },
      { name: 'apiKey', type: 'string', required: true },
      { name: 'model', type: 'string', required: false },
      { name: 'baseUrl', type: 'string', required: false },
      { name: 'mode', type: "'generate' | 'optimize'", required: false },
      { name: 'yaml', type: 'string', required: false },
    ],
  },
];

// --- Examples data ---

const EXAMPLES = [
  {
    title: 'Create a MERN stack',
    prompt: 'Create a docker-compose with MongoDB, Express, React, and Node',
    tool: 'generate-compose',
    output: `services:
  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
  api:
    image: node:20-alpine
    ports:
      - "3000:3000"
    depends_on:
      - mongodb
  frontend:
    image: node:20-alpine
    ports:
      - "5173:5173"
    depends_on:
      - api
volumes:
  mongo_data:`,
    language: 'yaml',
  },
  {
    title: 'Validate my YAML',
    prompt: 'Check this docker-compose for errors',
    tool: 'validate-compose',
    output: `{
  "valid": false,
  "issues": [
    {
      "severity": "error",
      "message": "Service 'api' has no image specified",
      "field": "services.api.image"
    },
    {
      "severity": "warning",
      "message": "Port 3000 is used by multiple services",
      "field": "services.*.ports"
    }
  ]
}`,
    language: 'json',
  },
  {
    title: 'What goes with PostgreSQL?',
    prompt: 'What services complement PostgreSQL?',
    tool: 'get-recommendations',
    output: `{
  "service": "postgres",
  "recommendations": [
    {
      "name": "pgAdmin",
      "reason": "Web-based PostgreSQL admin interface"
    },
    {
      "name": "Redis",
      "reason": "Caching layer to reduce database load"
    },
    {
      "name": "Node.js",
      "reason": "Backend runtime with excellent pg drivers"
    }
  ]
}`,
    language: 'json',
  },
];

// --- IDE badges ---

const IDE_BADGES = [
  { name: 'Claude Code', color: '#d4a843' },
  { name: 'Cursor', color: '#8b5cf6' },
  { name: 'VS Code (Cline/Continue)', color: '#3b82f6' },
  { name: 'Windsurf', color: '#06b6d4' },
];

// --- Main Component ---

export function McpDocsPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#0a0806' }}>
      {/* Background ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-[200px] left-1/2 h-[800px] w-[1000px] -translate-x-1/2 rounded-full"
          style={{
            background:
              'radial-gradient(ellipse, rgba(212,168,67,0.08) 0%, rgba(212,168,67,0.03) 40%, transparent 70%)',
          }}
        />
        <div
          className="absolute -right-[100px] top-[40%] h-[600px] w-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(168,120,40,0.06) 0%, transparent 60%)',
          }}
        />
        <div
          className="absolute -left-[100px] bottom-[10%] h-[500px] w-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(212,168,67,0.05) 0%, transparent 60%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(212,168,67,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(212,168,67,0.02) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      {/* Navbar */}
      <nav
        className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12"
        style={{
          background: 'rgba(20, 18, 16, 0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(212, 168, 67, 0.1)',
        }}
      >
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="VCompose" width="24" height="24" />
          <span
            className="text-lg"
            style={{ fontWeight: 800, letterSpacing: '-0.5px', color: '#d4a843' }}
          >
            VCompose
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/app"
            className="rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #d4a843, #a88030)',
              color: '#0a0806',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                '0 0 20px rgba(212,168,67,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Start Building →
          </Link>
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
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            GitHub
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-16 pt-16 md:px-12 md:pt-24">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible">
          <motion.div
            variants={fadeUp}
            className="mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs"
            style={{
              background: 'rgba(212,168,67,0.1)',
              border: '1px solid rgba(212,168,67,0.2)',
              color: '#d4a843',
            }}
          >
            <Plug size={12} />
            Model Context Protocol
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="max-w-3xl text-5xl font-black leading-[1.1] tracking-tight sm:text-6xl"
            style={{
              background: 'linear-gradient(to right, #e8dcc8, #d4a843)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            MCP Integration
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-xl text-lg leading-relaxed"
            style={{ color: '#a89880' }}
          >
            Connect your AI-powered IDE to VCompose and manage Docker Compose files with natural
            language
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8">
            <Link
              to="/app"
              className="inline-flex rounded-lg px-6 py-3 text-base font-semibold transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, #d4a843, #a88030)',
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
              Open Builder →
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Section 1: What is MCP? */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-20 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl" style={{ color: '#e8dcc8' }}>
            What is MCP?
          </h2>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed" style={{ color: '#a89880' }}>
            The{' '}
            <span style={{ color: '#d4a843' }}>Model Context Protocol</span> is an open standard that
            lets AI assistants interact with external tools and data sources. Think of it as a bridge
            between your AI-powered IDE and VCompose — your AI can generate, validate, and optimize
            Docker Compose files without leaving the editor.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {IDE_BADGES.map((ide) => (
              <span
                key={ide.name}
                className="rounded-full px-4 py-1.5 text-sm font-medium"
                style={{
                  background: `${ide.color}15`,
                  border: `1px solid ${ide.color}30`,
                  color: ide.color,
                }}
              >
                {ide.name}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Section 2: Setup Guide */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-20 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl" style={{ color: '#e8dcc8' }}>
            Setup Guide
          </h2>
          <p className="mb-8 mt-3 text-lg" style={{ color: '#a89880' }}>
            Choose your IDE and follow the instructions to connect.
          </p>

          {/* Tabs */}
          <div
            className="mb-6 inline-flex rounded-lg p-1"
            style={{
              background: 'rgba(26, 23, 20, 0.6)',
              border: '1px solid rgba(212, 168, 67, 0.15)',
            }}
          >
            {SETUP_TABS.map((tab, i) => (
              <button
                key={tab.label}
                onClick={() => setActiveTab(i)}
                className="rounded-md px-4 py-2 text-sm font-medium transition-all duration-200"
                style={{
                  background:
                    activeTab === i
                      ? 'rgba(212, 168, 67, 0.15)'
                      : 'transparent',
                  color: activeTab === i ? '#d4a843' : '#6b6055',
                  border:
                    activeTab === i
                      ? '1px solid rgba(212, 168, 67, 0.3)'
                      : '1px solid transparent',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <CodeBlock
            code={SETUP_TABS[activeTab].code}
            language={SETUP_TABS[activeTab].language}
          />
        </motion.div>
      </section>

      {/* Section 3: Tools Reference */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-20 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl" style={{ color: '#e8dcc8' }}>
            Tools Reference
          </h2>
          <p className="mb-8 mt-3 text-lg" style={{ color: '#a89880' }}>
            Five tools to manage Docker Compose from your AI assistant.
          </p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2">
          {TOOLS.map((tool, i) => {
            const Icon = tool.icon;
            return (
              <motion.div
                key={tool.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className={i === TOOLS.length - 1 ? 'md:col-span-2' : ''}
              >
                <GlassCard className="h-full">
                  <div className="mb-3 flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{
                        background: 'rgba(212, 168, 67, 0.1)',
                        border: '1px solid rgba(212, 168, 67, 0.2)',
                      }}
                    >
                      <Icon size={18} style={{ color: '#d4a843' }} />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold" style={{ color: '#e8dcc8' }}>
                        {tool.title}
                      </h3>
                      <code className="text-xs" style={{ color: '#6b6055' }}>
                        {tool.name}
                      </code>
                    </div>
                  </div>
                  <p className="mb-4 text-sm leading-relaxed" style={{ color: '#a89880' }}>
                    {tool.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {tool.inputs.map((input) => (
                      <span
                        key={input.name}
                        className="rounded-md px-2 py-1 font-mono text-xs"
                        style={{
                          background: input.required
                            ? 'rgba(212, 168, 67, 0.1)'
                            : 'rgba(107, 96, 85, 0.15)',
                          border: `1px solid ${input.required ? 'rgba(212, 168, 67, 0.2)' : 'rgba(107, 96, 85, 0.2)'}`,
                          color: input.required ? '#d4a843' : '#6b6055',
                        }}
                      >
                        {input.name}: {input.type}
                        {!input.required && ' ?'}
                      </span>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Section 4: Usage Examples */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-24 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl" style={{ color: '#e8dcc8' }}>
            Usage Examples
          </h2>
          <p className="mb-8 mt-3 text-lg" style={{ color: '#a89880' }}>
            See how your AI assistant interacts with VCompose through MCP.
          </p>
        </motion.div>

        <div className="space-y-6">
          {EXAMPLES.map((example, i) => (
            <motion.div
              key={example.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              <GlassCard>
                <div className="mb-4 flex items-start gap-3">
                  <div
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      background: 'rgba(212, 168, 67, 0.1)',
                      border: '1px solid rgba(212, 168, 67, 0.2)',
                    }}
                  >
                    <MessageSquare size={16} style={{ color: '#d4a843' }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: '#e8dcc8' }}>
                      &ldquo;{example.title}&rdquo;
                    </h3>
                    <p className="mt-1 text-sm" style={{ color: '#a89880' }}>
                      Prompt: {example.prompt}
                    </p>
                    <span
                      className="mt-2 inline-block rounded-md px-2 py-0.5 font-mono text-xs"
                      style={{
                        background: 'rgba(212, 168, 67, 0.1)',
                        border: '1px solid rgba(212, 168, 67, 0.2)',
                        color: '#d4a843',
                      }}
                    >
                      {example.tool}
                    </span>
                  </div>
                </div>
                <CodeBlock code={example.output} language={example.language} />
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        className="relative z-10 px-6 py-8 md:px-12"
        style={{ borderTop: '1px solid rgba(212,168,67,0.1)' }}
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <span className="text-sm" style={{ color: '#6b6055' }}>
            &copy; {new Date().getFullYear()}{' '}
            <a
              href="https://creinoff.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors duration-200"
              style={{ color: '#6b6055' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#d4a843';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#6b6055';
              }}
            >
              Creinoff
            </a>
            . All rights reserved.
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
    </div>
  );
}
