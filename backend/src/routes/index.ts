import { Router } from "express";

import validationRoutes from "./validation.routes";
import xmlValidationRoutes from "./xml-validation.routes";
import comparisonRoutes from "./comparison.routes";

const router = Router();

router.use("/validate", validationRoutes);
router.use("/validate/xml", xmlValidationRoutes);
router.use("/compare", comparisonRoutes);

export default router;