"use client";

interface UrlInputFormProps {
  url: string;
  setUrl: (url: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function UrlInputForm({ url, setUrl, loading, onSubmit }: UrlInputFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="relative">
        <input
          type="text"
          placeholder="https://example.com/very-long-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all text-lg"
        />
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all duration-300 hover:shadow-cyan-500/30 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
        ) : (
          "Shorten URL"
        )}
      </button>
    </form>
  );
}
