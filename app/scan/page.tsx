"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AnalysisResult } from "@/lib/analyzer";
import AppInfoCard from "@/components/AppInfoCard";
import RiskGauge from "@/components/RiskGauge";
import { AlertCircle, ArrowLeft, Loader2, ShieldAlert, Sparkles, Search } from "lucide-react";

function ScanContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const term = searchParams.get("term");
    const store = searchParams.get("store");
    const limit = searchParams.get("limit") || "20";

    const [results, setResults] = useState<AnalysisResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<{ count: number; analyzed: number } | null>(null);

    useEffect(() => {
        if (!term || !store) {
            setError("Missing search parameters.");
            setLoading(false);
            return;
        }

        const cacheKey = `installryt_scan_${term}_${store}_${limit}`;

        async function fetchScan() {
            try {
                // Check cache first
                const cached = sessionStorage.getItem(cacheKey);
                if (cached) {
                    try {
                        const parsed = JSON.parse(cached);
                        setResults(parsed.results);
                        setStats({ count: parsed.count, analyzed: parsed.analyzed });
                        setLoading(false);
                        return;
                    } catch (e) {
                        console.warn("Cache parse error", e);
                    }
                }
            } catch (e) {
                console.warn("Cache read error:", e);
            }

            try {
                const res = await fetch("/api/scan", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ term, store, limit: Number(limit) }),
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || "Scan failed.");
                }

                setResults(data.apps);
                setStats({ count: data.count, analyzed: data.analyzed });

                try {
                    sessionStorage.setItem(cacheKey, JSON.stringify({
                        results: data.apps,
                        count: data.count,
                        analyzed: data.analyzed
                    }));
                } catch (e) {
                    console.warn("Cache write error:", e);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Scan failed.");
            } finally {
                setLoading(false);
            }
        }

        fetchScan();
    }, [term, store, limit]);

    const handleAnalyze = (url: string) => {
        router.push(`/?url=${encodeURIComponent(url)}`);
    };

    if (!term || !store) return null;

    return (
        <div className="w-full overflow-x-hidden px-4 py-8 md:px-12 lg:px-24">
            <div className="mx-auto max-w-7xl animate-fade-in">
                {/* Header */}
                <div className="mb-12 flex items-center justify-between">
                    <div>
                        <button
                            onClick={() => router.push("/")}
                            className="mb-4 flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-accent-1"
                        >
                            <ArrowLeft size={16} />
                            Back to Analyze
                        </button>
                        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl break-words">
                            Threat Report: <span className="text-gradient-primary break-all">"{term}"</span>
                        </h1>
                        <p className="mt-2 text-muted">
                            Scanned top results on {store === "google" ? "Google Play" : "App Store"} for potential threats.
                        </p>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 animate-ping rounded-full bg-accent-1/20"></div>
                            <Loader2 size={48} className="animate-spin-slow text-accent-1 relative z-10" />
                        </div>
                        <h3 className="text-xl font-semibold text-white">Scanning App Store...</h3>
                        <p className="mt-2 text-muted max-w-md mx-auto">
                            We're analyzing the top apps for "{term}" against known fraud patterns. This may take up to 20 seconds.
                        </p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="rounded-2xl border border-danger/20 bg-danger/5 p-8 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
                            <AlertCircle size={24} />
                        </div>
                        <h3 className="text-lg font-semibold text-white">Scan Failed</h3>
                        <p className="mt-2 text-muted">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-6 rounded-lg bg-surface-2 px-6 py-2.5 text-sm font-medium text-white hover:bg-surface-3 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Results */}
                {!loading && !error && stats && (
                    <div className="animate-slide-up">
                        {/* Stats Cards */}
                        <div className="mb-10 grid gap-6 md:grid-cols-3">
                            <div className="glass-card rounded-2xl p-6">
                                <div className="text-sm font-medium text-muted">Analyzed Apps</div>
                                <div className="mt-2 text-3xl font-bold text-white">{stats.analyzed}</div>
                            </div>
                            <div className="glass-card rounded-2xl p-6 border-danger/20 bg-danger/[0.03]">
                                <div className="flex items-center gap-2 text-sm font-medium text-danger">
                                    <ShieldAlert size={16} />
                                    High Risk Detected
                                </div>
                                <div className="mt-2 text-3xl font-bold text-danger">{stats.count}</div>
                            </div>
                            <div className="glass-card rounded-2xl p-6">
                                <div className="flex items-center gap-2 text-sm font-medium text-accent-1">
                                    <Sparkles size={16} />
                                    Clean Apps
                                </div>
                                <div className="mt-2 text-3xl font-bold text-white">
                                    {stats.analyzed - stats.count}
                                </div>
                            </div>
                        </div>

                        {(() => {
                            const highRiskApps = results.filter(r => r.riskScore >= 40);
                            const safeApps = results.filter(r => r.riskScore < 40);

                            return (
                                <>
                                    {/* High Risk Section */}
                                    {highRiskApps.length > 0 ? (
                                        <div className="mb-12">
                                            <h2 className="mb-6 text-xl font-bold text-white flex items-center gap-2">
                                                <ShieldAlert className="text-danger" size={24} />
                                                High Risk Threats Detected ({highRiskApps.length})
                                            </h2>
                                            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                                                {highRiskApps.map((result, idx) => (
                                                    <div
                                                        key={`${result.appInfo.url}-${idx}`}
                                                        className="group relative overflow-hidden rounded-2xl border border-card-border bg-surface-2 p-6 transition-all duration-300 hover:border-accent-1/30 hover:shadow-lg hover:shadow-accent-1/5 cursor-pointer"
                                                        onClick={() => handleAnalyze(result.appInfo.url)}
                                                    >
                                                        <div className="mb-6 flex justify-between items-start gap-4">
                                                            <div className="min-w-0 flex-1">
                                                                <AppInfoCard app={result.appInfo} minimal />
                                                            </div>
                                                            <RiskGauge
                                                                score={result.riskScore}
                                                                level={result.riskLevel}
                                                                size={60}
                                                                showLabel={false}
                                                            />
                                                        </div>

                                                        <div className="space-y-3">
                                                            {result.flags.slice(0, 3).map((flag) => (
                                                                <div key={flag.id} className="flex items-start gap-2 text-sm">
                                                                    <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-danger shrink-0" />
                                                                    <span className="text-muted-foreground">{flag.label}</span>
                                                                </div>
                                                            ))}
                                                            {result.flags.length > 3 && (
                                                                <div className="text-xs text-muted pl-3.5">
                                                                    + {result.flags.length - 3} more flags
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="mt-6 pt-6 border-t border-card-border flex gap-3">
                                                            <button
                                                                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-surface-3 py-2.5 text-sm font-medium text-white hover:bg-surface-4 transition-colors"
                                                            >
                                                                <Search size={14} />
                                                                Analyze
                                                            </button>
                                                            <a
                                                                href={result.appInfo.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="flex-1 inline-flex items-center justify-center rounded-lg border border-card-border bg-transparent py-2.5 text-sm font-medium text-muted hover:text-foreground hover:bg-surface-3 transition-colors"
                                                            >
                                                                Store ↗
                                                            </a>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mb-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-card-border bg-surface-1/50 py-16 text-center">
                                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-1/10 text-accent-1">
                                                <Sparkles size={32} />
                                            </div>
                                            <h3 className="text-xl font-bold text-white">No High Risks Found</h3>
                                            <p className="mt-2 max-w-md text-muted">
                                                Great news! We didn't find any high-risk apps in this scan.
                                            </p>
                                        </div>
                                    )}

                                    {/* Safe / Low Risk Apps */}
                                    {safeApps.length > 0 && (
                                        <div>
                                            <h2 className="mb-6 text-xl font-bold text-white flex items-center gap-2">
                                                <Sparkles className="text-accent-1" size={24} />
                                                Other Analyzed Apps ({safeApps.length})
                                            </h2>
                                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                                {safeApps.map((result, idx) => (
                                                    <div
                                                        key={`${result.appInfo.url}-${idx}`}
                                                        className="overflow-hidden flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-0 rounded-xl border border-card-border bg-surface-1 p-4 transition-colors hover:bg-surface-2 cursor-pointer"
                                                        onClick={() => handleAnalyze(result.appInfo.url)}
                                                    >
                                                        <div className="flex-1 w-full min-w-0">
                                                            <AppInfoCard app={result.appInfo} minimal />
                                                        </div>
                                                        <div className="shrink-0 sm:ml-4">
                                                            <span className={`inline-flex items-center whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${result.riskScore < 20
                                                                ? "bg-green-400/10 text-green-400 ring-green-400/20"
                                                                : "bg-yellow-400/10 text-yellow-400 ring-yellow-400/20"
                                                                }`}>
                                                                {result.riskScore} / 100
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ScanPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-background text-accent-1">
                <Loader2 size={32} className="animate-spin" />
            </div>
        }>
            <ScanContent />
        </Suspense>
    );
}
