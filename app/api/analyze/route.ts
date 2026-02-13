import { NextRequest, NextResponse } from "next/server";
import { analyzeApp, AppData } from "@/lib/analyzer";

// Dynamic import for CommonJS modules
async function getGPlayScraper() {
    const gplay = await import("google-play-scraper");
    return gplay.default || gplay;
}

async function getAppStoreScraper() {
    const store = await import("app-store-scraper");
    return store.default || store;
}

// ─── URL Parsing ─────────────────────────────────────────────────────────────

type StoreType = "google" | "apple" | null;

function detectStore(url: string): StoreType {
    if (url.includes("play.google.com")) return "google";
    if (url.includes("apps.apple.com")) return "apple";
    return null;
}

function extractGoogleAppId(url: string): string | null {
    try {
        const parsed = new URL(url);
        return parsed.searchParams.get("id");
    } catch {
        return null;
    }
}

function extractAppleAppId(url: string): { id: number; country: string } | null {
    try {
        // Pattern: https://apps.apple.com/{country}/app/{app-name}/id{numeric_id}
        const match = url.match(
            /apps\.apple\.com\/(\w{2})\/app\/[^/]+\/id(\d+)/
        );
        if (match) {
            return { country: match[1], id: parseInt(match[2], 10) };
        }
        // Fallback: just find the id
        const idMatch = url.match(/id(\d+)/);
        if (idMatch) {
            return { country: "us", id: parseInt(idMatch[1], 10) };
        }
        return null;
    } catch {
        return null;
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function safeDate(value: unknown): string {
    if (!value) return new Date().toISOString();
    if (typeof value === "string") return value;
    try {
        const d = new Date(value as any);
        if (isNaN(d.getTime())) return new Date().toISOString();
        return d.toISOString();
    } catch {
        return new Date().toISOString();
    }
}

function safeReview(r: any) {
    return {
        id: String(r.id || ""),
        userName: r.userName || r.name || "Anonymous",
        userImage: r.userImage || undefined,
        score: Number(r.score || r.rating || 0),
        title: r.title || "",
        text: r.text || r.body || "",
        date: safeDate(r.date || r.updated),
        url: r.url || "",
        version: r.version ?? null,
    };
}

// ─── Scraping ────────────────────────────────────────────────────────────────

interface GooglePlayResult {
    title: string;
    description: string;
    summary: string;
    developer: string;
    developerId: string;
    icon: string;
    score: number;
    ratings: number;
    reviews: number;
    installs: string;
    minInstalls: number;
    maxInstalls: number;
    price: number;
    free: boolean;
    genre: string;
    genreId: string;
    url: string;
    released: string;
    updated: number;
    version: string;
    privacyPolicy: string;
    developerWebsite: string;
    developerEmail: string;
    contentRating: string;
    adSupported: boolean;
    offersIAP: boolean;
    screenshots: string[];
}

interface AppleStoreResult {
    title: string;
    description: string;
    developer: string;
    developerId: number;
    icon: string;
    score: number;
    ratings: number;
    reviews: number;
    price: number;
    free: boolean;
    primaryGenre: string;
    primaryGenreId: number;
    url: string;
    released: string;
    updated: string;
    version: string;
    currentVersionScore: number;
    screenshots: string[];
    privacyPolicyUrl?: string;
}

async function scrapeGooglePlay(appId: string): Promise<AppData> {
    const gplay = await getGPlayScraper();
    const [data, permissions, reviewsData] = await Promise.all([
        gplay.app({ appId }),
        gplay.permissions({ appId }).catch(() => []),
        gplay.reviews({ appId, sort: gplay.sort.NEWEST, num: 5 }).catch(() => ({ data: [] })),
    ]);

    console.log("\n═══ RAW GOOGLE PLAY DATA ═══");
    console.log("Title:", data.title, "| Score:", data.score, "| Ratings:", data.ratings, "| Reviews:", data.reviews);

    const rawReviews = Array.isArray(reviewsData?.data) ? reviewsData.data : [];

    const mapped: AppData = {
        title: data.title,
        description: data.description,
        summary: data.summary,
        developer: data.developer,
        developerId: data.developerId,
        icon: data.icon,
        score: data.score,
        ratings: data.ratings,
        reviews: data.reviews,
        installs: data.installs,
        minInstalls: data.minInstalls,
        maxInstalls: data.maxInstalls,
        price: data.price,
        free: data.free,
        genre: data.genre,
        genreId: data.genreId,
        url: data.url,
        released: data.released,
        updated: data.updated,
        version: data.version,
        privacyPolicy: data.privacyPolicy,
        developerWebsite: data.developerWebsite,
        developerEmail: data.developerEmail,
        contentRating: data.contentRating,
        adSupported: data.adSupported,
        offersIAP: data.offersIAP,
        store: "google",
        screenshots: data.screenshots,
        permissions: Array.isArray(permissions)
            ? permissions.map((p: any) => ({
                permission: p.permission || String(p),
                type: p.type || "Other",
            }))
            : [],
        reviewsList: rawReviews.slice(0, 5).map(safeReview),
    };
    console.log("═══ MAPPED: permissions:", mapped.permissions?.length, "| reviews:", mapped.reviewsList?.length);
    return mapped;
}

async function scrapeAppleStore(
    id: number,
    country: string
): Promise<AppData> {
    const store = await getAppStoreScraper();
    const [data, rawReviews] = await Promise.all([
        store.app({ id, country }),
        store.reviews({ id, country, sort: store.sort.RECENT, page: 1 }).catch(() => []),
    ]);

    console.log("\n═══ RAW APPLE STORE DATA ═══");
    console.log("Title:", data.title, "| Score:", data.score, "| Ratings:", data.ratings, "| Reviews:", data.reviews);

    const reviewsArr = Array.isArray(rawReviews) ? rawReviews : [];

    // Apple scraper often returns 0 for `ratings` — use the larger of ratings/reviews
    const bestRatingCount = Math.max(data.ratings || 0, data.reviews || 0);

    const mapped: AppData = {
        title: data.title,
        description: data.description,
        developer: data.developer,
        developerId: String(data.developerId),
        icon: data.icon,
        score: data.score,
        ratings: bestRatingCount,
        reviews: data.reviews || 0,
        price: data.price,
        free: data.free,
        primaryGenre: data.primaryGenre,
        url: data.url,
        released: data.released,
        updated: data.updated,
        version: data.version,
        currentVersionScore: data.currentVersionScore,
        store: "apple",
        screenshots: data.screenshots,
        privacyPolicy: data.privacyPolicyUrl,
        reviewsList: reviewsArr.slice(0, 5).map(safeReview),
    };
    console.log("═══ MAPPED: ratings:", mapped.ratings, "| reviews:", mapped.reviewsList?.length);
    return mapped;
}

// ─── Route Handler ───────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { url } = body;

        if (!url || typeof url !== "string") {
            return NextResponse.json(
                { error: "Please provide a valid app store URL." },
                { status: 400 }
            );
        }

        const store = detectStore(url);
        if (!store) {
            return NextResponse.json(
                {
                    error:
                        "Invalid URL. Please provide a link from the Google Play Store or Apple App Store.",
                },
                { status: 400 }
            );
        }

        let appData: AppData;

        if (store === "google") {
            const appId = extractGoogleAppId(url);
            if (!appId) {
                return NextResponse.json(
                    { error: "Could not extract app ID from the Google Play URL." },
                    { status: 400 }
                );
            }
            appData = await scrapeGooglePlay(appId);
        } else {
            const parsed = extractAppleAppId(url);
            if (!parsed) {
                return NextResponse.json(
                    { error: "Could not extract app ID from the Apple App Store URL." },
                    { status: 400 }
                );
            }
            appData = await scrapeAppleStore(parsed.id, parsed.country);
        }

        const result = analyzeApp(appData);
        console.log("\n═══ ANALYSIS RESULT ═══");
        console.log(JSON.stringify(result, null, 2));
        return NextResponse.json(result);
    } catch (error) {
        console.error("Analysis error:", error);
        const message =
            error instanceof Error ? error.message : "An unexpected error occurred";
        return NextResponse.json(
            {
                error: `Failed to analyze the app. ${message}. The app may have been removed or the URL may be incorrect.`,
            },
            { status: 500 }
        );
    }
}
