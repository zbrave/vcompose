export function EmptyCanvasOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
      <div className="max-w-md text-center">
        <div className="mb-4 text-4xl">🐳</div>
        <h2 className="mb-2 text-lg font-semibold text-gray-300">
          Start building your compose file
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-gray-500">
          Drag a service from the sidebar and drop it on the canvas. Connect
          services to define dependencies — YAML is generated in real time.
        </p>
        <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-600">
          <span className="rounded-full border border-gray-700 px-3 py-1">
            Drag & drop services
          </span>
          <span className="rounded-full border border-gray-700 px-3 py-1">
            Connect for depends_on
          </span>
          <span className="rounded-full border border-gray-700 px-3 py-1">
            Auto network config
          </span>
          <span className="rounded-full border border-gray-700 px-3 py-1">
            Copy or download YAML
          </span>
        </div>
      </div>
    </div>
  );
}
