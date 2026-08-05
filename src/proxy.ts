import type { Request, Response } from "express";
import config from "./config.js";
import { getCache, setCache } from "./cache.js";
import { validateProxyUrl } from "./urlValidator.js";

interface NodeRequestInit extends RequestInit {
	duplex?: "half";
}

const blockedHeaders = new Set([
	"host",
	"connection",
	"content-length",
	"transfer-encoding",
	"keep-alive",
	"upgrade",
	"proxy-authenticate",
	"proxy-authorization",
	"te",
	"trailer",
	"content-encoding"
]);

function cleanHeaders(headers: Headers) {
	const output = new Headers();

	for (const [key, value] of headers.entries()) {
		if (!blockedHeaders.has(key.toLowerCase())) {
			output.set(key, value);
		}
	}

	return output;
}

function getTargetUrl(req: Request) {
	const url =
		typeof req.query.url === "string"
			? req.query.url
			: undefined;

	if (!url) {
		throw new Error(
			"Missing url query parameter."
		);
	}

	return new URL(url);
}

export async function proxyRequest(
	req: Request,
	res: Response
) {
	let controller: AbortController | undefined;

	try {
		const target = await validateProxyUrl(
			getTargetUrl(req)
		);

		const cacheKey = target.toString();

		if (req.method === "GET") {
			const cached = getCache(cacheKey);

			if (cached) {
				res.setHeader("X-Cache", "HIT");

				for (const [key, value] of Object.entries(cached.headers)) {
					res.setHeader(key, value);
				}

				return res.status(cached.status).send(cached.body);
			}
		}

		res.setHeader("X-Cache", "MISS");

		controller = new AbortController();

		const timeout = setTimeout(() => {
			controller?.abort();
		}, config.timeout);

		const headers = new Headers();

		for (const [key, value] of Object.entries(req.headers)) {
			if (
				typeof value === "string" &&
				!blockedHeaders.has(key.toLowerCase())
			) {
				headers.set(key, value);
			}
		}

        const options: NodeRequestInit = {
            method: req.method,
            headers,
            body: 
                req.method === "GET" ||
                req.method === "HEAD"
                    ? undefined
                    : (req as any),
            duplex: "half",
            redirect: "follow",
            signal: controller.signal
        }

        const response = await fetch(target, options);

		clearTimeout(timeout);

		// clearTimeout(timeout);
		// res.status(response.status);

		// const responseHeaders =
		// 	cleanHeaders(response.headers);

		// for (const [key, value] of responseHeaders) {
		// 	res.setHeader(key, value);
		// }

		// if (!response.body) {
		// 	return res.end();
		// }

		// const reader =
		// 	response.body.getReader();

		// while (true) {
		// 	const { done, value } =
		// 		await reader.read();

		// 	if (done) {
		// 		break;
		// 	}

		// 	res.write(
		// 		Buffer.from(value)
		// 	);
		// }

		// res.end();

		const body = Buffer.from(
			await response.arrayBuffer()
		);

		res.status(response.status);

		const responseHeaders =
			cleanHeaders(response.headers);

		for (const [key, value] of responseHeaders) {
			res.setHeader(key, value);
		}

		if (
			req.method === "GET" &&
			response.status === 200 &&
			!req.headers.authorization
		) {
			setCache(
				cacheKey,
				{
					body,
					headers: Object.fromEntries(responseHeaders.entries()),
					status: response.status
				},
				config.cacheTtl
			);
		}

		res.send(body);

	} catch (error: any) {
		if (
			error.name === "AbortError"
		) {
			return res.status(504).json({
				error: "Request timed out."
			});
		}

		return res.status(500).json({
			error:
				error.message ??
				"Proxy request failed."
		});

	} finally {
		controller?.abort();
	}
}