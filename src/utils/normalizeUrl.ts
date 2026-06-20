export function normalizeUrl(url: string): string | null {
    try {
        return new URL(url).href.replace(/\/$/, "");
    } catch {
        return null;
    }
}