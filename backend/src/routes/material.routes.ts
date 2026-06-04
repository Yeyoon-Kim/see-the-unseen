import { Router } from "express";
import {
  deleteMaterial,
  listMaterials,
  summarizeExistingMaterial,
  uploadMaterial
} from "../controllers/material.controller";
import { asyncHandler } from "../middleware/errorHandler";
import { upload } from "../middleware/upload";

const router = Router();

router.get("/", asyncHandler(listMaterials));
router.post("/upload", upload.single("file"), asyncHandler(uploadMaterial));
router.post("/:id/summarize", asyncHandler(summarizeExistingMaterial));
router.delete("/:id", asyncHandler(deleteMaterial));

export default router;

