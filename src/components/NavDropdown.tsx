import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Home, BookOpen, Star } from 'lucide-react';

export function NavDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const handleHome = () => {
    sessionStorage.removeItem('vdc-entered');
    navigate('/');
    setOpen(false);
  };

  const handleMcpDocs = () => {
    navigate('/mcp');
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-elevated"
      >
        <img src="/logo.svg" alt="" width="20" height="20" />
        <span
          className="text-sm text-accent"
          style={{ fontWeight: 800, letterSpacing: '-0.5px' }}
        >
          VCompose
        </span>
        <span className="rounded-full border border-accent/30 px-2 py-0.5 text-xs text-accent">
          BETA
        </span>
        <ChevronDown
          size={12}
          className={`text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1 w-48 rounded-lg border border-subtle shadow-xl overflow-hidden"
          style={{
            backgroundColor: 'rgba(30, 27, 24, 0.95)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div className="p-1">
            <button
              onClick={handleHome}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-text-secondary hover:bg-elevated hover:text-text-primary transition-colors"
            >
              <Home size={14} />
              Home
            </button>
            <button
              onClick={handleMcpDocs}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-text-secondary hover:bg-elevated hover:text-text-primary transition-colors"
            >
              <BookOpen size={14} />
              MCP Docs
            </button>
          </div>
          <div className="border-t border-subtle p-1">
            <a
              href="https://github.com/zbrave/vcompose"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-text-muted hover:bg-elevated hover:text-text-secondary transition-colors"
            >
              <Star size={14} />
              Star on GitHub
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
