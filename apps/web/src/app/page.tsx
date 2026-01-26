import Link from "next/link";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8 relative">
      {/* Background Gradient Animation */}
      <div className="absolute inset-0 -z-10 bg-linear-to-br from-primary/20 via-background to-secondary/20 animate-pulse" />

      <div className="text-center space-y-4 z-10">
        <h1 className="text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-linear-to-r from-primary to-secondary drop-shadow-sm">
          NOTATER
        </h1>
        <p className="text-xl text-foreground/60 font-medium max-w-md mx-auto">
          Capture your sound. Anywhere. Instantly.
        </p>
      </div>

      <div className="flex gap-4 z-10 text-center">
        <Link
          href="/studio"
          className="px-8 py-4 bg-primary text-primary-foreground font-bold rounded-full text-lg hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-primary/25"
        >
          Open Studio
        </Link>
        <button className="px-8 py-4 bg-surface text-foreground font-bold rounded-full text-lg hover:bg-surface-hover transition-colors border border-border">
          Load Project
        </button>
      </div>

      <div className="absolute bottom-8 text-sm text-foreground/40 font-mono">
        v0.1.0 • Offline Ready
      </div>
    </div>
  );
}
