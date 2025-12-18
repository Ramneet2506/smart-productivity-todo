import { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";
import "./App.css";

function App() {
  const [task, setTask] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [tasks, setTasks] = useState([]);
  const [focusTask, setFocusTask] = useState(null);
  const [dark, setDark] = useState(false);

  // Pomodoro
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);

  // Priority Engine
  const priority = (t) => {
    if (t.length > 30) return "High";
    if (t.length > 15) return "Medium";
    return "Low";
  };

  // 🔢 Priority weight (for sorting)
  const priorityWeight = {
    High: 3,
    Medium: 2,
    Low: 1,
  };

  // Load
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("tasks"));
    const theme = localStorage.getItem("dark");

    if (Array.isArray(saved)) {
      setTasks(
        saved.map((t) =>
          typeof t === "string"
            ? {
                text: t,
                done: false,
                priority: priority(t),
                date: new Date().toDateString(),
                dueDate: "",
              }
            : t
        )
      );
    }

    if (theme === "true") setDark(true);
  }, []);

  // Save
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("dark", dark);
  }, [dark]);

  // Timer
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          setRunning(false);
          alert("🎉 Focus Complete!");
          return 25 * 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  const format = (s) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const updatePriority = (i, newPriority) => {
    const copy = [...tasks];
    copy[i].priority = newPriority;
    setTasks(copy);
  };

  const addTask = () => {
    if (!task.trim()) return;
    setTasks([
      ...tasks,
      {
        text: task,
        done: false,
        priority: priority(task),
        date: new Date().toDateString(),
        dueDate,
      },
    ]);
    setTask("");
    setDueDate("");
  };

  const toggleDone = (i) => {
    const copy = [...tasks];
    copy[i].done = !copy[i].done;
    setTasks(copy);
  };

  const editTask = (i) => {
    const newText = prompt("Edit task:", tasks[i].text);
    if (!newText) return;

    const copy = [...tasks];
    copy[i].text = newText;
    copy[i].priority = priority(newText);
    setTasks(copy);
  };

  const deleteTask = (i) => {
    setTasks(tasks.filter((_, idx) => idx !== i));
  };

  const startFocus = (t) => {
    setFocusTask(t);
    setTimeLeft(25 * 60);
    setRunning(false);
  };

  // 🔢 SORTED TASKS
  const sortedTasks = [...tasks].sort(
    (a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]
  );

  // ⏰ Overdue check
  const isOverdue = (t) =>
    t.dueDate && !t.done && new Date(t.dueDate) < new Date();

  // Analytics
  const completed = tasks.filter((t) => t.done).length;
  const pending = tasks.length - completed;

  const chartData = {
    labels: ["Completed", "Pending"],
    datasets: [
      {
        label: "Tasks",
        data: [completed, pending],
      },
    ],
  };

  return (
    <div className={dark ? "app dark" : "app"}>
      <h2>Smart Productivity To-Do</h2>

      <button onClick={() => setDark(!dark)}>
        {dark ? "☀️ Light Mode" : "🌙 Dark Mode"}
      </button>

      {!focusTask && (
        <>
          <input
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Enter task"
          />

          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <button onClick={addTask}>Add Task</button>
        </>
      )}

      {focusTask ? (
        <div className="focus-box">
          <h3>🎯 Focus Mode</h3>
          <p>{focusTask.text}</p>
          <div className="timer">{format(timeLeft)}</div>
          <button onClick={() => setRunning(true)}>Start</button>
          <button onClick={() => setRunning(false)}>Pause</button>
          <button onClick={() => setFocusTask(null)}>Exit</button>
        </div>
      ) : (
        <>
          <ul>
            {sortedTasks.map((t, i) => (
              <li
                key={i}
                className={`${t.done ? "done" : ""} ${
                  isOverdue(t) ? "overdue" : ""
                }`}
              >
                <span>{t.text}</span>

                <select
                  value={t.priority}
                  onChange={(e) => updatePriority(i, e.target.value)}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>

                {t.dueDate && <small>📅 {t.dueDate}</small>}

                <div>
                  <button onClick={() => toggleDone(i)}>✔</button>
                  <button onClick={() => editTask(i)}>✏️</button>
                  <button onClick={() => startFocus(t)}>🎯</button>
                  <button onClick={() => deleteTask(i)}>❌</button>
                </div>
              </li>
            ))}
          </ul>

          <h3>📊 Productivity Analytics</h3>
          <Bar data={chartData} />
        </>
      )}
    </div>
  );
}

export default App;
