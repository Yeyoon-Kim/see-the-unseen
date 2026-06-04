import { Router } from "express";
import {
  createAssignment,
  deleteAssignment,
  generateChecklist,
  listAssignments,
  updateAssignment
} from "../controllers/assignment.controller";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();

router.get("/", asyncHandler(listAssignments));
router.post("/", asyncHandler(createAssignment));
router.put("/:id", asyncHandler(updateAssignment));
router.delete("/:id", asyncHandler(deleteAssignment));
router.post("/:id/generate-checklist", asyncHandler(generateChecklist));

export default router;

