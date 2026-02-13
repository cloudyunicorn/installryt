// ─── Types ───────────────────────────────────────────────────────────────────

export interface AppData {
    title: string;
    description: string;
    summary?: string;
    developer: string;
    developerId?: string;
    icon: string;
    score: number | null;
    ratings: number;
    reviews: number;
    installs?: string;
    minInstalls?: number;
    maxInstalls?: number;
    price: number;
    free: boolean;
    genre?: string;
    genreId?: string;
    url: string;
    released?: string;
    updated?: number | string;
    version?: string;
    privacyPolicy?: string;
    developerWebsite?: string;
    developerEmail?: string;
    contentRating?: string;
    adSupported?: boolean;
    offersIAP?: boolean;
    store: "google" | "apple";
    // Apple-specific
    primaryGenre?: string;
    currentVersionScore?: number;
    // Additional
    screenshots?: string[];
    permissions?: Array<{ permission: string; type: string; description?: string }>;
    reviewsList?: Array<{
        id: string;
        userName: string;
        userImage?: string;
        score: number;
        title?: string;
        text: string;
        date: string;
        url?: string;
        version?: string | null;
    }>;
    // Developer reputation (populated when available)
    developerAppCount?: number;
    developerAvgRating?: number;
    developerAccountAgeDays?: number;
    // Review text for fraud analysis
    reviewsText?: string[];
}

export interface RiskFlag {
    id: string;
    label: string;
    description: string;
    severity: "low" | "medium" | "high" | "critical";
    points: number;
}

export type RiskLevel = "safe" | "low" | "medium" | "high" | "critical";

export interface AnalysisResult {
    appInfo: AppData;
    riskScore: number;
    riskLevel: RiskLevel;
    flags: RiskFlag[];
    recommendation: string;
    analyzedAt: string;
}

// ─── Suspicious Keywords ─────────────────────────────────────────────────────

const SUSPICIOUS_KEYWORDS = [
    "free hack",
    "mod apk",
    "unlimited coins",
    "unlimited gems",
    "free robux",
    "generator",
    "cheat",
    "cracked",
    "premium free",
    "pro free",
    "paid free",
    "free diamonds",
    "unlimited money",
    "get free",
    "no root",
    "free fire hack",
];

// ─── Brand Impersonation Constants ───────────────────────────────────────────

const TRUSTED_BRANDS: Array<{ name: string; developer: string }> = [
    { name: "whatsapp", developer: "whatsapp" },
    { name: "google pay", developer: "google" },
    { name: "gpay", developer: "google" },
    { name: "paytm", developer: "paytm" },
    { name: "phonepe", developer: "phonepe" },
    { name: "amazon", developer: "amazon" },
    { name: "facebook", developer: "meta" },
    { name: "instagram", developer: "meta" },
    { name: "telegram", developer: "telegram" },
    { name: "spotify", developer: "spotify" },
    { name: "netflix", developer: "netflix" },
];

const IMPERSONATION_KEYWORDS: string[] = [
    "plus",
    "pro",
    "premium",
    "mod",
    "hack",
    "free",
    "unlocked",
];

// Keywords indicating a legitimate companion/utility app (not impersonation)
const LEGITIMATE_COMPANION_KEYWORDS: string[] = [
    "saver",
    "downloader",
    "download",
    "repost",
    "sticker",
    "stickers",
    "theme",
    "themes",
    "wallpaper",
    "wallpapers",
    "guide",
    "tutorial",
    "tips",
    "cleaner",
    "backup",
    "recovery",
    "tracker",
    "status",
    "widget",
    "fonts",
    "keyboard",
    "scanner",
    "reader",
    "manager",
    "companion",
    "helper",
    "tool",
    "tools",
    "analytics",
    "insights",
    "viewer",
    "editor",
    "maker",
    "creator",
    "converter",
    "splitter",
    "scheduler",
    "reminder",
    "notifier",
    "chat",
    "dual",
    "clone",
    "web",
    "lite",
    "for business",
    "business",
    "trading",
    "trade",
    "invest",
    "pay",
    "money",
    "send",
    "transfer",
];

// ─── Loan Fraud Constants ────────────────────────────────────────────────────

const LOAN_FRAUD_KEYWORDS: string[] = [
    "instant loan",
    "quick loan",
    "cash loan",
    "loan fast",
    "loan in minutes",
    "loan without pan",
    "loan without documents",
    "personal loan fast",
    "get loan instantly",
    "easy loan",
    "loan app",
    "money loan fast",
];

// ─── Fraud Review Constants ──────────────────────────────────────────────────

const FRAUD_REVIEW_KEYWORDS: string[] = [
    "scam",
    "fraud",
    "blackmail",
    "stole my data",
    "hacked",
    "fake app",
    "threat",
    "abuse",
    "harassment",
];

// ─── Analysis Functions ──────────────────────────────────────────────────────

function checkLowRating(app: AppData): RiskFlag | null {
    if (app.score !== null && app.score < 3.0) {
        return {
            id: "low_rating",
            label: "Very Low Rating",
            description: `The app has a rating of ${app.score.toFixed(1)}/5.0, which is significantly below average. Legitimate apps typically maintain ratings above 3.5.`,
            severity: app.score < 2.0 ? "high" : "medium",
            points: app.score < 2.0 ? 20 : 15,
        };
    }
    return null;
}

function checkFewReviews(app: AppData): RiskFlag | null {
    if (app.store === "google" && app.minInstalls) {
        // Use ratings instead of reviews as reviews might be capped/fetched partially
        const ratio = app.ratings / app.minInstalls;
        if (app.minInstalls > 10000 && ratio < 0.01) { // 1% engagement is a reasonable minimum for popular apps
            return {
                id: "few_ratings",
                label: "Suspiciously Few Ratings",
                description: `With ${app.installs || app.minInstalls.toLocaleString()} installs but only ${app.ratings.toLocaleString()} ratings, the engagement ratio is unusually low (<1%). This may indicate fake or incentivized installs.`,
                severity: "medium",
                points: 10,
            };
        }
    }
    if (app.ratings < 10 && app.score !== null) {
        return {
            id: "very_few_ratings",
            label: "Very Few Ratings",
            description: `The app has only ${app.ratings} ratings, making it difficult to assess its actual quality. Be cautious with apps that have very few user reviews.`,
            severity: "low",
            points: 5,
        };
    }
    return null;
}

function checkNewApp(app: AppData): RiskFlag | null {
    if (app.released) {
        const releaseDate = new Date(app.released);
        const now = new Date();
        const daysSinceRelease = Math.floor(
            (now.getTime() - releaseDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceRelease < 30) {
            return {
                id: "very_new",
                label: "Very New App",
                description: `This app was released only ${daysSinceRelease} days ago. Very new apps with bold claims should be treated with extra caution as they haven't been vetted by time.`,
                severity: "medium",
                points: 10,
            };
        }
    }
    return null;
}

function checkNoDeveloperWebsite(app: AppData): RiskFlag | null {
    if (!app.developerWebsite && app.store === "google") {
        return {
            id: "no_dev_website",
            label: "No Developer Website",
            description:
                "The developer hasn't provided a website. Established and trustworthy developers typically have an online presence with a verifiable website.",
            severity: "medium",
            points: 10,
        };
    }
    return null;
}

function checkShortDescription(app: AppData): RiskFlag | null {
    const desc = app.description || "";
    if (desc.length < 100) {
        return {
            id: "short_description",
            label: "Generic/Short Description",
            description: `The app description is unusually short (${desc.length} characters). Legitimate apps typically have detailed descriptions explaining their features and functionality.`,
            severity: "medium",
            points: 10,
        };
    }
    return null;
}

function checkNoPrivacyPolicy(app: AppData): RiskFlag | null {
    // Skip for Apple Store — the scraper doesn't expose privacy policy URLs
    if (app.store === "apple") return null;

    if (!app.privacyPolicy) {
        return {
            id: "no_privacy_policy",
            label: "No Privacy Policy",
            description:
                "This app doesn't link to a privacy policy. Google requires apps to have a privacy policy. Its absence is a significant red flag for data handling practices.",
            severity: "high",
            points: 15,
        };
    }
    return null;
}

function checkSuspiciousTitle(app: AppData): RiskFlag | null {
    const titleLower = app.title.toLowerCase();
    const found = SUSPICIOUS_KEYWORDS.filter((kw) => titleLower.includes(kw));
    if (found.length > 0) {
        return {
            id: "suspicious_title",
            label: "Suspicious Keywords in Title",
            description: `The app title contains suspicious keywords: "${found.join('", "')}". Apps using these terms are often fraudulent or distribute malicious content.`,
            severity: "high",
            points: 15,
        };
    }
    return null;
}

function checkSuspiciousDescription(app: AppData): RiskFlag | null {
    const descLower = (app.description || "").toLowerCase();
    const found = SUSPICIOUS_KEYWORDS.filter((kw) => descLower.includes(kw));
    if (found.length >= 2) {
        return {
            id: "suspicious_description",
            label: "Suspicious Claims in Description",
            description: `The description contains multiple suspicious keywords: "${found.slice(0, 3).join('", "')}". These claims are typically associated with fraudulent apps.`,
            severity: "high",
            points: 10,
        };
    }
    return null;
}

function checkAdSupportedFree(app: AppData): RiskFlag | null {
    if (app.free && app.adSupported && app.offersIAP) {
        return {
            id: "aggressive_monetization",
            label: "Aggressive Monetization",
            description:
                "This free app is both ad-supported AND offers in-app purchases. While not inherently malicious, this aggressive monetization pattern is common among low-quality or scam apps.",
            severity: "low",
            points: 5,
        };
    }
    return null;
}

function checkNoDeveloperEmail(app: AppData): RiskFlag | null {
    if (!app.developerEmail && app.store === "google") {
        return {
            id: "no_dev_email",
            label: "No Developer Contact Email",
            description:
                "The developer hasn't provided a contact email. This makes it difficult to reach them for support or report issues.",
            severity: "low",
            points: 5,
        };
    }
    return null;
}

function checkCloneIndicators(app: AppData): RiskFlag | null {
    const titleLower = app.title.toLowerCase();
    const clonePatterns = [
        /\b(for|of)\s+(fortnite|minecraft|roblox|gta|among\s?us)/i,
        /\bguide\s+(for|to)\b/i,
        /\bwallpaper(s)?\s+(for|hd)\b/i,
        /\bskin(s)?\s+(for|free)\b/i,
    ];
    const isClone = clonePatterns.some((p) => p.test(titleLower));
    if (isClone) {
        return {
            id: "clone_indicator",
            label: "Potential Clone/Copycat App",
            description:
                "The app title suggests it may be a copycat or unofficial companion app for a popular game/service. These apps often contain ads, malware, or simply don't work as promised.",
            severity: "high",
            points: 15,
        };
    }
    return null;
}

// ─── New Fraud Detection Checks ──────────────────────────────────────────────

const SUSPICIOUS_DEV_KEYWORDS = [
    "hack",
    "mod",
    "generator",
    "official",
    "free",
    "studio",
    "inc",
    "team",
];

const IMPERSONATION_TARGETS = [
    "whatsapp",
    "instagram",
    "telegram",
    "youtube",
    "facebook",
    "snapchat",
    "spotify",
    "netflix",
    "amazon",
    "google",
];

function checkVeryLowInstalls(app: AppData): RiskFlag | null {
    if (app.minInstalls !== undefined && app.minInstalls < 1000) {
        return {
            id: "very_low_installs",
            label: "Very Low Install Count",
            description: `This app has fewer than 1,000 installs (${app.minInstalls.toLocaleString()}). Apps with extremely low install counts are harder to vet and carry higher risk, as they lack community validation.`,
            severity: "medium",
            points: 10,
        };
    }
    return null;
}

function checkFakeHighRating(app: AppData): RiskFlag | null {
    if (app.score !== null && app.score >= 4.8 && app.ratings < 50) {
        return {
            id: "fake_high_rating",
            label: "Suspiciously High Rating with Few Ratings",
            description: `This app has a near-perfect rating of ${app.score.toFixed(1)} but only ${app.ratings} ratings. This pattern is a strong indicator of rating manipulation — legitimate apps with very few ratings rarely maintain scores above 4.8.`,
            severity: "high",
            points: 15,
        };
    }
    return null;
}

function checkSuspiciousDeveloper(app: AppData): RiskFlag | null {
    const devLower = app.developer.toLowerCase();
    const found = SUSPICIOUS_DEV_KEYWORDS.filter((kw) => devLower.includes(kw));
    if (found.length > 0) {
        return {
            id: "suspicious_developer",
            label: "Suspicious Developer Name",
            description: `The developer name "${app.developer}" contains suspicious keywords: "${found.join('", "')}". Scam developers often use generic or misleading names to appear legitimate.`,
            severity: "high",
            points: 15,
        };
    }
    return null;
}

function checkNotUpdatedRecently(app: AppData): RiskFlag | null {
    if (app.updated) {
        const updatedDate = typeof app.updated === "number"
            ? new Date(app.updated)
            : new Date(app.updated);
        const now = new Date();
        const daysSinceUpdate = Math.floor(
            (now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceUpdate > 365) {
            return {
                id: "not_updated_recently",
                label: "App Not Updated Recently",
                description: `This app hasn't been updated in over ${Math.floor(daysSinceUpdate / 30)} months (last update: ${updatedDate.toLocaleDateString()}). Abandoned apps may have unpatched security vulnerabilities and are more likely to be low-effort scams.`,
                severity: "medium",
                points: 10,
            };
        }
    }
    return null;
}

function checkFakeInstallInflation(app: AppData): RiskFlag | null {
    if (
        app.minInstalls !== undefined &&
        app.minInstalls >= 100000 &&
        app.ratings < 100
    ) {
        return {
            id: "fake_install_inflation",
            label: "Extremely Low Ratings for High Installs",
            description: `This app claims ${app.installs || app.minInstalls.toLocaleString()} installs but has only ${app.ratings} ratings. For an app with 100K+ installs, this level of engagement is virtually impossible organically — a strong indicator of artificial install inflation.`,
            severity: "high",
            points: 15,
        };
    }
    return null;
}

function checkImpersonation(app: AppData): RiskFlag | null {
    const titleLower = app.title.toLowerCase();
    // Only flag truly suspicious modifiers (not "free" which is too common)
    const dangerousModifiers = ["hack", "mod", "cracked", "unlocked"];
    const matchedBrand = IMPERSONATION_TARGETS.find((brand) =>
        titleLower.includes(brand)
    );
    if (matchedBrand) {
        // Skip if this looks like a legitimate companion app
        const isCompanion = LEGITIMATE_COMPANION_KEYWORDS.some((kw) =>
            titleLower.includes(kw)
        );
        if (isCompanion) return null;

        // Skip well-established apps (high installs = vetted by store)
        if (app.minInstalls !== undefined && app.minInstalls >= 100000) return null;

        const hasModifier = dangerousModifiers.some((mod) =>
            titleLower.includes(mod)
        );
        if (hasModifier) {
            return {
                id: "impersonation",
                label: "Potential Brand Impersonation",
                description: `This app's title references "${matchedBrand}" combined with suspicious modifiers. This is a common pattern used by fraudulent apps to impersonate well-known brands and trick users into downloading malware or adware.`,
                severity: "critical",
                points: 20,
            };
        }
    }
    return null;
}

// ─── Enhanced Fraud Detection Checks ─────────────────────────────────────────

function checkBrandImpersonation(app: AppData): RiskFlag | null {
    const titleLower = app.title.toLowerCase();
    const devLower = app.developer.toLowerCase();

    for (const brand of TRUSTED_BRANDS) {
        if (!titleLower.includes(brand.name)) continue;

        // Skip if this looks like a legitimate companion/utility app
        const isCompanion = LEGITIMATE_COMPANION_KEYWORDS.some((kw) =>
            titleLower.includes(kw)
        );
        if (isCompanion) continue;

        // Skip well-established apps (high installs = vetted by store & users)
        if (app.minInstalls !== undefined && app.minInstalls >= 100000) continue;

        const developerMismatch = !devLower.includes(brand.developer);
        const hasImpersonationKeyword = IMPERSONATION_KEYWORDS.some((kw) =>
            titleLower.includes(kw)
        );

        // Require BOTH developer mismatch AND suspicious keyword to flag
        if (developerMismatch && hasImpersonationKeyword) {
            return {
                id: "brand_impersonation",
                label: "Brand Impersonation Detected",
                description: `This app references the trusted brand "${brand.name}" but the developer ("${app.developer}") does not match the expected developer "${brand.developer}", and the title contains suspicious keywords. This is a common tactic used to steal user credentials and distribute malware.`,
                severity: "critical",
                points: 25,
            };
        }
    }
    return null;
}

function checkRatingManipulation(app: AppData): RiskFlag | null {
    if (app.score === null) return null;

    // Case A: Near-perfect score with negligible ratings
    const caseA = app.score >= 4.8 && app.ratings < 50;
    // Case B: 100K+ installs with suspiciously few ratings
    const caseB = app.minInstalls !== undefined && app.minInstalls >= 100000 && app.ratings < 100;
    // Case C: 1M+ installs with extremely few ratings
    const caseC = app.minInstalls !== undefined && app.minInstalls >= 1000000 && app.ratings < 500;

    if (caseA || caseB || caseC) {
        const reasons: string[] = [];
        if (caseA) reasons.push(`near-perfect rating (${app.score.toFixed(1)}) with only ${app.ratings} ratings`);
        if (caseB) reasons.push(`100K+ installs but only ${app.ratings} ratings`);
        if (caseC) reasons.push(`1M+ installs but only ${app.ratings} ratings`);

        return {
            id: "rating_manipulation",
            label: "Rating Manipulation Suspected",
            description: `Multiple signals indicate potential rating manipulation: ${reasons.join("; ")}. These patterns are statistically improbable for organic growth and suggest artificial inflation.`,
            severity: "high",
            points: 20,
        };
    }
    return null;
}

function checkLoanFraudKeywords(app: AppData): RiskFlag | null {
    const searchText = `${app.title} ${app.description || ""}`.toLowerCase();
    const found = LOAN_FRAUD_KEYWORDS.filter((kw) => searchText.includes(kw));

    if (found.length >= 3) {
        return {
            id: "loan_fraud_critical",
            label: "High-Risk Loan Scam Pattern",
            description: `This app contains ${found.length} loan fraud keywords: "${found.slice(0, 4).join('", "')}". Financial loan scam apps frequently use these terms to lure victims with promises of instant cash, then harvest personal data or charge hidden fees.`,
            severity: "critical",
            points: 35,
        };
    }

    if (found.length >= 1) {
        return {
            id: "loan_fraud_warning",
            label: "Potential Loan Scam Keywords",
            description: `This app contains loan-related fraud keywords: "${found.join('", "')}". Apps promising instant loans or cash with minimal verification are a major category of app store fraud, often leading to data theft or hidden charges.`,
            severity: "critical",
            points: 25,
        };
    }
    return null;
}

function checkDeveloperReputation(app: AppData): RiskFlag | null {
    const lowAppCount = app.developerAppCount !== undefined && app.developerAppCount <= 2;
    const newAccount = app.developerAccountAgeDays !== undefined && app.developerAccountAgeDays < 30;

    if (lowAppCount || newAccount) {
        const reasons: string[] = [];
        if (lowAppCount) reasons.push(`developer has only ${app.developerAppCount} app(s) published`);
        if (newAccount) reasons.push(`developer account is only ${app.developerAccountAgeDays} days old`);

        return {
            id: "low_dev_reputation",
            label: "Low Developer Reputation",
            description: `This developer shows signs of low credibility: ${reasons.join("; ")}. Scam developers often create throwaway accounts with minimal publishing history to distribute fraudulent apps.`,
            severity: "high",
            points: 20,
        };
    }
    return null;
}

function checkFraudReviews(app: AppData): RiskFlag | null {
    const reviewTexts = app.reviewsText || app.reviewsList?.map((r) => r.text) || [];
    if (reviewTexts.length === 0) return null;

    const flaggedReviews = reviewTexts.filter((text) => {
        const lower = text.toLowerCase();
        return FRAUD_REVIEW_KEYWORDS.some((kw) => lower.includes(kw));
    });

    if (flaggedReviews.length >= 2) {
        return {
            id: "fraud_reviews_detected",
            label: "Users Report Fraud or Abuse",
            description: `${flaggedReviews.length} out of ${reviewTexts.length} sampled reviews contain fraud-related keywords (scam, fraud, harassment, etc.). When multiple users independently report similar issues, it is a strong indicator of a deceptive or dangerous app.`,
            severity: "critical",
            points: 40,
        };
    }
    return null;
}

function checkUpdateFrequency(app: AppData): RiskFlag | null {
    if (!app.updated) return null;

    const updatedDate = typeof app.updated === "number"
        ? new Date(app.updated)
        : new Date(app.updated);

    if (isNaN(updatedDate.getTime())) return null;

    const now = new Date();
    const daysSinceUpdate = Math.floor(
        (now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceUpdate > 730) {
        return {
            id: "severely_outdated",
            label: "App Severely Outdated",
            description: `This app hasn't been updated in over ${Math.floor(daysSinceUpdate / 365)} years (last update: ${updatedDate.toLocaleDateString()}). Severely outdated apps are prime targets for security exploits and are very likely abandoned or fraudulent.`,
            severity: "high",
            points: 20,
        };
    }

    if (daysSinceUpdate > 365) {
        return {
            id: "outdated_app",
            label: "App Not Updated in Over a Year",
            description: `This app hasn't been updated in over ${Math.floor(daysSinceUpdate / 30)} months (last update: ${updatedDate.toLocaleDateString()}). Apps that go long periods without updates may have unpatched vulnerabilities and reduced reliability.`,
            severity: "medium",
            points: 15,
        };
    }
    return null;
}

// ─── Main Analyzer ───────────────────────────────────────────────────────────

export function analyzeApp(appData: AppData): AnalysisResult {
    const checks = [
        // Original checks
        checkLowRating,
        checkFewReviews,
        checkNewApp,
        checkNoDeveloperWebsite,
        checkShortDescription,
        checkNoPrivacyPolicy,
        checkSuspiciousTitle,
        checkSuspiciousDescription,
        checkAdSupportedFree,
        checkNoDeveloperEmail,
        checkCloneIndicators,
        checkVeryLowInstalls,
        checkFakeHighRating,
        checkSuspiciousDeveloper,
        checkNotUpdatedRecently,
        checkFakeInstallInflation,
        checkImpersonation,
        // Enhanced fraud detection checks
        checkBrandImpersonation,
        checkRatingManipulation,
        checkLoanFraudKeywords,
        checkDeveloperReputation,
        checkFraudReviews,
        checkUpdateFrequency,
    ];

    const flags: RiskFlag[] = [];
    let totalPoints = 0;

    for (const check of checks) {
        const result = check(appData);
        if (result) {
            flags.push(result);
            totalPoints += result.points;
        }
    }

    // Cap at 100
    const riskScore = Math.min(totalPoints, 100);

    // Determine risk level
    let riskLevel: RiskLevel;
    if (riskScore <= 20) {
        riskLevel = "safe";
    } else if (riskScore <= 40) {
        riskLevel = "low";
    } else if (riskScore <= 60) {
        riskLevel = "medium";
    } else if (riskScore <= 80) {
        riskLevel = "high";
    } else {
        riskLevel = "critical";
    }

    // Generate recommendation
    const recommendation = getRecommendation(riskLevel, flags);

    // Sort flags by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    flags.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return {
        appInfo: appData,
        riskScore,
        riskLevel,
        flags,
        recommendation,
        analyzedAt: new Date().toISOString(),
    };
}

function getRecommendation(level: RiskLevel, flags: RiskFlag[]): string {
    switch (level) {
        case "safe":
            return "This app appears legitimate based on our analysis. It passed most of our security checks and shows signs of being a well-maintained application. You can proceed with installation with confidence.";
        case "low":
            return "This app has a few minor concerns but is likely safe. We recommend reviewing the flagged items below before installing. Overall, the app appears to be legitimate.";
        case "medium":
            return "This app has raised several concerns during our analysis. We recommend proceeding with caution. Review the detailed flags below carefully and consider if you really need this app before installing.";
        case "high":
            return "This app shows strong indicators of being potentially fraudulent or unsafe. We strongly recommend NOT installing this app. The multiple red flags suggest it may be a scam, contain malware, or misrepresent its functionality.";
        case "critical":
            return "⚠️ This app is almost certainly fake or malicious. DO NOT install this app. It has failed nearly all of our security checks and shows overwhelming signs of fraud. Report this app to the store if possible.";
    }
}
