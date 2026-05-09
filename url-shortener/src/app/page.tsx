"use client";

import { useState } from "react";
import { UrlInputForm } from "../components/UrlInputForm";
import { ShortUrlResult } from "../components/ShortUrlResult";

export default function Home() {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setShortUrl("");
    setCopied(false);
    
    if (!url) {
      setError("Please enter a URL");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalUrl: url }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to shorten URL");
      } else {
        setShortUrl(data.shortUrl);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 p-4 font-sans">
      <div className="w-full max-w-lg bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/10 transition-all duration-300 hover:shadow-cyan-500/10 hover:border-white/20">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2 text-center tracking-tight">
          Antigravity Links
        </h1>
        <p className="text-slate-300 text-center mb-8 text-sm">
          Shorten your long URLs with lightning speed.
        </p>

        <UrlInputForm 
          url={url} 
          setUrl={setUrl} 
          loading={loading} 
          onSubmit={handleSubmit} 
        />

        {error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400 text-center text-sm font-medium">{error}</p>
          </div>
        )}

        {shortUrl && (
          <ShortUrlResult 
            shortUrl={shortUrl} 
            copied={copied} 
            onCopy={copyToClipboard} 
          />
        )}
      </div>
    </main>
  );
}
