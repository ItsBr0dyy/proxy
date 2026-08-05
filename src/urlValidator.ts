import dns from "node:dns/promises";
import net from "node:net";

function isPrivateIp(ip: string) {
    if (net.isIP(ip) === 4) {
        const parts = ip.split(".").map(Number);

        return (
            parts[0] === 10 ||
            parts[0] === 127 ||
            (parts[0] === 169 && parts[1] === 254) ||
            (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
            (parts[0] === 192 && parts[1] === 168)
        );
    }

    if (net.isIP(ip) === 6) {
        return (
            ip === "::1" ||
            ip.startsWith("fc") ||
            ip.startsWith("fd")
        );
    }

    return false;
}

export async function validateProxyUrl(url: URL) {
    if (url.protocol !== "https:") {
        throw new Error("only https URLs are allowed");
    }

    const addresses = await dns.resolve(url.hostname);

    for (const address of addresses) {
        if (isPrivateIp(address)) {
            throw new Error("private addresses are blocked");
        }
    }

    return url;
}