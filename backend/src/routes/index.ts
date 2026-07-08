import { Router } from "express";

import validationRoutes from "./validation.routes";

const router = Router();

router.use("/validate", validationRoutes);

export default router;