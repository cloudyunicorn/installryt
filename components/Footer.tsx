import { Shield, Heart } from "lucide-react";

export default function Footer() {
    return (
        <footer className="mt-20 border-t border-card-border bg-surface px-6 py-10">
            <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-5">
                <div className="flex items-center gap-2">
                    <Shield size={18} className="text-accent-1" />
                    <span className="text-base font-semibold">
                        Install<span className="gradient-text">Ryt</span>
                    </span>
                </div>
                <p className="max-w-[400px] text-center text-[13px] leading-relaxed text-muted">
                    Protecting users from fraudulent apps. Always verify before you install.
                </p>
                <div className="flex items-center gap-1 text-xs text-muted">
                    Made with <Heart size={12} className="text-danger fill-danger" /> by
                    InstallRyt Team
                </div>
            </div>
        </footer>
    );
}
