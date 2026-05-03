import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { useLang } from "./useLang";

const today = () => new Date().toISOString().split("T")[0];

const greeting = (t) => {
  const hour = new Date().getHours();
  if (hour < 6) return t("dashboardGreetingNight");
  if (hour < 12) return t("dashboardGreetingMorning");
  if (hour < 18) return t("dashboardGreetingDay");
  return t("dashboardGreetingEvening");
};

function NavArrow() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
      <polyline points="7,4 13,10 7,16"/>
    </svg>
  );
}

export default function Dashboard({ expenses, income, user, setTab }) {
  const { lang, t } = useLang();
  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [habits, setHabits] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(0);

  useEffect(() => {
    if (!user) return undefined;
    const q = query(collection(db, "tasks"), where("userId", "==", user.uid), where("date", "==", today()));
    const unsub = onSnapshot(q, (snap) => setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;
    const q = query(collection(db, "goals"), where("userId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => setGoals(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;
    const q = query(collection(db, "habits"), where("userId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      setHabits(data);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;
    const q = query(collection(db, "portfolio"), where("userId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => setPortfolio(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;
    const month = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; })();
    const q = query(collection(db, "budgets"), where("userId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setBudgets(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((b) => b.month === month));
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (!snap.exists()) { setXp(0); setLevel(0); return; }
      const data = snap.data();
      setXp(data.xp || 0);
      setLevel(data.level || 0);
    });
    return () => unsub();
  }, [user]);

  const scopedTasks = user ? tasks : [];
  const scopedGoals = user ? goals : [];
  const scopedXp = user ? xp : 0;
  const scopedLevel = user ? level : 0;
  const total = expenses.reduce((sum, e) => sum + e.amt, 0);
  const balance = income - total;
  const doneTasks = scopedTasks.filter((t) => t.done).length;
  const activeGoals = scopedGoals.filter((g) => g.current / g.target < 1);
  const habitsDone = habits.filter((h) => h.doneToday).length;

  const todayExpenses = expenses.filter((e) => new Date(e.createdAt).toISOString().split("T")[0] === today());
  const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amt, 0);

  const totalInvested = portfolio.reduce((s, a) => s + (a.invested || 0), 0);
  const totalCurrent = portfolio.reduce((s, a) => s + (a.current || 0), 0);
  const pnl = totalCurrent - totalInvested;
  const pnlPct = totalInvested > 0 ? Math.round((pnl / totalInvested) * 100) : 0;

  const totalBudgetLimit = budgets.reduce((s, b) => s + b.limit, 0);

  const goTo = (tabId) => setTab && setTab(tabId);

  const isUa = lang !== "en";

  return (
    <div className="container page-dashboard">
      <div className="dash-header">
        <h1>{greeting(t)}</h1>
        <p className="dash-date">
          {new Date().toLocaleDateString(lang === "en" ? "en-US" : "uk-UA", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Main tiles grid */}
      <div className="dash-grid">
        <div className="dash-card dash-clickable" style={{ borderColor: "rgba(106,175,61,0.5)" }} onClick={() => goTo("бюджет")}>
          <div className="dash-card-header">
            <p className="dash-label" style={{ color: "#6AAF3D" }}>{t("balance")}</p>
            <NavArrow />
          </div>
          <h2 style={{ color: balance < 0 ? "#b85a35" : "#d4a84a" }}>₴{balance}</h2>
          <p className="dash-sub">{t("dashboardToday")}: ₴{todayTotal}</p>
        </div>

        <div className="dash-card dash-clickable" style={{ borderColor: "rgba(155,106,232,0.5)" }} onClick={() => goTo("планер")}>
          <div className="dash-card-header">
            <p className="dash-label" style={{ color: "#9B6AE8" }}>{t("dashboardTasks")}</p>
            <NavArrow />
          </div>
          <h2>{doneTasks}/{scopedTasks.length}</h2>
          <div className="dash-mini-bar">
            <div style={{ height: "100%", width: scopedTasks.length ? `${(doneTasks / scopedTasks.length) * 100}%` : "0%", background: "#9B6AE8", borderRadius: 99, transition: "width 0.3s" }} />
          </div>
          <p className="dash-sub">{t("dashboardDoneToday")}</p>
        </div>

        <div className="dash-card dash-clickable" style={{ borderColor: "rgba(61,200,160,0.5)" }} onClick={() => goTo("планер")}>
          <div className="dash-card-header">
            <p className="dash-label" style={{ color: "#3DC8A0" }}>{t("dashboardGoals")}</p>
            <NavArrow />
          </div>
          <h2 style={{ color: "#3DC8A0" }}>{activeGoals.length}</h2>
          <p className="dash-sub">{t("dashboardActiveGoals")}</p>
        </div>

        <div className="dash-card dash-clickable" style={{ background: "linear-gradient(135deg,#2d1609,#422010)", borderColor: "rgba(200,150,43,0.6)" }} onClick={() => goTo("планер")}>
          <div className="dash-card-header">
            <p className="dash-label" style={{ color: "#C8962B" }}>{t("dashboardLevel")}</p>
            <NavArrow />
          </div>
          <h2 style={{ color: "#d4a84a" }}>LVL {scopedLevel}</h2>
          <p className="dash-sub" style={{ color: "#f5ede2" }}>{scopedXp} XP</p>
          <div className="progress-bar" style={{ marginTop: 6 }}>
            <div style={{ height: "100%", width: `${scopedXp % 100}%`, background: "#C8962B", borderRadius: 99, transition: "width 0.3s" }} />
          </div>
        </div>
      </div>

      {/* Habits today */}
      {(
        <div className="card dash-section dash-clickable" onClick={() => goTo("планер")}>
          <div className="dash-section-header">
            <h3>{isUa ? "Звички сьогодні" : "Habits today"}</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "0.82rem", color: "#a09082" }}>{habitsDone}/{habits.length}</span>
              <NavArrow />
            </div>
          </div>
          <div className="dash-habits-row">
            {habits.map((habit) => (
              <div key={habit.id} className={`dash-habit-chip ${habit.doneToday ? "dash-habit-done" : ""}`}>
                <span>{habit.icon}</span>
                <span className="dash-habit-name">{habit.name}</span>
                {habit.doneToday && <span style={{ color: "#d4a84a", fontSize: "0.7rem" }}>✓</span>}
              </div>
            ))}
          </div>
          <div className="progress-bar" style={{ marginTop: 10 }}>
            <div className="dash-mini-fill" style={{ width: habits.length ? `${(habitsDone / habits.length) * 100}%` : "0%", height: "100%", background: "#d4a84a", borderRadius: 99 }} />
          </div>
        </div>
      )}

      {/* Tasks today */}
      <div className="card dash-section dash-clickable" onClick={() => goTo("планер")}>
        <div className="dash-section-header">
          <h3>{t("dashboardTasksToday")}</h3>
          <NavArrow />
        </div>
        {scopedTasks.length === 0 ? (
          <p className="empty">{t("dashboardNoTasks")}</p>
        ) : (
          scopedTasks.slice(0, 5).map((task) => (
            <div key={task.id} className={`dash-task ${task.done ? "done" : ""}`}>
              <span className="dash-check">{task.done ? "✓" : "⬜"}</span>
              <span>{task.text}</span>
            </div>
          ))
        )}
      </div>

      {/* Expenses today */}
      <div className="card dash-section dash-clickable" onClick={() => goTo("витрати")}>
        <div className="dash-section-header">
          <h3>{t("dashboardExpensesToday")}</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {todayTotal > 0 && <span style={{ fontSize: "0.82rem", color: "#c46444" }}>₴{todayTotal}</span>}
            <NavArrow />
          </div>
        </div>
        {todayExpenses.length === 0 ? (
          <p className="empty">{t("dashboardNoExpenses")}</p>
        ) : (
          todayExpenses.slice(0, 4).map((expense) => (
            <div key={expense.id} className="dash-expense">
              <span>{expense.cat} · {expense.desc}</span>
              <span className="dash-amt">₴{expense.amt}</span>
            </div>
          ))
        )}
      </div>

      {/* Portfolio summary */}
      {(
        <div className="card dash-section dash-clickable" onClick={() => goTo("портфель")}>
          <div className="dash-section-header">
            <h3>{isUa ? "Портфель" : "Portfolio"}</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "0.82rem", color: pnl >= 0 ? "#d4a84a" : "#b85a35" }}>
                {pnl >= 0 ? "+" : ""}₴{pnl} ({pnlPct}%)
              </span>
              <NavArrow />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: "0.82rem", color: "#6b5e50" }}>{isUa ? "Поточна вартість" : "Current value"}</span>
            <span style={{ fontWeight: 600, color: "#f5ede2" }}>₴{totalCurrent}</span>
          </div>
          <div className="progress-bar">
            <div className="dash-mini-fill" style={{
              width: totalInvested > 0 ? `${Math.min((totalCurrent / totalInvested) * 100, 100)}%` : "0%",
              height: "100%",
              background: pnl >= 0 ? "#d4a84a" : "#b85a35",
              borderRadius: 99,
            }} />
          </div>
          <p className="dash-sub" style={{ marginTop: 6 }}>
            {isUa ? "Вкладено" : "Invested"}: ₴{totalInvested} · {portfolio.length} {isUa ? "активів" : "assets"}
          </p>
        </div>
      )}

      {/* Budget summary */}
      {(
        <div className="card dash-section dash-clickable" onClick={() => goTo("бюджет")}>
          <div className="dash-section-header">
            <h3>{isUa ? "Бюджет місяця" : "Monthly budget"}</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "0.82rem", color: total > totalBudgetLimit ? "#b85a35" : "#a09082" }}>
                ₴{total} / ₴{totalBudgetLimit}
              </span>
              <NavArrow />
            </div>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{
              width: `${Math.min((total / totalBudgetLimit) * 100, 100)}%`,
              background: total > totalBudgetLimit ? "#b85a35" : total / totalBudgetLimit > 0.8 ? "#d4a84a" : "#c4622d",
            }} />
          </div>
          <p className="dash-sub" style={{ marginTop: 6 }}>
            {total > totalBudgetLimit
              ? (isUa ? `Перевищення ₴${total - totalBudgetLimit}` : `Over by ₴${total - totalBudgetLimit}`)
              : (isUa ? `Залишилось ₴${totalBudgetLimit - total}` : `₴${totalBudgetLimit - total} remaining`)}
          </p>
        </div>
      )}

      {/* Active goals */}
      {activeGoals.length > 0 && (
        <div className="card dash-section dash-clickable" onClick={() => goTo("планер")}>
          <div className="dash-section-header">
            <h3 className="dash-title-green">{t("dashboardActiveGoalsTitle")}</h3>
            <NavArrow />
          </div>
          {activeGoals.slice(0, 3).map((goal) => {
            const percent = Math.min(Math.round((goal.current / goal.target) * 100), 100);
            return (
              <div key={goal.id} className="dash-goal">
                <div className="dash-goal-info">
                  <span className="dash-goal-title">{goal.title}</span>
                  <span className="dash-pct dash-value-green">{percent}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
