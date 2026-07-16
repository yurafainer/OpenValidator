import { Router } from "express";
import multer from "multer";

import { container } from "../infrastructure/di/DependencyContainer";
import { XmlValidationController } from "../presentation/controllers/XmlValidationController";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 2,
  },
});

router.post(
  "/",
  upload.fields([
    { name: "xsdFile", maxCount: 1 },
    { name: "xmlFile", maxCount: 1 },
  ]),
  (req, res, next) => {
    const controller = container.resolve(XmlValidationController);
    controller.validate(req, res).catch(next);
  },
);

export default router;
