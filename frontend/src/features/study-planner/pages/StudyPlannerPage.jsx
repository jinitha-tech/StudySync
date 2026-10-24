
import { useState, useEffect } from "react";
import "../study-planner.css";
const API_URL = "http://localhost:5050/api/planner";

function fromApiTask(task) {
  return {
    id: task.id,
    title: task.title,
    subject: task.description || "",
    dueDate: task.deadline || "",
    priority:
      (task.priority || "medium").charAt(0).toUpperCase() +
      (task.priority || "medium").slice(1),
    completed: task.completed,
  };
}

function toApiTask(task) {
  return {
    title: task.title,
    description: task.subject,
    deadline: task.dueDate || null,
    priority: task.priority.toLowerCase(),
    completed: task.completed,
  };
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Request failed: ${response.status}`);
  }

  return response.status === 204 ? null : response.json();
}

const STORAGE_KEY = "studysync-study-planner-tasks";

const initialTasks = [
  {
    id: 1,
    title: "Review lecture notes",
    subject: "Computer Science",
    dueDate: "2026-10-21",
    priority: "High",
    completed: false,
  },
  {
    id: 2,
    title: "Practice mathematics problems",
    subject: "Mathematics",
    dueDate: "2026-10-23",
    priority: "Medium",
    completed: false,
  },
];

function getDeadlineStatus(task) {
  if (task.completed) return "Completed";
  if (!task.dueDate) return "No due date";

  const dueDate = new Date(`${task.dueDate}T00:00:00`);

  if (Number.isNaN(dueDate.getTime())) return "No due date";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (dueDate < today) return "Overdue";
  if (dueDate.getTime() === today.getTime()) return "Due today";

  return "Upcoming";
}

function loadTasks() {
  try {
    const savedTasks = localStorage.getItem(STORAGE_KEY);

    if (savedTasks !== null) {
      const parsedTasks = JSON.parse(savedTasks);

      if (Array.isArray(parsedTasks)) {
        return parsedTasks;
      }
    }
  } catch (error) {
    console.error("Could not load saved study tasks:", error);
  }

  return initialTasks;
}

function StudyPlannerPage() {
  const [tasks, setTasks] = useState([]);
const [loading, setLoading] = useState(true);
const [apiError, setApiError] = useState("");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [filter, setFilter] = useState("All");
  const [editingTaskId, setEditingTaskId] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("dueDateAsc");

  useEffect(() => {
  apiRequest(API_URL)
    .then((result) => {
      setTasks(result.data.map(fromApiTask));
    })
    .catch((error) => {
      setApiError(error.message);
    })
    .finally(() => setLoading(false));
}, []);

  function resetForm() {
    setEditingTaskId(null);
    setTitle("");
    setSubject("");
    setDueDate("");
    setPriority("Medium");
  }

  async function handleAddTask(event) {
  event.preventDefault();

  const trimmedTitle = title.trim();
  const trimmedSubject = subject.trim();

  if (!trimmedTitle || !trimmedSubject || !dueDate) return;

  const payload = toApiTask({
    title: trimmedTitle,
    subject: trimmedSubject,
    dueDate,
    priority,
    completed: false,
  });

  try {
    setApiError("");

    if (editingTaskId !== null) {
      const result = await apiRequest(
        `${API_URL}/${editingTaskId}`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        }
      );

      setTasks((current) =>
        current.map((task) =>
          task.id === editingTaskId
            ? fromApiTask(result.data)
            : task
        )
      );
    } else {
      const result = await apiRequest(API_URL, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setTasks((current) => [...current, fromApiTask(result.data)]);
    }

    resetForm();
  } catch (error) {
    setApiError(error.message);
  }
}

async function handleToggleTask(taskId) {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) return;

  try {
    setApiError("");

    const result = await apiRequest(
      `${API_URL}/${taskId}/complete`,
      {
        method: "PATCH",
        body: JSON.stringify({ completed: !task.completed }),
      }
    );

    setTasks((current) =>
      current.map((item) =>
        item.id === taskId ? fromApiTask(result.data) : item
      )
    );
  } catch (error) {
    setApiError(error.message);
  }
}

async function handleDeleteTask(taskId) {
  try {
    setApiError("");
    await apiRequest(`${API_URL}/${taskId}`, { method: "DELETE" });

    setTasks((current) =>
      current.filter((task) => task.id !== taskId)
    );

    if (editingTaskId === taskId) resetForm();
  } catch (error) {
    setApiError(error.message);
  }
}

    

  const completedCount = tasks.filter((task) => task.completed).length;
  const pendingCount = tasks.length - completedCount;

  const filteredTasks = tasks
    .filter((task) => {
      if (filter === "Pending") return !task.completed;
      if (filter === "Completed") return task.completed;
      return true;
    })
    .filter((task) => {
      const query = searchQuery.trim().toLowerCase();

      if (!query) return true;

      return (
        task.title.toLowerCase().includes(query) ||
        task.subject.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "dueDateAsc":
          return (a.dueDate || "9999-12-31").localeCompare(
            b.dueDate || "9999-12-31"
          );

        case "dueDateDesc":
          return (b.dueDate || "").localeCompare(a.dueDate || "");

        case "priority": {
          const priorityRank = { High: 0, Medium: 1, Low: 2 };
          return (
            (priorityRank[a.priority] ?? 3) -
            (priorityRank[b.priority] ?? 3)
          );
        }

        case "title":
          return a.title.localeCompare(b.title);

        default:
          return 0;
      }
    });

  return (
    <section className="planner-page">
      <header className="planner-header">
        <div>
          <p className="planner-eyebrow">YOUR LEARNING, ORGANIZED</p>
          <h2>Study Planner</h2>
          <p>Plan your tasks, stay on track, and reach your study goals.</p>
        </div>

        <div className="planner-progress">
          <span>Completed tasks</span>
          <strong>
            {completedCount} / {tasks.length}
          </strong>
          <span>{pendingCount} tasks remaining</span>
        </div>
      </header>
{apiError && <p role="alert">{apiError}</p>}
{loading && <p>Loading study tasks...</p>}
      <section className="planner-panel">
        <h3>{editingTaskId !== null ? "Edit study task" : "Add a study task"}</h3>

        <form className="planner-form" onSubmit={handleAddTask}>
          <label>
            Task name
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Review chapter 3"
              required
            />
          </label>

          <label>
            Subject
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="e.g. Biology"
              required
            />
          </label>

          <label>
            Due date
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              required
            />
          </label>

          <label>
            Priority
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </label>

          <button type="submit" className="planner-add-button">
            {editingTaskId !== null ? "Save changes" : "+ Add task"}
          </button>

          {editingTaskId !== null && (
            <button
              type="button"
              className="planner-cancel-button"
              onClick={resetForm}
            >
              Cancel
            </button>
          )}
        </form>
      </section>

      <section className="planner-panel">
        <div className="planner-list-header">
          <h3>Your study tasks</h3>
          <span>{tasks.length} total</span>
        </div>

        <div className="planner-filters">
          {["All", "Pending", "Completed"].map((option) => {
            const count =
              option === "All"
                ? tasks.length
                : option === "Pending"
                  ? pendingCount
                  : completedCount;

            return (
              <button
                key={option}
                type="button"
                className={`planner-filter-button ${
                  filter === option ? "active" : ""
                }`}
                onClick={() => setFilter(option)}
                aria-pressed={filter === option}
              >
                {option} ({count})
              </button>
            );
          })}
        </div>

        <div className="planner-search-sort">
          <label className="planner-search">
            <span>Search tasks</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by task name or subject..."
            />
          </label>

          <label className="planner-sort">
            <span>Sort by</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="dueDateAsc">Due date: earliest first</option>
              <option value="dueDateDesc">Due date: latest first</option>
              <option value="priority">Priority: high to low</option>
              <option value="title">Task name: A to Z</option>
            </select>
          </label>
        </div>

        {filteredTasks.length === 0 ? (
          <p className="planner-empty">
            {tasks.length === 0
              ? "No tasks yet. Add your first study task above!"
              : searchQuery.trim()
                ? "No tasks match your search. Try another keyword."
                : `No ${filter.toLowerCase()} tasks to show.`}
          </p>
        ) : (
          <div className="planner-task-list">
            {filteredTasks.map((task) => {
              const deadlineStatus = getDeadlineStatus(task);
              const statusClass = deadlineStatus
                .toLowerCase()
                .replace(/\s+/g, "-");

              return (
                <article className="planner-task" key={task.id}>
                  <input
                    type="checkbox"
                    checked={Boolean(task.completed)}
                    onChange={() => handleToggleTask(task.id)}
                    aria-label={`Mark ${task.title} as ${
                      task.completed ? "incomplete" : "complete"
                    }`}
                  />

                  <div className="planner-task-details">
                    <h4 className={task.completed ? "task-completed" : ""}>
                      {task.title}
                    </h4>
                    <p>
                      {task.subject} · Due{" "}
                      {task.dueDate
                        ? new Date(
                            `${task.dueDate}T00:00:00`
                          ).toLocaleDateString()
                        : "Not set"}
                    </p>

                    <span
                      className={`planner-deadline-status status-${statusClass}`}
                    >
                      {deadlineStatus}
                    </span>
                  </div>

                  <span
                    className={`planner-priority priority-${(
                      task.priority || "Medium"
                    ).toLowerCase()}`}
                  >
                    {task.priority || "Medium"}
                  </span>

                  <button
                    type="button"
                    className="planner-edit-button"
                    onClick={() => handleStartEdit(task)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="planner-delete-button"
                    onClick={() => handleDeleteTask(task.id)}
                    aria-label={`Delete ${task.title}`}
                  >
                    Delete
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}

export default StudyPlannerPage;
