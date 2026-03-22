import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
}

interface CosmicAuroraProps {
  className?: string;
  particleCount?: number;
}

// Perlin noise implementation
class PerlinNoise {
  private permutation: number[];

  constructor(seed: number = 0) {
    this.permutation = [];
    for (let i = 0; i < 256; i++) {
      this.permutation[i] = i;
    }
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(
        (Math.sin(seed + i) * 10000) % (i + 1),
      );
      [this.permutation[i], this.permutation[j]] = [
        this.permutation[j],
        this.permutation[i],
      ];
    }
    this.permutation = [...this.permutation, ...this.permutation];
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);

    const u = this.fade(x);
    const v = this.fade(y);

    const a = this.permutation[X] + Y;
    const b = this.permutation[X + 1] + Y;

    return this.lerp(
      this.lerp(
        this.grad(this.permutation[a], x, y),
        this.grad(this.permutation[b], x - 1, y),
        u,
      ),
      this.lerp(
        this.grad(this.permutation[a + 1], x, y - 1),
        this.grad(this.permutation[b + 1], x - 1, y - 1),
        u,
      ),
      v,
    );
  }
}

const BASE_HUE = 35;
const HUE_RANGE = 25;
const FLOW_SPEED = 0.6;
const NOISE_SCALE = 0.003;
const TRAIL_OPACITY = 0.08;

export function CosmicAurora({
  className = '',
  particleCount = 800,
}: CosmicAuroraProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Respect reduced motion preference
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let width = container.clientWidth;
    let height = container.clientHeight;
    let particles: Particle[] = [];
    let animationFrameId: number;
    let time = 0;
    const perlin = new PerlinNoise(Math.random() * 1000);

    const createParticle = (): Particle => {
      const maxLife = 200 + Math.random() * 200;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0,
        vy: 0,
        life: Math.random() * maxLife,
        maxLife,
        size: 1 + Math.random() * 1.5,
        hue: BASE_HUE + (Math.random() - 0.5) * HUE_RANGE,
      };
    };

    const init = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(createParticle());
      }
    };

    const updateParticle = (p: Particle) => {
      const noiseX = p.x * NOISE_SCALE;
      const noiseY = p.y * NOISE_SCALE;
      const noiseTime = time * 0.0001;

      const angle =
        perlin.noise(noiseX + noiseTime, noiseY + noiseTime) *
          Math.PI *
          4 +
        perlin.noise(
          noiseX * 2 + noiseTime * 1.5,
          noiseY * 2 + noiseTime * 1.5,
        ) *
          Math.PI *
          2;

      const force = 0.3 * FLOW_SPEED;
      p.vx += Math.cos(angle) * force;
      p.vy += Math.sin(angle) * force;

      const turbulence = perlin.noise(
        p.x * 0.01 + time * 0.0002,
        p.y * 0.01 + time * 0.0002,
      );
      p.vx += turbulence * 0.1;
      p.vy += turbulence * 0.1;

      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95;
      p.vy *= 0.95;

      p.life++;
      if (p.life > p.maxLife) {
        const newP = createParticle();
        p.x = newP.x;
        p.y = newP.y;
        p.vx = 0;
        p.vy = 0;
        p.life = 0;
        p.hue = newP.hue;
      }

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;
    };

    const drawParticle = (p: Particle) => {
      const lifeRatio = p.life / p.maxLife;
      const alpha = Math.sin(lifeRatio * Math.PI) * 0.6;

      const saturation =
        70 + Math.sin(time * 0.001 + p.x * 0.01) * 20;
      const lightness =
        50 + Math.sin(time * 0.0015 + p.y * 0.01) * 15;

      ctx.fillStyle = `hsla(${p.hue}, ${saturation}%, ${lightness}%, ${alpha})`;
      ctx.shadowBlur =
        6 + Math.sin(time * 0.002 + p.x * 0.02) * 3;
      ctx.shadowColor = `hsla(${p.hue}, ${saturation}%, ${lightness}%, ${alpha * 0.3})`;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    };

    const animate = () => {
      time++;

      ctx.fillStyle = `rgba(0, 0, 0, ${TRAIL_OPACITY})`;
      ctx.fillRect(0, 0, width, height);

      particles.forEach((p) => {
        updateParticle(p);
        drawParticle(p);
      });

      ctx.shadowBlur = 0;
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      init();
    };

    init();
    animate();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [particleCount]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 w-full h-full overflow-hidden ${className}`}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
      {/* Static fallback for reduced-motion */}
      <div
        className="absolute inset-0 motion-safe:hidden"
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, rgba(212,168,67,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 60%, rgba(168,120,40,0.1) 0%, transparent 50%), #0a0806',
        }}
      />
    </div>
  );
}
