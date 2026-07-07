import express, { Express } from 'express';

export class HttpServer {
  private readonly app: Express;

  constructor() {
    this.app = express();
    this.configureRoutes();
  }

  public getApp(): Express {
    return this.app;
  }

  private configureRoutes(): void {
    this.app.get('/health', (_req, res) => {
      res.status(200).json({
        status: 'UP',
        application: 'OpenValidator',
        version: '0.1.0',
      });
    });
  }
}