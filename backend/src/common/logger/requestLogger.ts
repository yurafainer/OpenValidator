import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { asyncLocalStorage } from "./requestContext";
import { logger } from "./logger";

export function requestLogger(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const requestId = randomUUID();

    asyncLocalStorage.run({ requestId }, () => {

        const start = Date.now();

        logger.info({
            requestId,
            method: req.method,
            url: req.originalUrl
        }, "Request started");

        res.on("finish", () => {

            logger.info({
                requestId,
                status: res.statusCode,
                duration: Date.now() - start
            }, "Request finished");

        });

        next();
    });
}