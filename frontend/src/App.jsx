import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "./components/layout/AppLayout";
import WelcomePage from "./features/auth/pages/WelcomePage";
import Login from "./features/auth/pages/Login";
import Signup from "./features/auth/pages/Signup";
import ForgotPassword from "./features/auth/pages/ForgotPassword";
import ResetPassword from "./features/auth/pages/ResetPassword";
import DashboardPage from "./features/dashboard/pages/DashboardPage";
import StudyRoomsPage from "./features/study-rooms/pages/StudyRoomsPage";
import StudyRoomWorkspace from "./features/study-rooms/pages/StudyRoomWorkspace";
import StudyPlannerPage from "./features/study-planner/pages/StudyPlannerPage";
import ResourcesPage from "./features/resources/pages/ResourcesPage";
import StudyTrackingPage from "./features/study-tracking/pages/StudyTrackingPage";
import AnalyticsPage from "./features/analytics/pages/AnalyticsPage";
import NotificationsPage from "./features/notifications/NotificationsPage";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import PublicRoute from "./components/layout/PublicRoute";
import Toast from "./components/ui/Toast";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Toast />
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <Signup />
                </PublicRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              }
            />
            <Route
              path="/reset-password"
              element={
                <PublicRoute>
                  <ResetPassword />
                </PublicRoute>
              }
            />

            {/* Protected Workspace Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/study-rooms" element={<StudyRoomsPage />} />
                <Route
                  path="/study-rooms/:roomId"
                  element={<StudyRoomWorkspace />}
                />
                <Route path="/study-planner" element={<StudyPlannerPage />} />
                <Route path="/resources" element={<ResourcesPage />} />
                <Route path="/study-tracking" element={<StudyTrackingPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
