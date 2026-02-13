declare module "app-store-scraper" {
    interface AppOptions {
        id?: number;
        appId?: string;
        country?: string;
        sort?: any;
        page?: number;
    }

    interface AppResult {
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

    function app(options: AppOptions): Promise<AppResult>;
    function reviews(options: AppOptions): Promise<any[]>;
    function search(options: {
        term: string;
        num?: number;
        page?: number;
        country?: string;
        lang?: string;
    }): Promise<any[]>;

    export default {
        app,
        reviews,
        search,
        sort: {
            RECENT: any,
            HELPFUL: any
        }
    };
}

declare module "google-play-scraper" {
    interface AppOptions {
        appId: string;
        lang?: string;
        country?: string;
        sort?: any;
        num?: number;
    }

    interface AppResult {
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

    function app(options: AppOptions): Promise<AppResult>;
    function permissions(options: AppOptions): Promise<any[]>;
    function reviews(options: AppOptions): Promise<any>;
    function search(options: {
        term: string;
        num?: number;
        lang?: string;
        country?: string;
    }): Promise<any[]>;

    export default {
        app,
        permissions,
        reviews,
        search,
        sort: {
            NEWEST: any,
            RATING: any,
            HELPFULNESS: any
        }
    };
}
