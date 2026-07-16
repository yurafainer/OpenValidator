import { Router } from "express";
import multer from "multer";

import { container } from "../infrastructure/di/DependencyContainer";
import { ValidationController } from "../presentation/controllers/ValidationController";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

router.post(
  "/",
  upload.single("file"),
  (req, res, next) => {
    const controller = container.resolve(ValidationController);

    controller.validate(req, res).catch(next);
  },
);

export default router;