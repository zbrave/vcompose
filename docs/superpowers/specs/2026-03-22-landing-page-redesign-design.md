# Landing Page Redesign — Design Spec

> **Goal:** Redesign the landing page with 21st.dev-quality visual effects: Canvas Particle Aurora background, Glass Cards with gold glow, and Framer Motion stagger animations.

---

## 1. Problem Statement

Current landing page uses basic CSS gradient orbs and static cards. Despite the project's anthracite/gold theme and Framer Motion being available, no 21st.dev-quality visual effects (shader effects, glowing effects, particle systems) were utilized. The page feels generic and underwhelming compared to what the component library offers.

---

## 2. Design Decisions (User-Approved)

| Element | Choice | Rationale |
|---|---|---|
| Background | Canvas Particle Aurora (Cosmic Aurora) | 800 particles with Perlin noise flow in amber/gold palette. Most dramatic option. Pure Canvas API, no new deps. |
| Feature Cards | Glass Card + Gold Glow | Frosted glass (`backdrop-filter: blur`) with gold border glow on hover. Elegant, lets aurora background show through. |
| Hero Animation | Full Stagger + Typing YAML | Framer Motion `staggerChildren` for sequential reveal. Typing YAML demo in glass container below hero. |

---

## 3. Architecture

### 3.1 New Files

```
src/components/landing/
  CosmicAurora.tsx      # Canvas particle background (fetched from 21st.dev, adapted)
  GlassFeatureCard.tsx  # Frosted glass card with gold hover glow
```

### 3.2 Modified Files

```
src/components/LandingPage.tsx  # Full rewrite with new components + stagger system
```

### 3.3 No New Dependencies

All effects use existing stack:
- **Canvas API** — for particle system (browser-native)
- **Framer Motion** — for stagger animations (already installed)
- **Tailwind CSS** — for styling (already installed)
- **lucide-react** — for feature icons (already installed)

---

## 4. Component Specifications

### 4.1 CosmicAurora

**Source:** Fetch from 21st.dev Magic MCP ("Cosmic Aurora" / "canvas aurora particles"), adapt to gold theme.

**Props:**
```typescript
interface CosmicAuroraProps {
  particleCount?: number;  // default: 800
  className?: string;
}
```

**Behavior:**
- Full-screen `<canvas>` element positioned absolute behind all content
- Perlin noise-based particle flow field
- Color palette: `#d4a843` (gold), `#a88030` (dark gold), `#8b6914` (deep amber)
- Aurora glow: 2-3 radial gradient overlays that slowly drift
- Particles: small dots (1-2px) that follow noise field, fading in/out
- Performance: `requestAnimationFrame` loop, cleanup on unmount
- Reduced motion: respects `prefers-reduced-motion` — falls back to static gradient

### 4.2 GlassFeatureCard

**Props:**
```typescript
interface GlassFeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}
```

**Styling:**
- Background: `rgba(26, 23, 20, 0.6)`
- Backdrop filter: `blur(12px)`
- Border: `1px solid rgba(212, 168, 67, 0.15)`
- Border radius: `12px`
- Padding: `20px`

**Hover State (CSS transition 300ms):**
- Border color → `rgba(212, 168, 67, 0.5)`
- Box shadow → `0 0 30px rgba(212, 168, 67, 0.15), inset 0 0 30px rgba(212, 168, 67, 0.05)`
- Transform → `translateY(-4px)`

**Icon Container:**
- Background: `linear-gradient(135deg, rgba(212,168,67,0.2), rgba(212,168,67,0.05))`
- Border radius: `8px`
- Size: `40px × 40px`
- Icon color: `#d4a843`

### 4.3 LandingPage (Rewrite)

**Structure:**
```
<div> (root container, min-h-screen, overflow-hidden)
  <CosmicAurora />                    ← full-screen canvas background
  <nav />                              ← glass nav bar (backdrop-filter)
  <section> (hero)
    <motion.div staggerChildren=0.15>
      Badge                            ← "Free & Open Source" pill
      Title                            ← "Visual Docker Compose" gradient text
      Subtitle                         ← description + code tag
      CTA buttons                      ← gold primary + ghost secondary
      TypingYaml                       ← glass container with typing effect
    </motion.div>
  </section>
  <section> (features)
    <heading />                        ← section title with whileInView
    <grid>
      9× <GlassFeatureCard />          ← stagger whileInView, delay i*0.07
    </grid>
  </section>
  <section> (bottom CTA)
    Glass panel with gold glow         ← "Ready to build?" + CTA
  </section>
  <footer />                           ← minimal, border-top
</div>
```

**Hero Stagger Animation:**
```typescript
const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};
```

**CTA Button Glow:**
```css
box-shadow: 0 0 20px rgba(212, 168, 67, 0.3), 0 0 60px rgba(212, 168, 67, 0.1);
```

**TypingYaml Container:**
- Same glass treatment as feature cards
- Window chrome dots (red/yellow/green)
- Filename label: `docker-compose.yml`
- Blinking gold cursor at typing position

**Nav Glass Treatment:**
- Background: `rgba(20, 18, 16, 0.8)`
- Backdrop filter: `blur(12px)`
- Border bottom: `1px solid rgba(212, 168, 67, 0.1)`

---

## 5. Performance Considerations

- Canvas particle system runs at 60fps on modern hardware
- `prefers-reduced-motion` media query disables particles, falls back to static aurora gradient
- Canvas cleanup in `useEffect` return to prevent memory leaks
- Particle count can be reduced on mobile (not in scope but future-safe)
- `backdrop-filter: blur()` is GPU-accelerated in modern browsers

---

## 6. Implementation Order

1. Fetch CosmicAurora from 21st.dev Magic MCP → adapt color palette
2. Create `GlassFeatureCard` component
3. Rewrite `LandingPage.tsx` with new components + stagger system
4. Verify visual quality in browser
5. Run existing E2E tests to ensure landing page gate still works

---

## 7. What Stays the Same

- `onEnter` prop and sessionStorage gate logic
- Feature list content (9 features with same icons)
- YAML_LINES content for typing demo
- TypingYaml component logic (line-by-line reveal)
- Nav links (GitHub)
- Footer content
- Overall page sections (nav → hero → features → CTA → footer)

---

## 8. What Changes

| Before | After |
|---|---|
| Static CSS gradient orbs | Canvas Particle Aurora (800 particles) |
| Solid dark cards with left bar indicator | Frosted glass cards with gold glow hover |
| Individual `motion.div` with manual delays | `staggerChildren` container pattern |
| Plain CTA button | Gold CTA with glow box-shadow |
| Simple YAML preview container | Glass container with window chrome |
| Static grid background | No grid (aurora particles are enough) |
| `onMouseEnter`/`onMouseLeave` inline handlers | Tailwind `hover:` + CSS transitions where possible |
