
import { useState } from "react";
import RoomCard from "../components/RoomCard";
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
    description: "A quiet virtual space for focused study sessions.",
    members: 2,
    capacity: 6,
    status: "Active",
  },
];

function StudyRoomsPage() {
  const [rooms, setRooms] = useState(() => {
    try {
      const saved = localStorage.getItem("studysync-study-rooms");
      return saved ? JSON.parse(saved) : initialRooms;
    } catch {
      return initialRooms;
    }
  });

  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("All");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [roomSubject, setRoomSubject] = useState("Programming");
  const [description, setDescription] = useState("");

  function saveRooms(updatedRooms) {
    setRooms(updatedRooms);
    localStorage.setItem(
      "studysync-study-rooms",
      JSON.stringify(updatedRooms)
    );
  }

  function joinRoom(roomId) {
    const updatedRooms = rooms.map((room) => {
      if (room.id !== roomId || room.joined) return room;
      if (room.members >= room.capacity) return room;

      return {
        ...room,
        members: room.members + 1,
        joined: true,
      };
    });

    saveRooms(updatedRooms);
  }

  function leaveRoom(roomId) {
    const updatedRooms = rooms.map((room) => {
      if (room.id !== roomId || !room.joined) return room;

      return {
        ...room,
        members: Math.max(0, room.members - 1),
        joined: false,
      };
    });

    saveRooms(updatedRooms);
  }

  function createRoom(event) {
    event.preventDefault();

    const name = roomName.trim();
    if (!name) return;

    const newRoom = {
      id: Date.now(),
      name,
      subject: roomSubject,
      description: description.trim() || "Let's study together!",
      members: 1,
      capacity: 8,
      status: "Active",
      joined: true,
    };

    saveRooms([newRoom, ...rooms]);
    setRoomName("");
    setDescription("");
    setShowCreateForm(false);
  }

  const subjects = [
    "All",
    ...new Set(rooms.map((room) => room.subject)),
  ];

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch =
      room.name.toLowerCase().includes(search.toLowerCase()) ||
      room.subject.toLowerCase().includes(search.toLowerCase());

    const matchesSubject =
      subject === "All" || room.subject === subject;

    return matchesSearch && matchesSubject;
  });

  return (
    <main className="study-rooms-page">
      <section className="rooms-hero">
        <div>
          <p className="rooms-eyebrow">STUDY TOGETHER</p>
          <h1>Study Rooms</h1>
          <p>
            Find your study community, stay focused, and learn together.
          </p>
        </div>

        <button
          className="create-room-button"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? "Cancel" : "+ Create Room"}
        </button>
      </section>

      {showCreateForm && (
        <form className="create-room-form" onSubmit={createRoom}>
          <h2>Create a Study Room</h2>

          <label htmlFor="room-name">Room name</label>
          <input
            id="room-name"
            value={roomName}
            onChange={(event) => setRoomName(event.target.value)}
            placeholder="e.g. Data Structures Study Group"
            required
            maxLength={60}
          />

          <label htmlFor="room-subject">Subject</label>
          <select
            id="room-subject"
            value={roomSubject}
            onChange={(event) => setRoomSubject(event.target.value)}
          >
            <option>Programming</option>
            <option>Mathematics</option>
            <option>Science</option>
            <option>General Studies</option>
            <option>Exam Preparation</option>
          </select>

          <label htmlFor="room-description">Description</label>
          <textarea
            id="room-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What will your group study?"
            rows={3}
            maxLength={200}
          />

          <button className="create-room-button" type="submit">
            Create Room
          </button>
        </form>
      )}

      <section className="rooms-toolbar">
        <input
          type="search"
          aria-label="Search study rooms"
          placeholder="Search rooms or subjects..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          aria-label="Filter by subject"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
        >
          {subjects.map((item) => (
            <option key={item} value={item}>
              {item === "All" ? "All Subjects" : item}
            </option>
          ))}
        </select>
      </section>

      <section className="rooms-section">
        <div className="rooms-section-heading">
          <h2>Explore Rooms</h2>
          <span>{filteredRooms.length} rooms</span>
        </div>

        {filteredRooms.length > 0 ? (
          <div className="rooms-grid">
            {filteredRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onJoin={() => joinRoom(room.id)}
                onLeave={() => leaveRoom(room.id)}
              />
            ))}
          </div>
        ) : (
          <div className="rooms-empty-state">
            <h3>No rooms found</h3>
            <p>Try another search or create a new study room.</p>
          </div>
        )}
      </section>
    </main>
  );
}

export default StudyRoomsPage;
