import { Router } from "express";
import { dashboard } from "../controllers/dashboard.controller";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();

router.get("/", asyncHandler(dashboard));

export default router;

