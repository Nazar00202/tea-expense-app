import { useEffect, useState } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useLang } from "./useLang";
import PageTitle from "./PageTitle";

const CATEGORY_META = {
  "їжа": { emoji: "🍔", ua: "Їжа", en: "Food" },
  "транспорт": { emoji: "🚗", ua: "Транспорт", en: "Transport" },
  "житло": { emoji: "🏠", ua: "Житло", en: "Housing" },
  "здоров'я": { emoji: "💊", ua: "Здоров'я", en: "Health" },
  "розваги": { emoji: "🎮", ua: "Розваги", en: "Entertainment" },
  "одяг": { emoji: "👕", ua: "Одяг", en: "Clothes" },
  "навчання": { emoji: "📚", ua: "Навчання", en: "Education" },
  "комуналка": { emoji: "💡", ua: "Комуналка", en: "Utilities" },
  "інше": { emoji: "🛒", ua: "Інше", en: "Other" },
};

const CATEGORIES = Object.keys(CATEGORY_META).map((value) => ({ value }));

export default function Budget({ expenses, user, income, incomeInput, setIncomeInput, addIncome, total, balance }) {
  const { lang } = useLang();
  const [budgets, setBudgets] = useState([]);
  const [cat, setCat] = useState("їжа");
  const [limit, setLimit] = useState("");
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const getCatLabel = (value) => {
    const meta = CATEGORY_META[value];
    if (!meta) return value;
    return `${meta.emoji} ${lang === "en" ? meta.en : meta.ua}`;
  };

  useEffect(() => {
    if (!user) return undefined;

    const q = query(
      collection(db, "budgets"),
      where("userId", "==", user.uid),
    );

    const unsub = onSnapshot(q, (snap) => {
      setBudgets(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [user]);

  const addBudget = async () => {
    if (!limit || !user) return;

    const existing = budgets.find((b) => b.cat === cat && b.month === month);

    if (existing) {
      await updateDoc(doc(db, "budgets", existing.id), { limit: Number(limit) });
    } else {
      await addDoc(collection(db, "budgets"), {
        cat,
        limit: Number(limit),
        month,
        userId: user.uid,
      });
    }

    setLimit("");
  };

  const deleteBudget = async (id) => {
    await deleteDoc(doc(db, "budgets", id));
  };

  const monthExpenses = expenses.filter((e) => {
    const d = new Date(e.createdAt);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return m === month;
  });

  const spentByCategory = (catVal) =>
    monthExpenses.filter((e) => e.cat === catVal).reduce((s, e) => s + e.amt, 0);

  const totalLimit = budgets
    .filter((b) => b.month === month)
    .reduce((s, b) => s + b.limit, 0);

  const totalSpent = monthExpenses.reduce((s, e) => s + e.amt, 0);
  const monthBudgets = budgets.filter((b) => b.month === month);

  const incomeLabel = lang === "en" ? "Income" : "Дохід";
  const balanceLabel = lang === "en" ? "Balance" : "Залишок";
  const expensesLabel = lang === "en" ? "Expenses" : "Витрати";
  const addIncomeLabel = lang === "en" ? "+ Income" : "+ Дохід";
  const incomePlaceholder = lang === "en" ? "Add income (₴)" : "Додати дохід (₴)";
  const setLimitLabel = lang === "en" ? "+ Set limit" : "+ Встановити ліміт";
  const limitLabel = lang === "en" ? "Limit (₴)" : "Ліміт (₴)";
  const title = lang === "en" ? "💰 Budget" : "💰 Бюджет";
  const ofLabel = lang === "en" ? "of" : "з";

  if (!user) {
    return (
      <div className="container page-budget">
        <PageTitle tabId="бюджет">{lang === "en" ? "Budget" : "Бюджет"}</PageTitle>
        <div className="card">
          <p>{lang === "en" ? "Sign in with Google to track your budget." : "Увійди через Google, щоб керувати бюджетом."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <PageTitle tabId="бюджет">{lang === "en" ? "Budget" : "Бюджет"}</PageTitle>

      <div className="card form">
        <input
          placeholder={incomePlaceholder}
          value={incomeInput}
          onChange={(e) => setIncomeInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addIncome()}
        />
        <button onClick={addIncome}>{addIncomeLabel}</button>
      </div>

      <div className="top">
        <div className="card stat" style={{ borderColor: "#d4a84a" }}>
          <p>{incomeLabel}</p>
          <h2 style={{ color: "#d4a84a" }}>₴{income}</h2>
        </div>
        <div className="card stat">
          <p>{balanceLabel}</p>
          <h2 style={{ color: balance < 0 ? "#b85a35" : "#d4a84a" }}>₴{balance}</h2>
        </div>
        <div className="card stat" style={{ borderColor: "#b85a35" }}>
          <p>{expensesLabel}</p>
          <h2 style={{ color: "#c46444" }}>₴{total}</h2>
        </div>
      </div>

      <div className="card form" style={{ marginTop: 20 }}>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
        <span className="date-label">
          {new Date(`${month}-01`).toLocaleDateString(lang === "en" ? "en-US" : "uk-UA", {
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>

      {totalLimit > 0 && (
        <div className="card progress-wrap">
          <div className="progress-info">
            <span>₴{totalSpent}</span>
            <span>{ofLabel} ₴{totalLimit}</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${Math.min((totalSpent / totalLimit) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="card form">
        <select value={cat} onChange={(e) => setCat(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {getCatLabel(c.value)}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder={limitLabel}
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addBudget()}
        />
        <button onClick={addBudget}>{setLimitLabel}</button>
      </div>

      <div className="budget-list">
        {monthBudgets.length === 0 ? (
          <p className="empty">{lang === "en" ? "No budget limits set for this month." : "На цей місяць лімітів ще немає."}</p>
        ) : (
          monthBudgets.map((b) => {
            const spent = spentByCategory(b.cat);
            const pct = Math.min((spent / b.limit) * 100, 100);
            const isOver = spent > b.limit;

            return (
              <div key={b.id} className={`budget-card ${isOver ? "budget-over-card" : ""}`}>
                <div className="budget-header">
                  <span className="budget-cat">{getCatLabel(b.cat)}</span>
                  <div className="budget-nums">
                    <span style={{ color: isOver ? "#c46444" : "#d4c5b4" }}>₴{spent}</span>
                    <span className="budget-sep">/</span>
                    <span>₴{b.limit}</span>
                  </div>
                  <button className="del-btn" onClick={() => deleteBudget(b.id)}>✕</button>
                </div>
                <div className="progress-bar" style={{ marginTop: 8 }}>
                  <div
                    className="progress-fill"
                    style={{
                      width: `${pct}%`,
                      background: isOver ? "#b85a35" : pct > 80 ? "#d4a84a" : "#c4622d",
                    }}
                  />
                </div>
                <div className="budget-left">
                  {isOver
                    ? <span className="budget-over">+₴{spent - b.limit} {lang === "en" ? "over limit" : "перевищення"}</span>
                    : <span>₴{b.limit - spent} {lang === "en" ? "remaining" : "залишилось"}</span>
                  }
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
