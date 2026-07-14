import express from "express";
import config from "./config.js";
import { registerMiddleware } from "./middleware.js";
import { proxyRequest } from "./proxy.js";

const app = express();

registerMiddleware(app);

app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

app.all("/proxy", proxyRequest);

app.get("/", (_req, res) => {
    res.json({
        endpoints: {
            health: "/health",
            proxy: "/proxy?url=https://itsbr0dyy.dev/api"
        }
    });
});

app.use((_req, res) => {
    res.status(404).json({
        error:"not found"
    });
});

app.use(
    (
        err: Error,
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction
    ) => {
        console.error(err);
        res.status(500).json({
            error: "internal server error"
        });
    }
);

const server = app.listen(
    config.port,
    () => {
        console.log(
            `proxy running`
        );
    }
);

function shutdown(signal: string) {
    console.log(
        `${signal} received, dying`
    );

    server.close(() => {
        console.log("server closed");
        process.exit(0);
    })

    setTimeout(() => {
        console.error("forced shutdown");
        process.exit(1);
    }, 10000);
}

process.on(
    "SIGTERM",
    () => shutdown("SIGTERM")
);

process.on(
    ":SIGINT",
    () => shutdown("SIGINT")
);

process.on(
    "uncaughtException",
    (error) => {
        console.error(
            "uncaught exception:",
            error
        );
    }
);

process.on(
    "unhandledRejection",
    (error) => {
        console.error(
            "unhandled rejection:",
            error
        );
    }
);