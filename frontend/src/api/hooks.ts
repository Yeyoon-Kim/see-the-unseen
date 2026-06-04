import { useQuery } from "@tanstack/react-query";
import { api } from "./client";
import type { Course } from "../types";

export function useCourses() {
  return useQuery({
    queryKey: ["courses"],
    queryFn: async () => (await api.get<Course[]>("/courses")).data
  });
}

