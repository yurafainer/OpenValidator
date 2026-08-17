import "reflect-metadata";
import type { Express } from "express";

import { Configuration } from "./infrastructure/config/Configuration";
import { registerDependencies } from "./infrastructure/di/registerDependencies";
import { HttpServer } from "./infrastructure/http/HttpServer";

export const configuration = new Configuration();

export function createApp(app: Express): Express {
  registerDependencies();
  new HttpServer(configuration, app);
  return app;
}
