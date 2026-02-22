/**
 * Loading skeleton shown while lazy-loaded views are being fetched.
 * Matches the dark theme of the app with pulsing placeholder shapes.
 */
export default function LoadingSkeleton({ label }: { label?: string }) {
  return (
    <div className="flex-1 flex items-center justify-center bg-slate-950/50 min-h-[400px]" role="status" aria-label={label || 'Loading'}>
      <div className="text-center space-y-4">
        {/* Pulsing rings */}
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 rounded-full border-2 border-cyan-400/30 animate-ping" />
          <div className="absolute inset-2 rounded-full border-2 border-blue-400/40 animate-pulse" />
          <div className="absolute inset-4 rounded-full bg-cyan-400/20 animate-pulse" />
        </div>
        <p className="text-sm text-slate-500 font-mono tracking-wider animate-pulse">
          {label || 'Loading module…'}
        </p>
      </div>
    </div>
  );
}
