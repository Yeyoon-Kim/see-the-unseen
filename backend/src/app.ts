import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import courseRoutes from "./routes/course.routes";
import assignmentRoutes from "./routes/assignment.routes";
import examRoutes from "./routes/exam.routes";
import presentationRoutes from "./routes/presentation.routes";
import readingRoutes from "./routes/reading.routes";
import materialRoutes from "./routes/material.routes";
import uploadRoutes from "./routes/upload.routes";
import aiRoutes from "./routes/ai.routes";
import calendarRoutes from "./routes/calendar.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import taskRoutes from "./routes/task.routes";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.frontendUrl
      ? env.frontendUrl.split(",").map((origin) => origin.trim()).filter(Boolean)
      : true,
    credentials: true
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/dashboard", dashboardRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/presentations", presentationRoutes);
app.use("/api/readings", readingRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/calendar", calendarRoutes);

app.use(errorHandler);
