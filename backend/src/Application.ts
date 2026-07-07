import { HttpServer } from './infrastructure/http/HttpServer';

export class Application {
  private readonly httpServer: HttpServer;

  constructor() {
    this.httpServer = new HttpServer();
  }

  public start(): void {
    const port = process.env.PORT || 3000;

    this.httpServer.getApp().listen(port, () => {
      console.log(`OpenValidator backend is running on port ${port}`);
    });
  }
}