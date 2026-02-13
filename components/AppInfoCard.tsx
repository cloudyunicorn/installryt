import { AppData } from "@/lib/analyzer";
import { Star, Download, User, Globe, Tag } from "lucide-react";

interface AppInfoCardProps {
    app: AppData;
    minimal?: boolean;
}

export default function AppInfoCard({ app, minimal = false }: AppInfoCardProps) {
    if (minimal) {
        return (
            <div className="flex items-start gap-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[14px] border border-card-border bg-surface-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={app.icon}
                        alt={app.title}
                        className="h-full w-full object-cover"
                    />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold text-white" title={app.title}>
                        {app.title}
                    </h3>
                    <div className="text-xs text-muted truncate">{app.developer}</div>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
                        {typeof app.score === "number" && (
                            <div className="flex items-center gap-1">
                                <Star size={12} className="text-warning fill-warning" />
                                <span className="font-medium text-foreground">{app.score.toFixed(1)}</span>
                            </div>
                        )}
                        {app.installs && (
                            <div className="flex items-center gap-1">
                                <Download size={12} />
                                <span>{app.installs}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-card p-6">
            <div className="flex flex-wrap items-start gap-5">
                {/* App Icon */}
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[18px] border border-card-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={app.icon}
                        alt={app.title}
                        className="h-full w-full object-cover"
                    />
                </div>
                <div className="min-w-[200px] flex-1">
                    <h2 className="mb-1 text-[22px] font-bold tracking-tight">
                        {app.title}
                    </h2>

                    <div className="mb-3 flex items-center gap-1.5 text-sm text-muted">
                        <User size={14} />
                        <span>{app.developer}</span>
                    </div>

                    {/* Stats Row */}
                    <div className="flex flex-wrap gap-4 text-[13px]">
                        {typeof app.score === "number" && (
                            <div className="flex items-center gap-1.5">
                                <Star size={14} className="text-warning fill-warning" />
                                <span className="font-semibold">{app.score.toFixed(1)}</span>
                                {app.ratings > 0 && (
                                    <span className="text-muted">
                                        ({app.ratings.toLocaleString()} {app.store === "apple" && app.ratings === app.reviews ? "reviews" : "ratings"})
                                    </span>
                                )}
                            </div>
                        )}

                        {app.store === "google" && app.reviews > 0 && (
                            <div className="flex items-center gap-1.5 text-muted">
                                <User size={14} />
                                <span>{app.reviews.toLocaleString()} reviews</span>
                            </div>
                        )}

                        {app.installs && (
                            <div className="flex items-center gap-1.5 text-muted">
                                <Download size={14} />
                                <span>{app.installs}</span>
                            </div>
                        )}

                        {(app.genre || app.primaryGenre) && (
                            <div className="flex items-center gap-1.5 text-muted">
                                <Tag size={14} />
                                <span>{app.genre || app.primaryGenre}</span>
                            </div>
                        )}

                        <div className="flex items-center gap-1.5 text-muted">
                            <Globe size={14} />
                            <span>
                                {app.store === "google" ? "Google Play" : "App Store"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Details */}
            <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3 border-t border-card-border pt-4 text-[13px]">
                {app.version && <DetailItem label="Version" value={app.version} />}
                {app.contentRating && (
                    <DetailItem label="Content Rating" value={app.contentRating} />
                )}
                <DetailItem label="Price" value={app.free ? "Free" : `$${app.price}`} />
                {app.developerWebsite && (
                    <DetailItem label="Developer Website" value="Available ✓" positive />
                )}
                {!app.developerWebsite && app.store === "google" && (
                    <DetailItem
                        label="Developer Website"
                        value="Not provided ✗"
                        negative
                    />
                )}
                <DetailItem
                    label="Privacy Policy"
                    value={
                        app.privacyPolicy
                            ? "Available ✓"
                            : app.store === "apple"
                                ? "Not shared by Apple ℹ"
                                : "Not provided ✗"
                    }
                    positive={!!app.privacyPolicy}
                    negative={!app.privacyPolicy && app.store === "google"}
                />
            </div>
        </div>
    );
}

function DetailItem({
    label,
    value,
    positive,
    negative,
}: {
    label: string;
    value: string;
    positive?: boolean;
    negative?: boolean;
}) {
    const colorClass = positive
        ? "text-safe"
        : negative
            ? "text-danger"
            : "text-foreground";

    return (
        <div>
            <div className="mb-0.5 text-muted">{label}</div>
            <div className={`font-medium ${colorClass}`}>{value}</div>
        </div>
    );
}
