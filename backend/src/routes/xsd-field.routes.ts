import { Router } from "express";
import multer from "multer";

import { container } from "../infrastructure/di/DependencyContainer";
import { XsdFieldController } from "../presentation/controllers/XsdFieldController";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
});

router.post("/", upload.single("xsdFile"), (req, res, next) => {
  const controller = container.resolve(XsdFieldController);
  controller.extract(req, res).catch(next);
});

export default router;
