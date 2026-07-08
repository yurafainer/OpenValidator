import express, { Express } from "express";
import { Configuration } from "../config/Configuration";
import routes from "../../routes";

export class HttpServer {
  private readonly app: Express;

  constructor(private readonly configuration: Configuration) {
    this.app = express();

    this.app.use(express.json());

    this.configureRoutes();
  }

  public getApp(): Express {
    return this.app;
  }

  private configureRoutes(): void {
    this.app.get("/health", (_req, res) => {
      res.status(200).json({
        status: "UP",
        application: this.configuration.applicationName,
        version: this.configuration.version,
      });
    });

    this.app.use("/api/v1", routes);
  }
}