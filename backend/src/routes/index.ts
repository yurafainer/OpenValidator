import { Router } from "express";

import validationRoutes from "./validation.routes";
import xmlValidationRoutes from "./xml-validation.routes";
import comparisonRoutes from "./comparison.routes";
import xsdFieldRoutes from "./xsd-field.routes";

const router = Router();

router.use("/validate", validationRoutes);
router.use("/validate/xml", xmlValidationRoutes);
router.use("/compare", comparisonRoutes);
router.use("/xsd/fields", xsdFieldRoutes);

export default router;
