import express from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";

export async function createApp() {
    const app = express();

    app.use(
        express.json({
            verify: (req: any, _res, buf) => {
                req.rawBody = buf;
            },
        })
    );

    app.use(express.urlencoded({ extended: false }));

    // logging middleware
    app.use((req: any, res: any, next) => {
        const start = Date.now();
        const path = req.path;
        let capturedJsonResponse: any;

        const originalResJson = res.json;
        res.json = function (bodyJson: any, ...args: any[]) {
            capturedJsonResponse = bodyJson;
            return originalResJson.apply(res, [bodyJson, ...args]);
        };

        res.on("finish", () => {
            const duration = Date.now() - start;
            if (path.startsWith("/api")) {
                let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
                if (capturedJsonResponse) {
                    logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
                }
                console.log(logLine);
            }
        });

        next();
    });

    // register routes (no httpServer)
    await registerRoutes(null as any, app);

    if (process.env.NODE_ENV === "production") {
        // serveStatic(app);
    }

    return app;
}
