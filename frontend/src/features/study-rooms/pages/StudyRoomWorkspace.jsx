
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "../study-rooms.css";

const initialRooms = [
  {
    id: 1,
    name: "React Study Group",
    subject: "Programming",
    description: "Learn React concepts and practise coding together.",
    members: 4,
    capacity: 8,
    status: "Active",
  },
  {
    id: 2,
    name: "Exam Preparation",
    subject: "Mathematics",
    description: "Revise important topics and solve practice problems.",
    members: 6,
    capacity: 10,
    status: "Active",
  },
  {
    id: 3,
    name: "Focus & Read",
    subject: "General Studies",
    description: "A quiet space for focused study sessions.",
    members: 2,
    capacity: 6,
    status: "Active",
  },
];

const tabs = ["Overview", "Resources", "Shared Notes", "Doubts"];

function readStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function StudyRoomWorkspace() {
  const { roomId } = useParams();

  const rooms = readStorage("studysync-study-rooms", initialRooms);
  const room = rooms.find((item) => String(item.id) === roomId);

  const storageKey = `studysync-room-${roomId}`;

  const [activeTab, setActiveTab] = useState("Overview");
  const [resources, setResources] = useState(() =>
    readStorage(`${storageKey}-resources`, [])
  );
  const [notes, setNotes] = useState(() =>
    readStorage(`${storageKey}-notes`, [])
  );
  const [doubts, setDoubts] = useState(() =>
    readStorage(`${storageKey}-doubts`, [])
  );

  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [resourceType, setResourceType] = useState("Lecture");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [doubtTitle, setDoubtTitle] = useState("");
  const [doubtContent, setDoubtContent] = useState("");
  const [replyInputs, setReplyInputs] = useState({});
  const [seconds, setSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    localStorage.setItem(`${storageKey}-resources`, JSON.stringify(resources));
  }, [resources, storageKey]);

  useEffect(() => {
    localStorage.setItem(`${storageKey}-notes`, JSON.stringify(notes));
  }, [notes, storageKey]);

  useEffect(() => {
    localStorage.setItem(`${storageKey}-doubts`, JSON.stringify(doubts));
  }, [doubts, storageKey]);

  useEffect(() => {
    if (!timerRunning) return undefined;

    const intervalId = setInterval(() => {
      setSeconds((previous) => previous + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timerRunning]);

  function addResource(event) {
    event.preventDefault();

    const title = resourceTitle.trim();
    const url = resourceUrl.trim();

    if (!title || !url) return;

    try {
      const parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return;
      }
    } catch {
      return;
    }

    setResources((previous) => [
      {
        id: Date.now(),
        title,
        url,
        type: resourceType,
      },
      ...previous,
    ]);

    setResourceTitle("");
    setResourceUrl("");
  }

  function addNote(event) {
    event.preventDefault();

    if (!noteTitle.trim() || !noteContent.trim()) return;

    setNotes((previous) => [
      {
        id: Date.now(),
        title: noteTitle.trim(),
        content: noteContent.trim(),
        updatedAt: new Date().toLocaleDateString(),
      },
      ...previous,
    ]);

    setNoteTitle("");
    setNoteContent("");
  }

  function addDoubt(event) {
    event.preventDefault();

    if (!doubtTitle.trim() || !doubtContent.trim()) return;

    setDoubts((previous) => [
      {
        id: Date.now(),
        title: doubtTitle.trim(),
        content: doubtContent.trim(),
        resolved: false,
        replies: [],
      },
      ...previous,
    ]);

    setDoubtTitle("");
    setDoubtContent("");
  }

  function addReply(doubtId) {
    const reply = (replyInputs[doubtId] || "").trim();
    if (!reply) return;

    setDoubts((previous) =>
      previous.map((doubt) =>
        doubt.id === doubtId
          ? {
              ...doubt,
              replies: [
                ...doubt.replies,
                { id: Date.now(), content: reply },
              ],
            }
          : doubt
      )
    );

    setReplyInputs((previous) => ({ ...previous, [doubtId]: "" }));
  }

  function toggleResolved(doubtId) {
    setDoubts((previous) =>
      previous.map((doubt) =>
        doubt.id === doubtId
          ? { ...doubt, resolved: !doubt.resolved }
          : doubt
      )
    );
  }

  function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    return [hours, minutes, secs]
      .map((value) => String(value).padStart(2, "0"))
      .join(":");
  }

  if (!room) {
    return (
      <main className="study-rooms-page">
        <h1>Study room not found</h1>
        <p>This room may have been removed or the link may be incorrect.</p>
        <Link to="/study-rooms">Back to Study Rooms</Link>
      </main>
    );
  }

  return (
    <main className="study-rooms-page workspace-page">
      <Link className="workspace-back-link" to="/study-rooms">
        ← Back to Study Rooms
      </Link>

      <header className="workspace-hero">
        <div>
          <span className="room-subject">{room.subject}</span>
          <h1>{room.name}</h1>
          <p>{room.description}</p>
          <span className="workspace-member-count">
            👥 {room.members} members
          </span>
        </div>
      </header>

      <nav className="workspace-tabs" aria-label="Study room sections">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`workspace-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            {tab === "Resources" && ` (${resources.length})`}
            {tab === "Shared Notes" && ` (${notes.length})`}
            {tab === "Doubts" && ` (${doubts.length})`}
          </button>
        ))}
      </nav>

      {activeTab === "Overview" && (
        <section className="workspace-content">
          <h2>Your study space</h2>
          <p>
            Share useful materials, write revision notes, and help one another
            understand difficult topics.
          </p>

          <div className="workspace-summary-grid">
            <button type="button" className="workspace-summary-card" onClick={() => setActiveTab("Resources")}>
              <span>📚</span>
              <strong>Shared Resources</strong>
              <small>{resources.length} materials</small>
            </button>

            <button type="button" className="workspace-summary-card" onClick={() => setActiveTab("Shared Notes")}>
              <span>📝</span>
              <strong>Shared Notes</strong>
              <small>{notes.length} notes</small>
            </button>

            <button type="button" className="workspace-summary-card" onClick={() => setActiveTab("Doubts")}>
              <span>💬</span>
              <strong>Doubts & Discussions</strong>
              <small>{doubts.filter((doubt) => !doubt.resolved).length} open doubts</small>
            </button>
          </div>

          <div className="workspace-focus-card">
            <div>
              <h3>Focus Timer</h3>
              <p>Track the time you spend studying in this room.</p>
            </div>
            <strong className="workspace-timer">{formatTime(seconds)}</strong>
            <div className="workspace-timer-actions">
              <button
                type="button"
                className="room-action-button"
                onClick={() => setTimerRunning((running) => !running)}
              >
                {timerRunning ? "Pause" : "Start Focus"}
              </button>
              <button
                type="button"
                className="workspace-secondary-button"
                onClick={() => {
                  setTimerRunning(false);
                  setSeconds(0);
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </section>
      )}

      {activeTab === "Resources" && (
        <section className="workspace-content">
          <h2>Shared Resources & Lectures</h2>
          <p>Add lecture recordings, reference websites, and links to study material.</p>

          <form className="workspace-form" onSubmit={addResource}>
            <label htmlFor="resource-title">Resource title</label>
            <input
              id="resource-title"
              value={resourceTitle}
              onChange={(event) => setResourceTitle(event.target.value)}
              placeholder="e.g. Introduction to React Hooks"
              maxLength={100}
              required
            />

            <label htmlFor="resource-type">Resource type</label>
            <select
              id="resource-type"
              value={resourceType}
              onChange={(event) => setResourceType(event.target.value)}
            >
              <option>Lecture</option>
              <option>PDF / Document</option>
              <option>Reference Link</option>
              <option>Video</option>
            </select>

            <label htmlFor="resource-url">Resource URL</label>
            <input
              id="resource-url"
              type="url"
              value={resourceUrl}
              onChange={(event) => setResourceUrl(event.target.value)}
              placeholder="https://..."
              required
            />

            <button className="room-action-button" type="submit">
              + Share Resource
            </button>
          </form>

          <div className="workspace-list">
            {resources.map((resource) => (
              <article className="workspace-item" key={resource.id}>
                <span className="workspace-item-icon">📎</span>
                <div className="workspace-item-body">
                  <span className="workspace-item-type">{resource.type}</span>
                  <h3>{resource.title}</h3>
                  <a href={resource.url} target="_blank" rel="noreferrer">
                    Open resource ↗
                  </a>
                </div>
                <button
                  type="button"
                  className="workspace-delete-button"
                  onClick={() => setResources((previous) => previous.filter((item) => item.id !== resource.id))}
                  aria-label={`Delete ${resource.title}`}
                >
                  Delete
                </button>
              </article>
            ))}
            {resources.length === 0 && (
              <p className="workspace-empty">No resources yet. Share the first lecture or study link!</p>
            )}
          </div>
        </section>
      )}

      {activeTab === "Shared Notes" && (
        <section className="workspace-content">
          <h2>Shared Notes</h2>
          <p>Create revision notes for everyone using this browser profile.</p>

          <form className="workspace-form" onSubmit={addNote}>
            <label htmlFor="note-title">Note title</label>
            <input
              id="note-title"
              value={noteTitle}
              onChange={(event) => setNoteTitle(event.target.value)}
              placeholder="e.g. React Hooks Summary"
              maxLength={100}
              required
            />

            <label htmlFor="note-content">Note content</label>
            <textarea
              id="note-content"
              value={noteContent}
              onChange={(event) => setNoteContent(event.target.value)}
              placeholder="Write your explanation, key points, or revision notes..."
              rows={5}
              maxLength={10000}
              required
            />

            <button className="room-action-button" type="submit">
              + Save Note
            </button>
          </form>

          <div className="workspace-list">
            {notes.map((note) => (
              <article className="workspace-item workspace-note" key={note.id}>
                <div className="workspace-item-body">
                  <h3>{note.title}</h3>
                  <small>Updated {note.updatedAt}</small>
                  <p className="workspace-note-content">{note.content}</p>
                </div>
                <button
                  type="button"
                  className="workspace-delete-button"
                  onClick={() => setNotes((previous) => previous.filter((item) => item.id !== note.id))}
                  aria-label={`Delete ${note.title}`}
                >
                  Delete
                </button>
              </article>
            ))}
            {notes.length === 0 && (
              <p className="workspace-empty">No notes yet. Create your first set of revision notes!</p>
            )}
          </div>
        </section>
      )}

      {activeTab === "Doubts" && (
        <section className="workspace-content">
          <h2>Doubts & Discussions</h2>
          <p>Ask questions, discuss concepts, and mark doubts as resolved.</p>

          <form className="workspace-form" onSubmit={addDoubt}>
            <label htmlFor="doubt-title">Question title</label>
            <input
              id="doubt-title"
              value={doubtTitle}
              onChange={(event) => setDoubtTitle(event.target.value)}
              placeholder="e.g. When should I use useEffect?"
              maxLength={150}
              required
            />

            <label htmlFor="doubt-content">Explain your doubt</label>
            <textarea
              id="doubt-content"
              value={doubtContent}
              onChange={(event) => setDoubtContent(event.target.value)}
              placeholder="Add details so others can help you..."
              rows={4}
              maxLength={5000}
              required
            />

            <button className="room-action-button" type="submit">
              + Post Doubt
            </button>
          </form>

          <div className="workspace-list">
            {doubts.map((doubt) => (
              <article className="workspace-item workspace-doubt" key={doubt.id}>
                <div className="workspace-item-body">
                  <span className={`doubt-status ${doubt.resolved ? "resolved" : ""}`}>
                    {doubt.resolved ? "Resolved" : "Open question"}
                  </span>
                  <h3>{doubt.title}</h3>
                  <p className="workspace-note-content">{doubt.content}</p>

                  <button
                    type="button"
                    className="workspace-secondary-button"
                    onClick={() => toggleResolved(doubt.id)}
                  >
                    {doubt.resolved ? "Reopen doubt" : "Mark as resolved"}
                  </button>

                  <div className="workspace-replies">
                    <strong>Replies ({doubt.replies.length})</strong>
                    {doubt.replies.map((reply) => (
                      <p className="workspace-reply" key={reply.id}>
                        {reply.content}
                      </p>
                    ))}

                    <div className="workspace-reply-form">
                      <input
                        aria-label={`Reply to ${doubt.title}`}
                        value={replyInputs[doubt.id] || ""}
                        onChange={(event) => setReplyInputs((previous) => ({
                          ...previous,
                          [doubt.id]: event.target.value,
                        }))}
                        placeholder="Write an answer..."
                        maxLength={2000}
                      />
                      <button
                        type="button"
                        className="room-action-button"
                        onClick={() => addReply(doubt.id)}
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
            {doubts.length === 0 && (
              <p className="workspace-empty">No doubts posted yet. Ask a question to start a discussion!</p>
            )}
          </div>
        </section>
      )}
    </main>
  );
}

export default StudyRoomWorkspace;
