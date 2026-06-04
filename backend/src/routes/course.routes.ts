import { Router } from "express";
import {
  createCourse,
  deleteCourse,
  getCourse,
  listCourses,
  updateCourse
} from "../controllers/course.controller";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();

router.get("/", asyncHandler(listCourses));
router.post("/", asyncHandler(createCourse));
router.get("/:id", asyncHandler(getCourse));
router.put("/:id", asyncHandler(updateCourse));
router.delete("/:id", asyncHandler(deleteCourse));

export default router;

