import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div
      className="flex h-screen flex-col items-center justify-center gap-6 bg-base"
    >
      <h1
        className="text-6xl font-black"
        style={{
          background: 'linear-gradient(to right, #e8dcc8, #d4a843)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        404
      </h1>
      <p className="text-text-secondary">This page doesn't exist.</p>
      <div className="flex gap-4">
        <Link
          to="/"
          className="rounded-lg px-6 py-3 font-semibold transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, #d4a843, #a88030)',
            color: '#0a0806',
          }}
        >
          Home
        </Link>
        <Link
          to="/app"
          className="rounded-lg px-6 py-3 font-medium transition-all duration-200"
          style={{
            border: '1px solid rgba(212, 168, 67, 0.15)',
            background: 'rgba(26, 23, 20, 0.6)',
            color: '#a89880',
          }}
        >
          Open Builder
        </Link>
      </div>
    </div>
  );
}
