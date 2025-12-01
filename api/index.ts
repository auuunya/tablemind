import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createApp } from "../server/app";
import * as serverless from "serverless-http";

let handler: any;

// Initialize once
async function getHandler() {
    if (!handler) {
        const app = await createApp();
        handler = serverless(app);
    }
    return handler;
}

export default async function (req: VercelRequest, res: VercelResponse) {
    if (!req.url?.startsWith("/api")) return res.status(404).end();
    const h = await getHandler();
    return h(req, res);
}
