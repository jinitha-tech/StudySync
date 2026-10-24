
import { useEffect, useState } from "react";

function FocusTimer({ onSessionComplete }) {
  const [minutes, setMinutes] = useState(25);
  const [customMinutes, setCustomMinutes] = useState("25");
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionFinished, setSessionFinished] = useState(false);

  useEffect(() => {
    if (!isRunning) return;

    const timerId = setInterval(() => {
      setSecondsLeft((previous) => {
        if (previous <= 1) {
          clearInterval(timerId);
          setIsRunning(false);
          setSessionFinished(true);
          onSessionComplete?.(minutes);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [isRunning, minutes, onSessionComplete]);

  function resetTimer(nextMinutes = minutes) {
    setIsRunning(false);
    setMinutes(nextMinutes);
    setCustomMinutes(String(nextMinutes));
    setSecondsLeft(nextMinutes * 60);
    setSessionFinished(false);
  }

  function applyCustomDuration(event) {
    event.preventDefault();

    const duration = Number(customMinutes);

    if (
      !Number.isInteger(duration) ||
      duration < 1 ||
      duration > 720
    ) {
      return;
    }

    resetTimer(duration);
  }

  const displayMinutes = String(
    Math.floor(secondsLeft / 60)
  ).padStart(2, "0");

  const displaySeconds = String(secondsLeft % 60).padStart(2, "0");

  return (
    <section className="focus-timer">
      <h2>Focus Timer</h2>
      <p>Set aside time for focused studying.</p>

      <div className="focus-timer__display" role="timer" aria-live="off">
        {displayMinutes}:{displaySeconds}
      </div>

      <form
        className="focus-timer__custom"
        onSubmit={applyCustomDuration}
      >
        <label htmlFor="custom-duration">Custom duration (minutes)</label>

        <div className="focus-timer__custom-controls">
          <input
            id="custom-duration"
            type="number"
            min="1"
            max="720"
            step="1"
            value={customMinutes}
            onChange={(event) => setCustomMinutes(event.target.value)}
            disabled={isRunning}
            required
          />

          <button type="submit" disabled={isRunning}>
            Apply
          </button>
        </div>

        <small>Choose any whole number from 1 to 720 minutes.</small>
      </form>

      <div className="focus-timer__presets">
        {[15, 25, 45, 60].map((preset) => (
          <button
            key={preset}
            type="button"
            disabled={isRunning}
            className={minutes === preset ? "active" : ""}
            onClick={() => resetTimer(preset)}
          >
            {preset} min
          </button>
        ))}
      </div>

      <div className="focus-timer__actions">
        <button
          type="button"
          onClick={() => {
            if (secondsLeft > 0) {
              setSessionFinished(false);
              setIsRunning((running) => !running);
            }
          }}
          disabled={secondsLeft === 0}
        >
          {isRunning ? "Pause" : "Start"}
        </button>

        <button type="button" onClick={() => resetTimer()}>
          Reset
        </button>
      </div>

      {sessionFinished && (
        <p role="status">Focus session completed! Great work.</p>
      )}
    </section>
  );
}

export default FocusTimer;
