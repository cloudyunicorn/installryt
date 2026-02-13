import { RiskFlag } from "@/lib/analyzer";
import {
    AlertTriangle,
    AlertCircle,
    Info,
    ShieldAlert,
} from "lucide-react";

interface FlagListProps {
    flags: RiskFlag[];
}

const SEVERITY_CONFIG: Record<
    string,
    { icon: typeof AlertTriangle; color: string; bg: string; label: string }
> = {
    critical: {
        icon: ShieldAlert,
        color: "#ef4444",
        bg: "rgba(239, 68, 68, 0.08)",
        label: "CRITICAL",
    },
    high: {
        icon: AlertTriangle,
        color: "#f97316",
        bg: "rgba(249, 115, 22, 0.08)",
        label: "HIGH",
    },
    medium: {
        icon: AlertCircle,
        color: "#f59e0b",
        bg: "rgba(245, 158, 11, 0.08)",
        label: "MEDIUM",
    },
    low: {
        icon: Info,
        color: "#84cc16",
        bg: "rgba(132, 204, 22, 0.08)",
        label: "LOW",
    },
};

export default function FlagList({ flags }: FlagListProps) {
    if (flags.length === 0) {
        return (
            <div className="glass-card p-8 text-center text-safe">
                <div className="mb-3 text-[40px]">🎉</div>
                <div className="text-lg font-semibold">No Red Flags Found!</div>
                <div className="mt-2 text-sm text-muted">
                    This app passed all our security checks.
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <h3 className="flex items-center gap-2 text-lg font-bold">
                <AlertTriangle size={20} className="text-warning" />
                Red Flags Detected ({flags.length})
            </h3>

            {flags.map((flag, index) => {
                const config = SEVERITY_CONFIG[flag.severity];
                const Icon = config.icon;

                return (
                    <div
                        key={flag.id}
                        className="animate-fade-in rounded-xl p-4"
                        style={{
                            background: config.bg,
                            border: `1px solid ${config.color}20`,
                            animationDelay: `${index * 100}ms`,
                            animationFillMode: "both",
                        }}
                    >
                        <div className="mb-2 flex items-center gap-2.5">
                            <Icon size={18} style={{ color: config.color }} />
                            <span className="flex-1 text-[15px] font-semibold">
                                {flag.label}
                            </span>
                            <span
                                className="rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wide"
                                style={{
                                    color: config.color,
                                    border: `1px solid ${config.color}40`,
                                }}
                            >
                                {config.label}
                            </span>
                        </div>
                        <p className="m-0 pl-7 text-[13px] leading-relaxed text-muted">
                            {flag.description}
                        </p>
                    </div>
                );
            })}
        </div>
    );
}
