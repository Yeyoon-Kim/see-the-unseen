import { Router } from "express";
import {
  createTask,
  deleteTask,
  listTasks,
  updateTask
} from "../controllers/task.controller";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();

router.get("/", asyncHandler(listTasks));
router.post("/", asyncHandler(createTask));
router.put("/:id", asyncHandler(updateTask));
router.delete("/:id", asyncHandler(deleteTask));

export default router;
