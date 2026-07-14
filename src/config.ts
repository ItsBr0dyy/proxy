import 'dotenv/config';

function number(name: string, fallback: number): number {
    const value = process.env[name];
    if (!value) return fallback;

    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : parsed;
}

export default {
    port: number('PORT', 3000),
    apiKey: process.env.API_KEY ?? '',
    corsOrigin: process.env.CORS_ORIGIN ?? '*',
    rateLimit: number('RATE_LIMIT', 100),
    rateWindow: number('RATE_WINDOW', 60_000),
    bodyLimit: process.env.BODY_LIMIT ?? '200mb',
    timeout: number('TIMEOUT', 30_000)
};