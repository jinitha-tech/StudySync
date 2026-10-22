
import StatsGrid from '../components/StatsGrid'
import '../dashboard.css'
import WeeklyActivity from '../components/WeeklyActivity'
import UpcomingDeadlines from "../components/UpcomingDeadlines";

function DashboardPage() {
  return (
    <div className="dashboard-page">
      <section className="dashboard-welcome">
        <div>
          <p className="dashboard-eyebrow">MONDAY MOTIVATION</p>
          <h2>Welcome back, Student! 👋</h2>
          <p className="dashboard-description">
            Small steps every day lead to big results. Let's make today count.
          </p>
        </div>

        <div className="daily-goal">
          <span>Today's goal</span>
          <strong>2 hours</strong>
          <span>Keep building your consistency</span>
        </div>
      </section>
    
      <StatsGrid />
      <WeeklyActivity />
      <UpcomingDeadlines />
    </div>
  )
}

export default DashboardPage
