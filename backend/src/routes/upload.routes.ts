import { Router } from "express";
import {
  saveNotice,
  saveSyllabus,
  uploadNotice,
  uploadSyllabus
} from "../controllers/upload.controller";
import { asyncHandler } from "../middleware/errorHandler";
import { upload } from "../middleware/upload";

const router = Router();

router.post("/syllabus", upload.single("file"), asyncHandler(uploadSyllabus));
router.post("/notice", upload.single("file"), asyncHandler(uploadNotice));
router.post("/syllabus/save", asyncHandler(saveSyllabus));
router.post("/notice/save", asyncHandler(saveNotice));

export default router;
