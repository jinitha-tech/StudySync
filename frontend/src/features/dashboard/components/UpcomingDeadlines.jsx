
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "studysync-study-planner-tasks";

function getDeadlineStatus(task) {
  if (task.completed) return "Completed";
  if (!task.dueDate) return "No due date";

  const dueDate = new Date(`${task.dueDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (Number.isNaN(dueDate.getTime())) return "No due date";
  if (dueDate < today) return "Overdue";
  if (dueDate.getTime() === today.getTime()) return "Due today";

  return "Upcoming";
}

function UpcomingDeadlines() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    function loadTasks() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : [];
        setTasks(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.error("Could not load study planner tasks:", error);
        setTasks([]);
      }
    }

    loadTasks();

    // Refresh when the user returns to this tab.
    window.addEventListener("focus", loadTasks);
    window.addEventListener("storage", loadTasks);

    return () => {
      window.removeEventListener("focus", loadTasks);
      window.removeEventListener("storage", loadTasks);
    };
  }, []);

  const upcomingTasks = tasks
    .filter((task) => !task.completed && task.dueDate)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  return (
    <section className="deadlines-card">
      <div className="deadlines-header">
        <div>
          <h3>Upcoming deadlines</h3>
          <p>Stay on top of your study tasks.</p>
        </div>

        <Link to="/study-planner" className="deadlines-link">
          View planner →
        </Link>
      </div>

      {upcomingTasks.length === 0 ? (
        <div className="deadlines-empty">
          <span className="deadlines-empty-icon" aria-hidden="true">
            ✓
          </span>
          <p>You're all caught up!</p>
          <span>Add a task in your Study Planner to see it here.</span>
          <Link to="/study-planner" className="deadlines-add-link">
            + Add a study task
          </Link>
        </div>
      ) : (
        <div className="deadlines-list">
          {upcomingTasks.map((task) => {
            const status = getDeadlineStatus(task);

            return (
              <article className="deadline-item" key={task.id}>
                <div className="deadline-date">
                  <span>
                    {new Date(
                      `${task.dueDate}T00:00:00`
                    ).toLocaleDateString("en", { month: "short" })}
                  </span>
                  <strong>
                    {new Date(
                      `${task.dueDate}T00:00:00`
                    ).getDate()}
                  </strong>
                </div>

                <div className="deadline-details">
                  <h4>{task.title}</h4>
                  <p>{task.subject || "General study"}</p>
                </div>

                <span
                  className={`deadline-status deadline-${status
                    .toLowerCase()
                    .replace(/\s+/g, "-")}`}
                >
                  {status}
                </span>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default UpcomingDeadlines;
