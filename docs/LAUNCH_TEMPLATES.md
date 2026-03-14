# Platform Launch Templates

Aşağıdaki template'leri kopyalayıp ilgili platformlarda kullan.

---

## 1. Product Hunt

**Tagline:** Visual Docker Compose Builder — drag, drop, deploy

**Description:**
VCompose lets you build docker-compose.yml files visually — or just describe what you need and let AI generate it. Drag services onto a canvas, connect them to define dependencies, and get real-time YAML output. Use it in the browser or directly from Claude, Cursor, or any MCP-compatible AI coding tool. No signup, no backend — everything runs in your browser. Free and open source.

**Topics:** Developer Tools, Docker, Open Source, AI, Productivity

**First Comment:**
Hey everyone! I built VCompose because I was tired of writing docker-compose files from scratch and looking up the syntax every time. With VCompose you just drag services, connect them, and the YAML writes itself. New: you can also describe your stack in plain English and let AI generate the entire compose file (supports OpenAI, Anthropic, Gemini, GLM). Plus it works as an MCP server so you can use it from Claude or Cursor. It's 100% client-side — your data never leaves the browser. Would love to hear your feedback!

---

## 2. Hacker News (Show HN)

**Title:** Show HN: VCompose — Visual Docker Compose Builder (No Backend, Runs in Browser)

**Body:**
Hi HN, I built a visual builder for docker-compose.yml files: https://vcompose.cc

You drag service presets (nginx, postgres, redis, node, or custom) onto a canvas, connect them to define depends_on relationships, and the YAML is generated in real-time.

Key points:
- Fully client-side, no backend, no signup
- AI generation — describe your stack, get a compose file (OpenAI, Anthropic, Gemini, GLM)
- MCP server — use from Claude, Cursor, or any MCP-compatible AI IDE
- Smart recommendations — add postgres, get pgadmin suggested
- YAML import — paste existing compose files to visualize
- Undo/redo with keyboard shortcuts

Tech: React + TypeScript + React Flow + Zustand + Tailwind

Feedback welcome!

---

## 3. Reddit

### r/docker & r/devops

**Title:** I built a visual drag-and-drop builder for docker-compose.yml — runs entirely in the browser

**Body:**
I've been working on VCompose (https://vcompose.cc), a tool that lets you build docker-compose files visually.

You drag services onto a canvas, configure ports/volumes/env vars, draw connections between them (which auto-generates depends_on), and the YAML updates in real-time. Or just describe what you need in plain English and let AI generate it (supports OpenAI, Anthropic, Gemini, GLM).

It also works as an MCP server, so you can use it directly from Claude, Cursor, or any MCP-compatible AI tool. And it suggests companion services automatically — add postgres and it'll recommend pgadmin.

Fully client-side — no data leaves your browser. You can also import existing compose files.

Would love feedback from the community!

### r/selfhosted

**Title:** VCompose — free, open-source visual docker-compose builder (self-hostable)

**Body:**
Built a browser-based tool for visually creating docker-compose.yml files: https://vcompose.cc

It's a static site so you can self-host it easily:

```
docker build -t vcompose .
docker run -p 80:80 vcompose
```

No backend, no telemetry, no signup. Everything stays in your browser's localStorage.

It also has AI generation (describe your stack → get a compose file), smart service recommendations, and works as an MCP server with Claude/Cursor.

---

## 4. Dev.to Blog Post

**Title:** I Built a Visual Docker Compose Builder — Here's What I Learned

**Tags:** docker, devtools, react, opensource

**Outline:**
1. Problem: Writing docker-compose.yml from scratch is tedious
2. Solution: Visual drag-and-drop builder
3. AI generation: describe your stack in plain English, get a compose file
4. IDE integration: use as an MCP server with Claude, Cursor, etc.
5. Smart recommendations: companion service suggestions
6. Demo: screenshot/GIF
7. Architecture: React Flow for canvas, Zustand for state, Vercel AI SDK
8. Key challenges: YAML generation edge cases, multi-provider AI
9. Try it: https://vcompose.cc
10. Open source: GitHub link

---

## 5. Twitter/X Thread

**Tweet 1:**
I built VCompose — a visual Docker Compose builder with AI generation.

Drag services, describe your stack in plain English, or use it from your AI IDE.

No signup. No backend. Free.

https://vcompose.cc

[attach demo GIF]

**Tweet 2:**
How it works:
1. Drag a service preset (nginx, postgres, redis...)
2. Or describe your stack → AI generates the compose file
3. Draw connections = depends_on
4. Smart recommendations suggest companion services
5. Copy or download the YAML

**Tweet 3:**
Works with your AI tools:
- Use as an MCP server with Claude, Cursor, or any compatible IDE
- Supports OpenAI, Anthropic, Gemini, GLM for generation

Built with React + TypeScript + React Flow + Zustand + Vercel AI SDK

Open source: [GitHub link]

---

## 6. Awesome Lists (PR)

### awesome-docker
- **Category:** Tools / Web
- **Entry:** `[VCompose](https://vcompose.cc) - Visual drag-and-drop builder for docker-compose.yml files with AI generation and MCP server. Runs in browser, no backend.`

### awesome-selfhosted
- **Category:** Software Development / IDE
- **Entry:** `[VCompose](https://vcompose.cc) - Visual builder for docker-compose.yml with drag-and-drop, AI generation, and MCP server for IDE integration. No backend required. ([Source Code](https://github.com/zbrave/vcompose)) MIT Docker`
