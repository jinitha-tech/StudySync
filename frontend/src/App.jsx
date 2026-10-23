
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import AppLayout from './components/layout/AppLayout'
import DashboardPage from './features/dashboard/pages/DashboardPage'
import StudyRoomsPage from './features/study-rooms/pages/StudyRoomsPage'
import StudyPlannerPage from './features/study-planner/pages/StudyPlannerPage'
import ResourcesPage from './features/resources/pages/ResourcesPage'
import StudyTrackingPage from './features/study-tracking/pages/StudyTrackingPage'
import AnalyticsPage from './features/analytics/pages/AnalyticsPage'
import NotificationsPage from './features/notifications/NotificationsPage'

import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/study-rooms" element={<StudyRoomsPage />} />
          <Route path="/study-planner" element={<StudyPlannerPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/study-tracking" element={<StudyTrackingPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
