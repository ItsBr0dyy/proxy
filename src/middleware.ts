import compression from "compression";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import express from "express";
import { randomUUID } from "crypto";
import type { Application, NextFunction, Request, Response } from "express";
import config from './config.js';

export function registerMiddleware(app: Application) {
    app.use(requestId);
    app.use(helmet());
    app.use(compression());
    app.use(
        cors({
            origin: config.corsOrigin === '*' ? true : config.corsOrigin,
            credentials: true
        })
    );
    app.use(
        rateLimit({
            windowMs: config.rateWindow,
            limit: config.rateLimit,
            standardHeaders: true,
            legacyHeaders: false,
            message: {
                error: 'rate limit exceeded'
            }
        })
    );
    app.use(
        morgan((tokens, req,res) => {
            return JSON.stringify({
                requestId: res.getHeader("X-Request-ID"),
                ip: tokens["remote-addr"](req, res),
                method: tokens.method(req, res),
                path: tokens.url(req, res),
                status: tokens.status(req, res),
                userAgent: tokens["user-agent"](req, res),
                responseTime: `${tokens["response-time"](req, res)}ms`
            });
        })
    );
    app.use(requireApiKey);
    app.use(
        express.json({
            limit: config.bodyLimit
        })
    );
    app.use(
        express.raw({
            type: '*/*',
            limit: config.bodyLimit
        })
    );
}

function requireApiKey(
    req: Request,
    res: Response,
    next: NextFunction
) {
    if (!config.apiKey) {
        return next();
    }

    const header = req.headers.authorization;

    if (!header) {
        return res.status(401).json({
            error: 'missing Authorization header'
        });
    }

    const token = header.replace(/^Bearer\s+/i, '');

    if (token !== config.apiKey) {
        return res.status(401).json({
            error: 'invalid api key'
        });
    }

    next();
}

function requestId(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const id = randomUUID();

    res.locals.requestId = id;

    req.headers["x-request-id"] = id;

    res.setHeader(
        "X-Request-ID",
        id
    );

    next();
}