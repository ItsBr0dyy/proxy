import type { Request } from "express";

export interface ProxyOptions {
    timeout: number;
}

export interface ProxyRequest extends Request {
    target?: URL;
}