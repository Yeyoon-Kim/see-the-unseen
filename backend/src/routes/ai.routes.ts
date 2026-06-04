import { Router } from "express";
import {
  analyzeSyllabusText,
  assignmentChecklist,
  examStudyPlan,
  extractAssignmentText,
  presentationChecklist,
  readingQuestions,
  researchPlan,
  summarizeMaterialText
} from "../controllers/ai.controller";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();

router.post("/analyze-syllabus", asyncHandler(analyzeSyllabusText));
router.post("/extract-assignment", asyncHandler(extractAssignmentText));
router.post("/summarize-material", asyncHandler(summarizeMaterialText));
router.post("/assignment-checklist", asyncHandler(assignmentChecklist));
router.post("/exam-study-plan", asyncHandler(examStudyPlan));
router.post("/presentation-checklist", asyncHandler(presentationChecklist));
router.post("/reading-questions", asyncHandler(readingQuestions));
router.post("/research-plan", asyncHandler(researchPlan));

export default router;

