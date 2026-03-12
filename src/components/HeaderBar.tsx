export function HeaderBar() {
  return (
    <header className="flex h-10 items-center justify-between border-b border-gray-800 bg-gray-900 px-4">
      <div className="flex items-center gap-2">
        <svg
          width="20"
          height="20"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="8" y="16" width="48" height="36" rx="4" fill="#2563eb" />
          <rect x="14" y="22" width="10" height="8" rx="1.5" fill="#93c5fd" />
          <rect x="27" y="22" width="10" height="8" rx="1.5" fill="#93c5fd" />
          <rect x="40" y="22" width="10" height="8" rx="1.5" fill="#93c5fd" />
          <rect x="14" y="34" width="10" height="8" rx="1.5" fill="#60a5fa" />
          <rect x="27" y="34" width="10" height="8" rx="1.5" fill="#60a5fa" />
          <rect x="40" y="34" width="10" height="8" rx="1.5" fill="#60a5fa" />
        </svg>
        <span className="text-sm font-semibold text-gray-200">VCompose</span>
        <span className="text-xs text-gray-600">beta</span>
      </div>
      <div className="flex items-center gap-3">
        <a
          href="https://github.com/zbrave/vcompose"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-md border border-gray-700 px-2.5 py-1 text-xs text-gray-400 transition-colors hover:border-gray-500 hover:text-gray-200"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          GitHub
        </a>
      </div>
    </header>
  );
}
