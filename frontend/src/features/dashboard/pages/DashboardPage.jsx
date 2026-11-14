import StatsGrid from '../components/StatsGrid'
import '../dashboard.css'
import WeeklyActivity from '../components/WeeklyActivity'
import UpcomingDeadlines from '../components/UpcomingDeadlines'
import DailyStudyGoal from '../components/DailyStudyGoal'
import DashboardQuickActions from '../components/DashboardQuickActions'
import { useAuth } from '../../../context/useAuth'

function DashboardPage() {
  const { user } = useAuth();
  const studentName = user?.name || "Student";

  return (
    <div className="dashboard-page">
      <section className="dashboard-welcome">
        <div>
          <p className="dashboard-eyebrow">YOUR STUDY SPACE</p>
          <h2>Welcome back, {studentName}! 👋</h2>
          <p className="dashboard-description">
            Small steps every day lead to big results. Let's make today count.
          </p>
        </div>

        <DailyStudyGoal />
      </section>

      <StatsGrid />
      <DashboardQuickActions />
      <div id="weekly-activity">
        <WeeklyActivity />
      </div>
      <UpcomingDeadlines />
    </div>
  )
}

export default DashboardPage
