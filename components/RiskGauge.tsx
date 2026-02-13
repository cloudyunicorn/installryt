"use client";

import { useEffect, useState } from "react";
import { RiskLevel } from "@/lib/analyzer";

interface RiskGaugeProps {
    score: number;
    level: RiskLevel;
    size?: number;
    showLabel?: boolean;
}

const LEVEL_CONFIG: Record<
    RiskLevel,
    { color: string; label: string; emoji: string }
> = {
    safe: { color: "#10b981", label: "Safe", emoji: "✅" },
    low: { color: "#84cc16", label: "Low Risk", emoji: "🟡" },
    medium: { color: "#f59e0b", label: "Medium Risk", emoji: "🟠" },
    high: { color: "#f97316", label: "High Risk", emoji: "🔴" },
    critical: { color: "#ef4444", label: "Critical", emoji: "⛔" },
};

export default function RiskGauge({ score, level, size = 200, showLabel = true }: RiskGaugeProps) {
    const [animatedScore, setAnimatedScore] = useState(0);
    const config = LEVEL_CONFIG[level];

    useEffect(() => {
        const duration = 1500;
        const startTime = performance.now();

        function animate(currentTime: number) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setAnimatedScore(Math.round(eased * score));
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }

        requestAnimationFrame(animate);
    }, [score]);

    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const progress = (animatedScore / 100) * circumference;
    const dashoffset = circumference - progress;



    return (
        <div className="flex flex-col items-center gap-4">
            <div
                className="relative"
                style={{ width: size, height: size }}
            >
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 200 200"
                >
                    <circle
                        cx="100"
                        cy="100"
                        r={radius}
                        fill="none"
                        stroke="var(--surface-2)"
                        strokeWidth="12"
                        transform="rotate(-90 100 100)"
                    />
                    <circle
                        cx="100"
                        cy="100"
                        r={radius}
                        fill="none"
                        stroke={config.color}
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashoffset}
                        className="transition-[stroke-dashoffset] duration-100 ease-out"
                        transform="rotate(-90 100 100)"
                        style={{
                            filter: `drop-shadow(0 0 8px ${config.color}40)`,
                        }}
                    />
                    <text
                        x="100"
                        y="100"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="56"
                        fontWeight="800"
                        fill={config.color}
                        style={{
                            textShadow: `0 0 10px ${config.color}40`
                        }}
                    >
                        {animatedScore}
                    </text>
                </svg>
            </div>

            {showLabel && (
                <div
                    className="flex items-center gap-2 rounded-full px-5 py-2 text-[15px] font-semibold"
                    style={{
                        border: `1px solid ${config.color}40`,
                        background: `${config.color}10`,
                        color: config.color,
                    }}
                >
                    <span>{config.emoji}</span>
                    <span>{config.label}</span>
                </div>
            )}
        </div>
    );
}
