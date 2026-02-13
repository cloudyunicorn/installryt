"use client";

import { useState, useEffect, FormEvent } from "react";
import { Search, Loader2, AlertCircle, Smartphone, Layers, AppWindow } from "lucide-react";
import { AnalysisResult } from "@/lib/analyzer";
import { useRouter, useSearchParams } from "next/navigation";

interface AnalyzeFormProps {
    onResult: (result: AnalysisResult) => void;
    onLoading: (loading: boolean) => void;
}

type Mode = "single" | "bulk";
type Store = "google" | "apple";

export default function AnalyzeForm({ onResult, onLoading }: AnalyzeFormProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlParam = searchParams.get("url");

    const [mode, setMode] = useState<Mode>("single");
    const [url, setUrl] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStore, setSelectedStore] = useState<Store>("google");
    const [limit, setLimit] = useState(20);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasAutoAnalyzed, setHasAutoAnalyzed] = useState(false);

    useEffect(() => {
        if (urlParam && !hasAutoAnalyzed) {
            setUrl(urlParam);
            setHasAutoAnalyzed(true);
            // Trigger analysis with the param immediately
            handleSingleAnalysis(urlParam);
        }
    }, [urlParam, hasAutoAnalyzed]);

    const detectStoreFromUrl = (input: string): string | null => {
        if (input.includes("play.google.com")) return "Google Play Store";
        if (input.includes("apps.apple.com")) return "Apple App Store";
        return null;
    };

    const detectedStore = url.trim() ? detectStoreFromUrl(url) : null;

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();

        if (mode === "single") {
            if (!url.trim() || loading) return;
            handleSingleAnalysis();
        } else {
            if (!searchTerm.trim() || loading) return;
            handleBulkScan();
        }
    }

    async function handleSingleAnalysis(overrideUrl?: string) {
        const targetUrl = overrideUrl || url;
        if (!targetUrl.trim()) return;

        setError(null);
        setLoading(true);
        onLoading(true);

        try {
            const response = await fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: targetUrl.trim() }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to analyze the app.");
            }

            onResult(data);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "An unexpected error occurred."
            );
        } finally {
            setLoading(false);
            onLoading(false);
        }
    }

    function handleBulkScan() {
        // Redirect to scan results page
        const params = new URLSearchParams({
            term: searchTerm.trim(),
            store: selectedStore,
            limit: limit.toString(),
        });
        router.push(`/scan?${params.toString()}`);
    }

    return (
        <div className="w-full max-w-[640px]">
            {/* Mode Switcher */}
            <div className="mb-6 flex justify-center">
                <div className="flex gap-1 rounded-full bg-surface-2 p-1 border border-card-border/50">
                    <button
                        type="button"
                        onClick={() => { setMode("single"); setError(null); }}
                        className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all ${mode === "single"
                            ? "bg-accent-1 text-white shadow-lg shadow-accent-1/25"
                            : "text-muted hover:text-foreground"
                            }`}
                    >
                        <Smartphone size={16} />
                        Single App
                    </button>
                    <button
                        type="button"
                        onClick={() => { setMode("bulk"); setError(null); }}
                        className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all ${mode === "bulk"
                            ? "bg-accent-1 text-white shadow-lg shadow-accent-1/25"
                            : "text-muted hover:text-foreground"
                            }`}
                    >
                        <Layers size={16} />
                        Bulk Scan
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                {mode === "single" ? (
                    // Single App Input
                    <div className="relative animate-fade-in">
                        <Search
                            size={18}
                            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted"
                        />
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => {
                                setUrl(e.target.value);
                                setError(null);
                            }}
                            placeholder="Paste an App Store or Play Store URL..."
                            disabled={loading}
                            className="w-full rounded-xl border border-card-border bg-surface py-4 pr-4 pl-11 text-base text-foreground outline-none transition-all duration-300 placeholder:text-muted focus:border-accent-1 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.15)] disabled:opacity-60"
                            style={{
                                paddingRight: detectedStore ? 150 : 16,
                            }}
                        />
                        {detectedStore && (
                            <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 rounded-md bg-accent-1/10 px-2.5 py-1 text-xs font-semibold text-accent-1">
                                {detectedStore}
                            </span>
                        )}
                    </div>
                ) : (
                    // Bulk Scan Input
                    <div className="flex flex-col sm:flex-row gap-3 animate-fade-in">
                        <div className="relative flex-1">
                            <Search
                                size={18}
                                className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted"
                            />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Enter keyword..."
                                className="w-full rounded-xl border border-card-border bg-surface py-4 pr-4 pl-11 text-base text-foreground outline-none transition-all duration-300 placeholder:text-muted focus:border-accent-1 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
                            />
                        </div>
                        <div className="flex gap-3">
                            <select
                                value={selectedStore}
                                onChange={(e) => setSelectedStore(e.target.value as Store)}
                                className="w-full sm:w-[140px] rounded-xl border border-card-border bg-surface px-4 py-3 sm:py-2 text-sm text-foreground outline-none focus:border-accent-1 cursor-pointer"
                            >
                                <option value="google">Google Play</option>
                                <option value="apple">App Store</option>
                            </select>
                            <select
                                value={limit}
                                onChange={(e) => setLimit(Number(e.target.value))}
                                className="w-full sm:w-[100px] rounded-xl border border-card-border bg-surface px-4 py-3 sm:py-2 text-sm text-foreground outline-none focus:border-accent-1 cursor-pointer"
                            >
                                <option value={20}>Top 20</option>
                                <option value={50}>Top 50</option>
                                <option value={100}>Top 100</option>
                            </select>
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={mode === "single" ? !url.trim() || loading : !searchTerm.trim()}
                    className="btn-gradient flex cursor-pointer items-center justify-center gap-2 rounded-xl border-none px-8 py-3.5 text-base font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:hover:translate-y-0"
                >
                    {loading ? (
                        <>
                            <Loader2 size={18} className="animate-spin-slow" />
                            Analyzing...
                        </>
                    ) : (
                        <>
                            {mode === "single" ? <Search size={18} /> : <Layers size={18} />}
                            {mode === "single" ? "Analyze App" : `Scan Top ${limit} Apps`}
                        </>
                    )}
                </button>
            </form>

            {error && (
                <div className="mt-4 flex animate-fade-in items-start gap-2.5 rounded-xl border border-danger/20 bg-danger/[0.08] p-3.5 text-sm text-danger">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}
