"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Shield,
  Scan,
  Zap,
  ChevronRight,
  Search,
  BarChart3,
  Bug,
  ArrowDown,
  Sparkles,
} from "lucide-react";
import AnalyzeForm from "@/components/AnalyzeForm";
import RiskGauge from "@/components/RiskGauge";
import AppInfoCard from "@/components/AppInfoCard";
import FlagList from "@/components/FlagList";
import { AnalysisResult } from "@/lib/analyzer";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    if (searchParams.get("reset")) {
      setResult(null);
      setLoading(false);
      setResetKey((prev) => prev + 1);
      router.replace("/");
    }
  }, [searchParams, router]);

  return (
    <div>
      {/* ─── Hero Section ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pt-20 pb-15 text-center">
        {/* Background glows */}
        <div className="hero-glow top-[-100px] left-[20%] bg-accent-1" />
        <div className="hero-glow top-[-50px] right-[15%] bg-accent-3" />

        <div className="relative z-10 mx-auto max-w-[800px]">
          {/* Badge */}
          <div className="mb-7 inline-flex animate-fade-in items-center gap-1.5 rounded-full border border-card-border bg-card-bg px-4 py-1.5 text-[13px] font-medium text-accent-1">
            <Sparkles size={14} />
            Free • No Sign-up Required
          </div>

          {/* Title */}
          <h1 className="mb-5 animate-slide-up text-[clamp(36px,6vw,64px)] font-extrabold leading-[1.1] tracking-tight">
            Is That App{" "}
            <span className="gradient-text">Safe to Install?</span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mb-10 max-w-[560px] animate-slide-up text-[clamp(16px,2.5vw,20px)] leading-relaxed text-muted [animation-delay:100ms] [animation-fill-mode:both]">
            Paste any Google Play or App Store link and we&apos;ll instantly
            analyze it for fraud signals, fake reviews, and security risks.
          </p>

          {/* Analyze Form */}
          <div className="flex animate-slide-up justify-center [animation-delay:200ms] [animation-fill-mode:both]">
            <AnalyzeForm key={resetKey} onResult={setResult} onLoading={setLoading} />
          </div>
        </div>

        {/* Scroll indicator */}
        {!result && !loading && (
          <div className="mt-12 flex animate-float flex-col items-center gap-1.5 text-xs text-muted">
            <span>Learn more</span>
            <ArrowDown size={16} />
          </div>
        )}
      </section>

      {/* ─── Loading State ────────────────────────────────────────── */}
      {loading && (
        <section className="mx-auto max-w-[700px] px-6 py-10">
          <div className="glass-card p-10 text-center">
            <div className="mx-auto mb-5 h-15 w-15 rounded-full border-3 border-surface-2 border-t-accent-1 animate-spin-slow" />
            <h3 className="mb-2 text-xl font-semibold">Analyzing App...</h3>
            <p className="text-sm text-muted">
              Scraping app data and running security checks
            </p>

            <div className="mt-6 flex flex-col gap-2">
              {[
                "Fetching app metadata",
                "Checking developer profile",
                "Analyzing ratings & reviews",
                "Scanning for red flags",
              ].map((step, i) => (
                <div
                  key={step}
                  className="flex animate-fade-in items-center gap-2.5 rounded-lg bg-surface p-2 text-[13px] text-muted"
                  style={{
                    animationDelay: `${i * 400}ms`,
                    animationFillMode: "both",
                  }}
                >
                  <div className="animate-shimmer-bg h-4 w-4 shrink-0 rounded" />
                  {step}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Results Section ──────────────────────────────────────── */}
      {result && !loading && (
        <section className="mx-auto animate-fade-in max-w-[800px] px-6 pt-5 pb-15">
          {/* Risk Gauge */}
          <div className="mb-8 flex justify-center">
            <RiskGauge score={result.riskScore} level={result.riskLevel} />
          </div>

          {/* App Info */}
          <div className="mb-6">
            <AppInfoCard app={result.appInfo} />
          </div>

          {/* Recommendation */}
          <div className="glass-card mb-6 p-5">
            <h3 className="mb-2 flex items-center gap-2 text-base font-bold">
              <Shield size={18} className="text-accent-1" />
              Our Recommendation
            </h3>
            <p className="m-0 text-sm leading-[1.7] text-muted">
              {result.recommendation}
            </p>
          </div>

          {/* Flags */}
          <FlagList flags={result.flags} />

          {/* Analyze Another */}
          <div className="mt-10 text-center">
            <button
              className="btn-gradient inline-flex cursor-pointer items-center gap-2 rounded-xl border-none px-8 py-3.5 text-base font-semibold text-white transition-all duration-300 hover:-translate-y-0.5"
              onClick={() => {
                setResult(null);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <Search size={18} />
              Analyze Another App
            </button>
          </div>
        </section>
      )}

      {/* ─── Features & How It Works (when no result) ─────────── */}
      {!result && !loading && (
        <>
          {/* Feature Cards */}
          <section className="mx-auto max-w-[1100px] px-6 py-15">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
              <FeatureCard
                icon={<Scan size={24} />}
                title="Real-time Scanning"
                description="We scrape live data directly from the App Store and Play Store. No cached or outdated information."
                delay={0}
              />
              <FeatureCard
                icon={<BarChart3 size={24} />}
                title="Deep Analysis"
                description="11+ heuristic checks analyzing ratings, reviews, developer trust, permissions, and more."
                delay={100}
              />
              <FeatureCard
                icon={<Bug size={24} />}
                title="Fraud Detection"
                description="Identifies fake installs, clone apps, suspicious keywords, missing privacy policies, and other red flags."
                delay={200}
              />
            </div>
          </section>

          {/* How It Works */}
          <section className="mx-auto max-w-[900px] px-6 py-15">
            <h2 className="mb-12 text-center text-[32px] font-extrabold tracking-tight">
              How It <span className="gradient-text-alt">Works</span>
            </h2>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <StepCard
                step="1"
                title="Paste Link"
                description="Copy the app URL from Play Store or App Store"
              />
              <ChevronRight size={24} className="shrink-0 text-muted" />
              <StepCard
                step="2"
                title="We Analyze"
                description="Our engine scrapes & runs 11+ security checks"
              />
              <ChevronRight size={24} className="shrink-0 text-muted" />
              <StepCard
                step="3"
                title="Get Results"
                description="View risk score, red flags, and our recommendation"
              />
            </div>
          </section>

          {/* Stats */}
          <section className="mx-auto max-w-[700px] px-6 py-15 text-center">
            <div className="glass-card grid grid-cols-3 gap-5 px-6 py-10">
              <StatItem value="11+" label="Security Checks" />
              <StatItem value="2" label="Stores Supported" />
              <StatItem value="Free" label="Always" />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function FeatureCard({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <div
      className="glass-card animate-slide-up p-7"
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
      }}
    >
      <div className="feature-icon-bg mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-accent-1">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-bold tracking-tight">{title}</h3>
      <p className="m-0 text-sm leading-relaxed text-muted">{description}</p>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="glass-card w-[200px] shrink-0 p-6 text-center">
      <div className="gradient-text mb-2 text-[28px] font-extrabold">
        {step}
      </div>
      <h4 className="mb-1.5 text-base font-bold">{title}</h4>
      <p className="m-0 text-[13px] leading-snug text-muted">{description}</p>
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="gradient-text text-[32px] font-extrabold leading-tight">
        {value}
      </div>
      <div className="mt-1 text-[13px] font-medium text-muted">{label}</div>
    </div>
  );
}
