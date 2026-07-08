import { logger } from './logger';
import { asyncLocalStorage } from './requestContext';
import { ILogger } from './ILogger';
export class LoggerService implements ILogger {

    private context() {
        return asyncLocalStorage.getStore();
    }

    public info(message: string, data?: object): void {
        logger.info({
            requestId: this.context()?.requestId,
            ...data
        }, message);
    }

    public debug(message: string, data?: object): void {
        logger.debug({
            requestId: this.context()?.requestId,
            ...data
        }, message);
    }

    public warn(message: string, data?: object): void {
        logger.warn({
            requestId: this.context()?.requestId,
            ...data
        }, message);
    }

    public error(message: string, data?: object): void {
        logger.error({
            requestId: this.context()?.requestId,
            ...data
        }, message);
    }
}