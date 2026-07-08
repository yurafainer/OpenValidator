import { Configuration } from './infrastructure/config/Configuration';
import { HttpServer } from './infrastructure/http/HttpServer';

export class Application {
  private readonly configuration: Configuration;
  private readonly httpServer: HttpServer;

  constructor() {
    this.configuration = new Configuration();
    this.httpServer = new HttpServer(this.configuration);
  }

  public start(): void {
    this.httpServer.getApp().listen(this.configuration.port, () => {
      console.log(
        `${this.configuration.applicationName} backend is running on port ${this.configuration.port}`,
      );
    });
  }
}