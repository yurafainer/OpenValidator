import express, { Express } from "express";
import multer from "multer";

import routes from "../../routes";

import { LoadSpecificationUseCase } from "../../application/usecases/LoadSpecificationUseCase";
import { SpecificationController } from "../../presentation/controllers/SpecificationController";

import { Configuration } from "../config/Configuration";
import { YamlSpecificationLoader } from "../parser/YamlSpecificationLoader";

export class HttpServer {
  private readonly app: Express;

  constructor(private readonly configuration: Configuration) {
    this.app = express();

    this.configureMiddlewares();
    this.configureRoutes();
  }

  public getApp(): Express {
    return this.app;
  }

  private configureMiddlewares(): void {
    this.app.use(express.json());
  }

  private configureRoutes(): void {
    this.configureHealthRoute();
    this.configureApplicationRoutes();
    this.configureSpecificationRoutes();
  }

  private configureHealthRoute(): void {
    this.app.get("/health", (_req, res) => {
      res.status(200).json({
        status: "UP",
        application: this.configuration.applicationName,
        version: this.configuration.version,
      });
    });
  }

  private configureApplicationRoutes(): void {
    this.app.use("/api/v1", routes);
  }

  private configureSpecificationRoutes(): void {
    const upload = multer({
      storage: multer.memoryStorage(),
    });

    const specificationLoader = new YamlSpecificationLoader();

    const loadSpecificationUseCase = new LoadSpecificationUseCase(
      specificationLoader,
    );

    const specificationController = new SpecificationController(
      loadSpecificationUseCase,
    );

    this.app.post(
      "/api/v1/specifications/load",
      upload.single("file"),
      specificationController.load,
    );
  }
}