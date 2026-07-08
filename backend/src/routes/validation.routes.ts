import { Router } from "express";
import { container } from "tsyringe";

import { ValidationController } from "../controllers/ValidationController";

const router = Router();

const controller = container.resolve(ValidationController);

router.post("/", controller.validate);

export default router;