import compression from "compression";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import express from "express";
import type { Application, NextFunction, Request, Response } from "express";
import config from './config.js';

export function registerMiddleware(app: Application) {
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
    app.use(morgan('combined'));
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