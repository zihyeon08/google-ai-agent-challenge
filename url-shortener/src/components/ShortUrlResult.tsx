"use client";

interface ShortUrlResultProps {
  shortUrl: string;
  copied: boolean;
  onCopy: () => void;
}

export function ShortUrlResult({ shortUrl, copied, onCopy }: ShortUrlResultProps) {
  return (
    <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <p className="text-sm text-slate-400 mb-2 font-medium">Your shortened URL is ready:</p>
      <div className="flex items-center gap-2 bg-slate-800/80 p-2 pl-4 rounded-xl border border-slate-700">
        <span className="text-cyan-400 truncate flex-1 font-mono text-sm">
          {shortUrl}
        </span>
        <button
          onClick={onCopy}
          className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 min-w-[80px]"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
