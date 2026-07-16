import { Router } from "express";
import multer from "multer";
import { ComparisonController } from "../presentation/controllers/ComparisonController";
const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
const controller = new ComparisonController();
router.post("/", upload.fields([{ name: "oldFile", maxCount: 1 }, { name: "newFile", maxCount: 1 }]), controller.compare);
export default router;
