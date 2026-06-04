import { Router } from "express";
import {
  createPresentation,
  deletePresentation,
  generatePresentationTasks,
  listPresentations,
  updatePresentation
} from "../controllers/presentation.controller";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();

router.get("/", asyncHandler(listPresentations));
router.post("/", asyncHandler(createPresentation));
router.put("/:id", asyncHandler(updatePresentation));
router.delete("/:id", asyncHandler(deletePresentation));
router.post("/:id/generate-checklist", asyncHandler(generatePresentationTasks));

export default router;

