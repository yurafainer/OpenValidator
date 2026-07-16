import express, { Express } from "express";
import multer from "multer";
import path from "path";

import routes from "../../routes";

import { LoadSpecificationUseCase } from "../../application/usecases/LoadSpecificationUseCase";
import { SpecificationStore } from "../../application/specifications/SpecificationStore";
import { SpecificationController } from "../../presentation/controllers/SpecificationController";
import { HistoryController } from "../../presentation/controllers/HistoryController";
import { ExampleController } from "../../presentation/controllers/ExampleController";
import { ValidationHistoryStore } from "../../application/history/ValidationHistoryStore";
import { ExampleGenerationService } from "../../application/examples/ExampleGenerationService";

import { Configuration } from "../config/Configuration";
import { YamlSpecificationLoader } from "../parser/YamlSpecificationLoader";

export class HttpServer {
  private readonly app: Express;

  constructor(private readonly configuration: Configuration) {
    this.app = express();

    this.configureMiddlewares();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  public getApp(): Express {
    return this.app;
  }

  private configureMiddlewares(): void {
    this.app.use(express.json());
    this.app.use(express.static(path.resolve(process.cwd(), "public")));
  }

  private configureRoutes(): void {
    this.configureHomeRoute();
    this.configureHealthRoute();
    this.configureApplicationRoutes();
    this.configureSpecificationRoutes();
    this.configureProductRoutes();
  }

  private configureHomeRoute(): void {
    this.app.get("/", (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), "public", "index.html"));
    });
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

  private configureErrorHandling(): void {
    this.app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      const statusCode = error.message === "Specification file is required" ? 400 : 500;

      res.status(statusCode).json({
        message: error.message || "Internal server error",
      });
    });
  }

  private configureProductRoutes(): void {
    const historyController = new HistoryController(new ValidationHistoryStore());
    const exampleController = new ExampleController(new SpecificationStore(), new ExampleGenerationService());
    this.app.get("/api/v1/history", historyController.list);
    this.app.get("/api/v1/history/:id", historyController.get);
    this.app.delete("/api/v1/history", historyController.clear);
    this.app.post("/api/v1/examples/generate", exampleController.generate);
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
      new SpecificationStore(),
    );

    this.app.get("/api/v1/specifications", specificationController.list);
    this.app.get("/api/v1/specifications/:id", specificationController.get);
    this.app.delete("/api/v1/specifications/:id", specificationController.remove);
    this.app.post(
      "/api/v1/specifications/load",
      upload.single("file"),
      specificationController.load,
    );
  }
}