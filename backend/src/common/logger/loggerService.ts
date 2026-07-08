import { logger } from "./logger";
import { asyncLocalStorage } from "./requestContext";

function context() {
    return asyncLocalStorage.getStore();
}

export const log = {

    info(message: string, data?: object) {
        logger.info({
            requestId: context()?.requestId,
            ...data
        }, message);
    },

    debug(message: string, data?: object) {
        logger.debug({
            requestId: context()?.requestId,
            ...data
        }, message);
    },

    warn(message: string, data?: object) {
        logger.warn({
            requestId: context()?.requestId,
            ...data
        }, message);
    },

    error(message: string, data?: object) {
        logger.error({
            requestId: context()?.requestId,
            ...data
        }, message);
    }
};