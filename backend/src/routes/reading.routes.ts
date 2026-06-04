import { Router } from "express";
import {
  createReading,
  deleteReading,
  generateReadingQuestionList,
  generateReadingSummary,
  listReadings,
  updateReading
} from "../controllers/reading.controller";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();

router.get("/", asyncHandler(listReadings));
router.post("/", asyncHandler(createReading));
router.put("/:id", asyncHandler(updateReading));
router.delete("/:id", asyncHandler(deleteReading));
router.post("/:id/generate-questions", asyncHandler(generateReadingQuestionList));
router.post("/:id/generate-summary", asyncHandler(generateReadingSummary));

export default router;

