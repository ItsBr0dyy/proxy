interface CacheEntry {
    body: Buffer;
    headers: Record<string, string>;
    status: number;
    expires: number;
}

const cache = new Map<string, CacheEntry>();

export function getCache(key: string) {
    const entry = cache.get(key);

    if (!entry) {
        return null;
    }

    if (Date.now() > entry.expires) {
        cache.delete(key);
        return null;
    }

    return entry;
}

export function setCache(
    key: string,
    entry: Omit<CacheEntry, "expires">,
    ttl: number
) {
    cache.set(key, {
        ...entry,
        expires: Date.now() + ttl
    });
}