
import { useEffect, useMemo, useState } from "react";
import "./resources.css";

const initialResources = [
  {
    id: "react",
    title: "React Documentation",
    description: "Learn React components, props, state, and hooks.",
    subject: "Web Development",
    type: "External Link",
    url: "https://react.dev/",
    content: "",
    author: "StudySync",
    createdAt: "2026-10-22",
  },
  {
    id: "javascript",
    title: "JavaScript Guide",
    description: "Explore JavaScript fundamentals and language features.",
    subject: "Programming",
    type: "External Link",
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
    content: "",
    author: "StudySync",
    createdAt: "2026-10-22",
  },
  {
    id: "postgresql",
    title: "Database Fundamentals",
    description: "Learn about relational databases and PostgreSQL.",
    subject: "Database",
    type: "External Link",
    url: "https://www.postgresql.org/docs/",
    content: "",
    author: "StudySync",
    createdAt: "2026-10-22",
  },
  {
    id: "algorithms",
    title: "Data Structures and Algorithms",
    description: "Explore computer science learning materials.",
    subject: "Computer Science",
    type: "External Link",
    url: "https://ocw.mit.edu/",
    content: "",
    author: "StudySync",
    createdAt: "2026-10-22",
  },
  {
    id: "python",
    title: "Python Programming",
    description: "Start learning Python using the official tutorial.",
    subject: "Programming",
    type: "External Link",
    url: "https://docs.python.org/3/tutorial/",
    content: "",
    author: "StudySync",
    createdAt: "2026-10-22",
  },
  {
    id: "mathematics",
    title: "Mathematics Practice",
    description: "Practice mathematics with lessons and exercises.",
    subject: "Mathematics",
    type: "External Link",
    url: "https://www.khanacademy.org/math",
    content: "",
    author: "StudySync",
    createdAt: "2026-10-22",
  },
  {
    id: "git",
    title: "Git and GitHub Basics",
    description: "Learn version control and collaboration workflows.",
    subject: "Tools",
    type: "External Link",
    url: "https://docs.github.com/en/get-started",
    content: "",
    author: "StudySync",
    createdAt: "2026-10-22",
  },
];

const emptyForm = {
  title: "",
  subject: "Programming",
  description: "",
  content: "",
};

function ResourcesPage() {
  const [resources, setResources] = useState(initialResources);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("All");
  const [sort, setSort] = useState("newest");
  const [savedOnly, setSavedOnly] = useState(false);
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("studysync-resource-bookmarks") || "[]"
      );
    } catch {
      return [];
    }
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [readingResource, setReadingResource] = useState(null);

  useEffect(() => {
    localStorage.setItem(
      "studysync-resource-bookmarks",
      JSON.stringify(bookmarks)
    );
  }, [bookmarks]);

  const subjects = useMemo(
    () => [
      "All",
      ...new Set(resources.map((resource) => resource.subject)),
    ],
    [resources]
  );

  const filteredResources = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = resources.filter((resource) => {
      const matchesSearch = [
        resource.title,
        resource.description,
        resource.subject,
        resource.author,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);

      const matchesSubject =
        subject === "All" || resource.subject === subject;

      const matchesSaved =
        !savedOnly || bookmarks.includes(resource.id);

      return matchesSearch && matchesSubject && matchesSaved;
    });

    return filtered.sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "oldest") {
        return a.createdAt.localeCompare(b.createdAt);
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [resources, search, subject, sort, savedOnly, bookmarks]);

  function toggleBookmark(id) {
    setBookmarks((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function handleFormChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFormError("");
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const allowedExtensions = /\.(pdf|doc|docx)$/i;
    const validType =
      allowedTypes.includes(file.type) ||
      allowedExtensions.test(file.name);

    if (!validType) {
      setSelectedFile(null);
      event.target.value = "";
      setFormError("Please select a PDF, DOC, or DOCX document.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setSelectedFile(null);
      event.target.value = "";
      setFormError("The file must be 10 MB or smaller.");
      return;
    }

    setSelectedFile(file);
    setFormError("");
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!form.title.trim() || !form.content.trim()) {
      setFormError("Please enter a title and your note content.");
      return;
    }

    const newResource = {
      id: `note-${Date.now()}`,
      title: form.title.trim(),
      description:
        form.description.trim() || "A StudySync community study note.",
      subject: form.subject,
      type: "Study Note",
      url: "",
      content: form.content.trim(),
      author: "You",
      createdAt: new Date().toISOString().slice(0, 10),
      fileName: selectedFile?.name || "",
    };

    setResources((current) => [newResource, ...current]);
    setForm(emptyForm);
    setSelectedFile(null);
    setFormError("");
    setShowForm(false);
    setNotice(
      selectedFile
        ? "Note added. The selected file is not uploaded or saved yet."
        : "Your note was added to this page for this session."
    );
  }

  function closeForm() {
    setShowForm(false);
    setForm(emptyForm);
    setSelectedFile(null);
    setFormError("");
  }

  return (
    <main className="resources-page">
      <header className="resources-header">
        <div>
          <span className="resources-eyebrow">YOUR LEARNING LIBRARY</span>
          <h1>Study Resources</h1>
          <p>
            Discover learning materials and share useful notes with your
            StudySync community.
          </p>
        </div>

        <button
          className="resources-primary-button"
          onClick={() => {
            setNotice("");
            setShowForm(true);
          }}
        >
          <span aria-hidden="true">＋</span> Add Notes
        </button>
      </header>

      {notice && (
        <div className="resources-notice" role="status">
          {notice}
          <button onClick={() => setNotice("")} aria-label="Dismiss message">
            ×
          </button>
        </div>
      )}

      <section className="resources-summary" aria-label="Resource summary">
        <div className="resources-summary-card">
          <span className="summary-icon">📚</span>
          <div>
            <strong>{resources.length}</strong>
            <span>Resources in this session</span>
          </div>
        </div>
        <div className="resources-summary-card">
          <span className="summary-icon">📝</span>
          <div>
            <strong>
              {resources.filter((item) => item.type === "Study Note").length}
            </strong>
            <span>Study notes</span>
          </div>
        </div>
        <div className="resources-summary-card">
          <span className="summary-icon">🔖</span>
          <div>
            <strong>{bookmarks.length}</strong>
            <span>Saved resources</span>
          </div>
        </div>
      </section>

      <section className="resources-toolbar" aria-label="Find resources">
        <div className="resources-search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            placeholder="Search by title, subject, or author..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search resources"
          />
        </div>

        <select
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          aria-label="Filter by subject"
        >
          {subjects.map((item) => (
            <option key={item} value={item}>
              {item === "All" ? "All subjects" : item}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          aria-label="Sort resources"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="title">Title A–Z</option>
        </select>

        <button
          className={`resources-filter-button ${savedOnly ? "active" : ""}`}
          onClick={() => setSavedOnly((current) => !current)}
          aria-pressed={savedOnly}
        >
          🔖 {savedOnly ? "Showing saved" : "Saved only"}
        </button>
      </section>

      <div className="resources-section-heading">
        <div>
          <h2>Explore resources</h2>
          <p>
            {filteredResources.length}{" "}
            {filteredResources.length === 1 ? "result" : "results"} found
          </p>
        </div>
      </div>

      {filteredResources.length > 0 ? (
        <section className="resources-grid">
          {filteredResources.map((resource) => {
            const isSaved = bookmarks.includes(resource.id);
            const isNote = resource.type === "Study Note";

            return (
              <article className="resource-card" key={resource.id}>
                <div className="resource-card-top">
                  <span className="resource-type-badge">
                    {isNote ? "📝 Study Note" : "🌐 External Resource"}
                  </span>
                  <button
                    className={`resource-bookmark ${isSaved ? "saved" : ""}`}
                    onClick={() => toggleBookmark(resource.id)}
                    aria-label={
                      isSaved ? "Remove bookmark" : "Save resource"
                    }
                    aria-pressed={isSaved}
                    title={isSaved ? "Remove bookmark" : "Save resource"}
                  >
                    {isSaved ? "★" : "☆"}
                  </button>
                </div>

                <span className="resource-subject">{resource.subject}</span>
                <h3>{resource.title}</h3>
                <p className="resource-description">{resource.description}</p>

                <div className="resource-meta">
                  <span>By {resource.author}</span>
                  <span>{resource.createdAt}</span>
                </div>

                {resource.fileName && (
                  <p className="resource-file-label">
                    📎 Selected file: {resource.fileName}
                  </p>
                )}

                <div className="resource-card-actions">
                  {isNote ? (
                    <button
                      className="resource-open-button"
                      onClick={() => setReadingResource(resource)}
                    >
                      Read Notes <span aria-hidden="true">→</span>
                    </button>
                  ) : (
                    <a
                      className="resource-open-button"
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open Resource <span aria-hidden="true">↗</span>
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <div className="resources-empty">
          <span aria-hidden="true">🔎</span>
          <h3>No resources found</h3>
          <p>Try another search or change your filters.</p>
          <button
            className="resources-secondary-button"
            onClick={() => {
              setSearch("");
              setSubject("All");
              setSavedOnly(false);
            }}
          >
            Clear filters
          </button>
        </div>
      )}

      {showForm && (
        <div
          className="resources-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <section
            className="resources-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-note-title"
          >
            <div className="resources-modal-header">
              <div>
                <span className="resources-eyebrow">COMMUNITY CONTRIBUTION</span>
                <h2 id="add-note-title">Add your study notes</h2>
                <p>Share original notes to help your learning community.</p>
              </div>
              <button
                className="resources-modal-close"
                onClick={closeForm}
                aria-label="Close form"
              >
                ×
              </button>
            </div>

            <form className="resources-form" onSubmit={handleSubmit}>
              <label>
                Note title <span>*</span>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  placeholder="e.g. React Hooks — Quick Revision"
                  maxLength={120}
                  required
                />
              </label>

              <label>
                Subject <span>*</span>
                <select
                  name="subject"
                  value={form.subject}
                  onChange={handleFormChange}
                  required
                >
                  <option>Programming</option>
                  <option>Web Development</option>
                  <option>Database</option>
                  <option>Computer Science</option>
                  <option>Mathematics</option>
                  <option>Tools</option>
                  <option>Other</option>
                </select>
              </label>

              <label>
                Short description
                <input
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  placeholder="What will students learn from these notes?"
                  maxLength={240}
                />
              </label>

              <label>
                Note content <span>*</span>
                <textarea
                  name="content"
                  value={form.content}
                  onChange={handleFormChange}
                  placeholder="Write your original notes here..."
                  rows={7}
                  maxLength={20000}
                  required
                />
                <span className="resources-character-count">
                  {form.content.length}/20000 characters
                </span>
              </label>

              <label>
                Attach a document (optional)
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf"
                  onChange={handleFileChange}
                />
                <span className="resources-field-hint">
                  PDF, DOC, or DOCX · Maximum 10 MB. The file is only selected
                  locally; uploading will be added when backend integration is
                  ready.
                </span>
              </label>

              {formError && (
                <p className="resources-form-error" role="alert">
                  {formError}
                </p>
              )}

              <p className="resources-form-disclaimer">
                Share material you created or have permission to distribute.
                Your note is a frontend prototype and is not yet submitted for
                shared review.
              </p>

              <div className="resources-form-actions">
                <button
                  type="button"
                  className="resources-secondary-button"
                  onClick={closeForm}
                >
                  Cancel
                </button>
                <button type="submit" className="resources-primary-button">
                  Add Note
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {readingResource && (
        <div
          className="resources-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setReadingResource(null);
            }
          }}
        >
          <article
            className="resources-modal resources-reading-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reading-note-title"
          >
            <div className="resources-modal-header">
              <div>
                <span className="resource-subject">
                  {readingResource.subject}
                </span>
                <h2 id="reading-note-title">{readingResource.title}</h2>
                <p>
                  By {readingResource.author} · {readingResource.createdAt}
                </p>
              </div>
              <button
                className="resources-modal-close"
                onClick={() => setReadingResource(null)}
                aria-label="Close notes"
              >
                ×
              </button>
            </div>

            <p className="reading-description">
              {readingResource.description}
            </p>
            <div className="reading-note-content">{readingResource.content}</div>

            {readingResource.fileName && (
              <p className="resources-field-hint">
                Selected file: {readingResource.fileName}. The file contents
                are not available because upload and storage are not connected.
              </p>
            )}

            <div className="resources-form-actions">
              <button
                className="resources-secondary-button"
                onClick={() => setReadingResource(null)}
              >
                Close
              </button>
            </div>
          </article>
        </div>
      )}
    </main>
  );
}

export default ResourcesPage;
