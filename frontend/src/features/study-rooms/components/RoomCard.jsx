
import { Link } from "react-router-dom";

function RoomCard({ room, onJoin, onLeave }) {
  const isFull = room.members >= room.capacity;
  const isJoined = Boolean(room.joined);

  return (
    <article className="room-card">
      <div className="room-card-top">
        <span className="room-subject">{room.subject}</span>

        <span className="room-status">
          <span className="room-status-dot" />
          {room.status}
        </span>
      </div>

      <h3 className="room-card-title">{room.name}</h3>

      <p className="room-card-description">{room.description}</p>

      <div className="room-card-footer">
        <div className="room-members">
          <span className="room-members-icon">👥</span>
          <span>
            {room.members}/{room.capacity} members
          </span>
        </div>

        {isJoined ? (
          <div className="room-card-actions">
            <Link
              className="room-action-button room-open-button"
              to={`/study-rooms/${room.id}`}
            >
              Open Room
            </Link>

            <button
              type="button"
              className="room-action-button leave-room-button"
              onClick={onLeave}
            >
              Leave Room
            </button>
          </div>
        ) : (
          <Link
            className={`room-action-button room-open-button ${
              isFull ? "room-button-disabled" : ""
            }`}
            to={`/study-rooms/${room.id}`}
            onClick={(event) => {
              if (isFull) {
                event.preventDefault();
                return;
              }

              onJoin();
            }}
            aria-disabled={isFull}
          >
            {isFull ? "Room Full" : "Join Room"}
          </Link>
        )}
      </div>
    </article>
  );
}

export default RoomCard;
