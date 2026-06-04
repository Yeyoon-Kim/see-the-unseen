import { Router } from "express";
import {
  createExam,
  deleteExam,
  generateExamStudyPlan,
  listExams,
  updateExam
} from "../controllers/exam.controller";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();

router.get("/", asyncHandler(listExams));
router.post("/", asyncHandler(createExam));
router.put("/:id", asyncHandler(updateExam));
router.delete("/:id", asyncHandler(deleteExam));
router.post("/:id/generate-study-plan", asyncHandler(generateExamStudyPlan));

export default router;

