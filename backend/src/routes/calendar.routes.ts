import { Router } from "express";
import {
  exportCalendar,
  exportCourseCalendar
} from "../controllers/calendar.controller";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();

router.get("/export/course/:courseId", asyncHandler(exportCourseCalendar));
router.get("/export", asyncHandler(exportCalendar));

export default router;

