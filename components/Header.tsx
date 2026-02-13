"use client";

import { Shield, Github } from "lucide-react";
import Link from "next/link";

export default function Header() {
    return (
        <header className="sticky top-0 z-50 border-b border-card-border bg-background/80 backdrop-blur-xl">
            <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
                <Link href="/?reset=true" className="flex items-center gap-2.5 no-underline">
                    <div className="flex h-9 w-9 items-center justify-center rounded-[10px] btn-gradient">
                        <Shield size={20} color="white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-foreground">
                        Install<span className="gradient-text">Ryt</span>
                    </span>
                </Link>

                <nav className="flex items-center gap-6">
                    <Link
                        href="/?reset=true"
                        className="text-sm font-medium text-muted transition-colors duration-200 hover:text-foreground no-underline"
                    >
                        Home
                    </Link>
                    <a
                        href="https://github.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-muted transition-colors duration-200 hover:text-foreground"
                    >
                        <Github size={20} />
                    </a>
                </nav>
            </div>
        </header>
    );
}
