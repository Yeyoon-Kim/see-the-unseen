import type { Request, Response } from "express";
import { getDashboardData } from "../services/dashboardService";

export async function dashboard(_req: Request, res: Response) {
  res.json(await getDashboardData());
}

