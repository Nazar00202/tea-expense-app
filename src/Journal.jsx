import { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useLang } from "./useLang";
import Achievements from "./Achievements";
import PageTitle from "./PageTitle";

const PROMPTS = {
  ua: [
    "Що сьогодні зробило мене кращою версією себе?",
    "Яку одну звичку я хочу розвинути цього місяця?",
    "Що мене зупиняє і як це подолати?",
    "За що я вдячний сьогодні?",
    "Який урок я виніс з останньої невдачі?",
    "Що б я зробив, якби не боявся?",
    "Яка моя головна мета на наступні 90 днів?",
  ],
  en: [
    "What made me a better version of myself today?",
    "What one habit do I want to build this month?",
    "What is stopping me and how can I overcome it?",
    "What am I grateful for today?",
    "What lesson did I learn from my last failure?",
    "What would I do if I wasn't afraid?",
    "What is my main goal for the next 90 days?",
  ],
};

const MOODS = ["😤", "😐", "🙂", "😊", "🔥"];

const todayStr = () => new Date().toISOString().split("T")[0];

export default function Journal({ user }) {
  const { lang } = useLang();
  const [notes, setNotes] = useState([]);
  const [text, setText] = useState("");
  const [mood, setMood] = useState(3);
  const [prompt, setPrompt] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [todayTasks, setTodayTasks] = useState([]);

  useEffect(() => {
    if (!user) return undefined;
    const journalQuery = query(collection(db, "journal"), where("userId", "==", user.uid));
    const unsub = onSnapshot(journalQuery, (snapshot) => {
      const data = snapshot.docs.map((noteDoc) => ({ id: noteDoc.id, ...noteDoc.data() }));
      data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setNotes(data);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;
    const q = query(
      collection(db, "tasks"),
      where("userId", "==", user.uid),
      where("date", "==", todayStr()),
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setTodayTasks(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  const randomPrompt = () => {
    const pool = lang === "en" ? PROMPTS.en : PROMPTS.ua;
    const random = pool[Math.floor(Math.random() * pool.length)];
    setPrompt(random);
    setText(`${random}\n\n`);
  };

  const saveNote = async () => {
    if (!user || !text.trim()) return;
    await addDoc(collection(db, "journal"), {
      text: text.trim(), mood,
      userId: user.uid, userName: user.displayName ?? "", userEmail: user.email ?? "",
      createdAt: Date.now(),
    });
    setText(""); setPrompt(""); setMood(3);
  };

  const deleteNote = async (id) => {
    if (!user) return;
    await deleteDoc(doc(db, "journal", id));
  };

  const formatDate = (ts) =>
    new Date(ts).toLocaleDateString(lang === "en" ? "en-US" : "uk-UA", {
      day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
    });

  const doneTodayCount = todayTasks.filter((t) => t.done).length;

  if (!user) {
    return (
      <div className="container page-journal">
        <PageTitle tabId="записник">{lang === "en" ? "Journal" : "Записник"}</PageTitle>
        <div className="card">
          <p>{lang === "en" ? "Sign in with Google to keep your personal journal." : "Увійдіть через Google, щоб вести особистий записник."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <PageTitle tabId="записник">{lang === "en" ? "Journal" : "Записник"}</PageTitle>

      {/* Daily summary */}
      <div className="card" style={{ marginBottom: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div>
            <p style={{ fontSize: "0.78rem", color: "#6b5e50", marginBottom: 4 }}>
              {lang === "en" ? "Today" : "Сьогодні"} · {new Date().toLocaleDateString(lang === "en" ? "en-US" : "uk-UA", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <p style={{ fontSize: "0.92rem", color: "#d4c5b4" }}>
              {lang === "en"
                ? `${doneTodayCount} of ${todayTasks.length} tasks done`
                : `${doneTodayCount} з ${todayTasks.length} задач виконано`}
            </p>
          </div>
          {todayTasks.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {todayTasks.slice(0, 5).map((task) => (
                <span
                  key={task.id}
                  style={{
                    fontSize: "0.78rem",
                    padding: "3px 8px",
                    borderRadius: 12,
                    background: task.done ? "rgba(212,168,74,0.15)" : "#2d2620",
                    color: task.done ? "#d4a84a" : "#6b5e50",
                    border: `1px solid ${task.done ? "#d4a84a" : "#3a3028"}`,
                  }}
                >
                  {task.done ? "✓ " : ""}{task.text}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card prompt-card">
        <p className="prompt-label">{lang === "en" ? "💡 Reflection prompt" : "💡 Підказка для роздумів"}</p>
        {prompt && <p className="prompt-text">"{prompt}"</p>}
        <button className="prompt-btn" onClick={randomPrompt}>
          {lang === "en" ? "🎲 New prompt" : "🎲 Нова підказка"}
        </button>
      </div>

      <div className="card form mood-wrap">
        <span className="mood-label">{lang === "en" ? "Mood:" : "Настрій:"}</span>
        {MOODS.map((m, i) => (
          <button
            key={i}
            className={`mood-btn ${mood === i + 1 ? "mood-active" : ""}`}
            onClick={() => setMood(i + 1)}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="card">
        <textarea
          className="journal-textarea"
          placeholder={lang === "en" ? "Write down your thoughts..." : "Напишіть, що думаєте..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <button onClick={saveNote}>{lang === "en" ? "💾 Save" : "💾 Зберегти"}</button>
        </div>
      </div>

      {/* Achievements */}
      <Achievements tasks={todayTasks} />

      <div className="journal-list">
        {notes.length === 0 ? (
          <p className="empty">{lang === "en" ? "No notes yet." : "Ще немає записів."}</p>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="journal-item"
              onClick={() => setExpanded(expanded === note.id ? null : note.id)}
            >
              <div className="journal-item-header">
                <span className="journal-mood">{MOODS[(note.mood || 3) - 1] || "🙂"}</span>
                <span className="journal-date">{formatDate(note.createdAt)}</span>
                <button
                  className="del-btn"
                  onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                >
                  ✕
                </button>
              </div>
              <p className={`journal-preview ${expanded === note.id ? "expanded" : ""}`}>
                {note.text}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
