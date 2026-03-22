import type { LucideIcon } from 'lucide-react';

interface GlassFeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

export function GlassFeatureCard({
  icon: Icon,
  title,
  description,
  className = '',
}: GlassFeatureCardProps) {
  return (
    <div
      className={`group relative rounded-xl p-5 transition-all duration-300 hover:-translate-y-1 ${className}`}
      style={{
        background: 'rgba(26, 23, 20, 0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(212, 168, 67, 0.15)',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = 'rgba(212, 168, 67, 0.5)';
        el.style.boxShadow =
          '0 0 30px rgba(212, 168, 67, 0.15), inset 0 0 30px rgba(212, 168, 67, 0.05)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = 'rgba(212, 168, 67, 0.15)';
        el.style.boxShadow = 'none';
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="shrink-0 rounded-lg p-2"
          style={{
            background:
              'linear-gradient(135deg, rgba(212,168,67,0.2), rgba(212,168,67,0.05))',
          }}
        >
          <Icon size={18} style={{ color: '#d4a843' }} />
        </div>
        <div>
          <h3
            className="font-medium"
            style={{ color: '#e8dcc8' }}
          >
            {title}
          </h3>
          <p
            className="mt-1 text-sm leading-relaxed"
            style={{ color: '#a89880' }}
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
