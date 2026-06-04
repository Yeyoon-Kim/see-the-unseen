import { Route, Routes } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { CoursesPage } from "./pages/CoursesPage";
import { CourseDetailPage } from "./pages/CourseDetailPage";
import { UploadPage } from "./pages/UploadPage";
import { AssignmentsPage } from "./pages/AssignmentsPage";
import { ExamsPage } from "./pages/ExamsPage";
import { PresentationsPage } from "./pages/PresentationsPage";
import { ReadingsPage } from "./pages/ReadingsPage";
import { MaterialsPage } from "./pages/MaterialsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ThemePage } from "./pages/ThemePage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/today" element={<DashboardPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:id" element={<CourseDetailPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/assignments" element={<AssignmentsPage />} />
        <Route path="/exams" element={<ExamsPage />} />
        <Route path="/presentations" element={<PresentationsPage />} />
        <Route path="/readings" element={<ReadingsPage />} />
        <Route path="/materials" element={<MaterialsPage />} />
        <Route path="/theme" element={<ThemePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
