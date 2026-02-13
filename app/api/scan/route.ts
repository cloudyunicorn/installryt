import { NextRequest, NextResponse } from "next/server";
import { analyzeApp, AppData, AnalysisResult } from "@/lib/analyzer";

// Dynamic import for CommonJS modules
async function getGPlayScraper() {
    const gplay = await import("google-play-scraper");
    return gplay.default || gplay;
}

async function getAppStoreScraper() {
    const store = await import("app-store-scraper");
    return store.default || store;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function processInChunks<T, R>(
    items: T[],
    chunkSize: number,
    iterator: (item: T) => Promise<R>
): Promise<R[]> {
    const results: R[] = [];
    for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        const chunkResults = await Promise.all(chunk.map(iterator));
        results.push(...chunkResults);
    }
    return results;
}

// ... existing helper functions (safeDate, safeReview) ...

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

// ─── Scraping Logic ──────────────────────────────────────────────────────────

async function searchAndAnalyzeGoogle(term: string, limit: number): Promise<AnalysisResult[]> {
    const gplay = await getGPlayScraper();

    // 1. Search for top N apps
    const searchResults = await gplay.search({ term, num: limit });

    console.log(`[Google] Found ${searchResults.length} apps for term: "${term}"`);

    // 2. Fetch details in chunks to avoid rate limits
    const detailedResults = await processInChunks(searchResults, 8, async (app: any) => {
        try {
            // Fetch full details
            const data = await gplay.app({ appId: app.appId });

            // Construct AppData
            const appData: AppData = {
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
                permissions: [], // Skip permissions for bulk scan speed
                reviewsList: [], // Skip reviews for bulk scan speed
            };

            return analyzeApp(appData);
        } catch (error) {
            console.error(`Error analyzing Google app ${app.appId}:`, error);
            return null;
        }
    });

    return detailedResults.filter((r): r is AnalysisResult => r !== null);
}

async function searchAndAnalyzeApple(term: string, limit: number): Promise<AnalysisResult[]> {
    const store = await getAppStoreScraper();

    // 1. Search for top N apps
    const searchResults = await store.search({ term, num: limit });

    console.log(`[Apple] Found ${searchResults.length} apps for term: "${term}"`);

    // 2. Fetch details in chunks
    const detailedResults = await processInChunks(searchResults, 8, async (app: any) => {
        try {
            const data = await store.app({ id: app.id, country: "us" });

            // Apple scraper weirdness: ratings/reviews mapping
            const bestRatingCount = Math.max(data.ratings || 0, data.reviews || 0);

            const appData: AppData = {
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
                reviewsList: [], // Skip for speed
            };

            return analyzeApp(appData);
        } catch (error) {
            console.error(`Error analyzing Apple app ${app.id}:`, error);
            return null;
        }
    });

    return detailedResults.filter((r): r is AnalysisResult => r !== null);
}

// ─── Route Handler ───────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { term, store, limit = 20 } = body; // Default limit 20

        if (!term || typeof term !== "string") {
            return NextResponse.json(
                { error: "Please provide a valid search term." },
                { status: 400 }
            );
        }

        if (store !== "google" && store !== "apple") {
            return NextResponse.json(
                { error: "Invalid store type. Must be 'google' or 'apple'." },
                { status: 400 }
            );
        }

        // Validate max limit
        const scanLimit = Math.min(Math.max(Number(limit), 1), 100);

        let results: AnalysisResult[] = [];

        if (store === "google") {
            results = await searchAndAnalyzeGoogle(term, scanLimit);
        } else {
            results = await searchAndAnalyzeApple(term, scanLimit);
        }

        // Sort by risk score descending (highest risk first)
        results.sort((a, b) => b.riskScore - a.riskScore);

        // User asked to show ALL apps, so we return everything.
        // We can still calculate the count of flagged apps for the stats.
        const flaggedCount = results.filter(r => r.riskScore >= 40).length;

        return NextResponse.json({
            term,
            count: flaggedCount, // maintain the 'count' field as 'flagged count' for UI compatibility
            analyzed: results.length,
            apps: results // Return ALL results
        });

    } catch (error) {
        console.error("Bulk scan error:", error);
        return NextResponse.json(
            { error: "Failed to perform bulk scan." },
            { status: 500 }
        );
    }
}
