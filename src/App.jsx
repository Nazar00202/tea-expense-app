import { useEffect, useState } from "react";
import "./App.css";
import Chart from "./Chart";
import Journal from "./Journal";
import CalendarView from "./Calendar";
import Budget from "./Budget";
import Portfolio from "./Portfolio";
import Dashboard from "./Dashboard";
import TradingJournal from "./TradingJournal";
import Planner from "./Planner";
import { db } from "./firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { auth } from "./firebase";
import { onAuthStateChanged, getRedirectResult } from "firebase/auth";
import Auth from "./Auth";
import { useLang } from "./useLang";
import NavIcon from "./NavIcons";
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

const TABS = [
  { id: "дашборд", labelKey: "tabDashboard" },
  { id: "бюджет", labelKey: "tabBudget" },
  { id: "витрати", labelKey: "tabExpenses" },
  { id: "портфель", labelKey: "tabPortfolio" },
  { id: "трейд", labelKey: "tabTradingJournal" },
  { id: "планер", labelKey: "tabPlanner" },
  { id: "записник", labelKey: "tabJournal" },
];

export default function App() {
  const { lang, setLang, t } = useLang();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("витрати");
  const [expenses, setExpenses] = useState([]);
  const [desc, setDesc] = useState("");
  const [amt, setAmt] = useState("");
  const [cat, setCat] = useState("їжа");
  const [income, setIncome] = useState(0);
  const [incomeInput, setIncomeInput] = useState("");
  const [filterCat, setFilterCat] = useState("all");

  const getCatLabel = (value) => {
    const meta = CATEGORY_META[value];
    if (!meta) return value;
    return `${meta.emoji} ${lang === "en" ? meta.en : meta.ua}`;
  };

  useEffect(() => {
    getRedirectResult(auth).then((result) => {
      if (result?.user) setUser(result.user);
    }).catch(() => {});

    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return undefined;

    const expensesQuery = query(
      collection(db, "expenses"),
      where("userId", "==", user.uid),
    );

    const unsub = onSnapshot(expensesQuery, (snapshot) => {
      const data = snapshot.docs.map((expenseDoc) => ({
        id: expenseDoc.id,
        ...expenseDoc.data(),
      }));

      data.sort((a, b) => b.createdAt - a.createdAt);
      setExpenses(data);
    });

    return () => unsub();
  }, [user]);

  const scopedExpenses = user ? expenses : [];

  const addIncome = () => {
    if (!incomeInput) return;
    setIncome((prev) => prev + Number(incomeInput));
    setIncomeInput("");
  };

  const addExpense = async () => {
    if (!user || !desc.trim() || !amt) return;

    await addDoc(collection(db, "expenses"), {
      desc: desc.trim(),
      amt: Number(amt),
      cat,
      userId: user.uid,
      userName: user.displayName ?? "",
      userEmail: user.email ?? "",
      createdAt: Date.now(),
    });

    setDesc("");
    setAmt("");
  };

  const deleteExpense = async (id) => {
    if (!user) return;
    await deleteDoc(doc(db, "expenses", id));
  };

  const filtered = filterCat === "all"
    ? scopedExpenses
    : scopedExpenses.filter((expense) => expense.cat === filterCat);

  const total = scopedExpenses.reduce((sum, expense) => sum + expense.amt, 0);
  const filteredTotal = filtered.reduce((sum, expense) => sum + expense.amt, 0);
  const balance = income - total;

  return (
    <div className="container app-shell">
      <div className="lang-switch lang-switch-floating">
        <button
          type="button"
          className={lang === "ua" ? "lang-btn active" : "lang-btn"}
          onClick={() => setLang("ua")}
        >
          {t("langUa")}
        </button>
        <button
          type="button"
          className={lang === "en" ? "lang-btn active" : "lang-btn"}
          onClick={() => setLang("en")}
        >
          {t("langEn")}
        </button>
      </div>

      <header className="mobile-header">
        <div className="mobile-brand">
          <img className="brand-logo" src="/logo.svg" alt="Focus Life logo" />
          <div className="brand-copy">
            <p className="brand-kicker">DTR</p>
            <p className="brand-title">{t("appName")}</p>
          </div>
        </div>
        <div className="mobile-header-right">
          <div className="lang-switch">
            <button type="button" className={lang === "ua" ? "lang-btn active" : "lang-btn"} onClick={() => setLang("ua")}>{t("langUa")}</button>
            <button type="button" className={lang === "en" ? "lang-btn active" : "lang-btn"} onClick={() => setLang("en")}>{t("langEn")}</button>
          </div>
          <Auth user={user} />
        </div>
      </header>

      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand">
            <img className="brand-logo" src="/logo.svg" alt="Focus Life logo" />
            <div className="brand-copy">
              <p className="brand-kicker">DTR</p>
              <p className="brand-title">{t("appName")}</p>
            </div>
          </div>

          <Auth user={user} />
        </div>

        <nav className="tabs">
          {TABS.map((tabItem) => {
            const isActive = tab === tabItem.id;
            return (
              <button
                key={tabItem.id}
                className={isActive ? "tab active" : "tab"}
                onClick={() => setTab(tabItem.id)}
              >
                <NavIcon tabId={tabItem.id} active={isActive} />
                <span>{t(tabItem.labelKey)}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="main-content">
        {tab === "дашборд" && <Dashboard expenses={scopedExpenses} income={income} user={user} setTab={setTab} />}
        {tab === "бюджет" && (
          <Budget
            expenses={scopedExpenses}
            user={user}
            income={income}
            incomeInput={incomeInput}
            setIncomeInput={setIncomeInput}
            addIncome={addIncome}
            total={total}
            balance={balance}
          />
        )}
        {tab === "портфель" && <Portfolio user={user} />}
        {tab === "трейд" && <TradingJournal user={user} />}
        {tab === "планер" && <Planner user={user} />}
        {tab === "записник" && <Journal user={user} />}

        {tab === "витрати" && (
          <div className="page-expenses" style={{ width: "100%" }}>
            <PageTitle tabId="витрати">{t("expensesTitle")}</PageTitle>

            {!user ? (
              <div className="card">
                <p>{t("expensesLoginHint")}</p>
              </div>
            ) : (
              <>
                <div className="top">
                  <div className="card stat" style={{ borderColor: "#d4a84a" }}>
                    <p>{t("income")}</p>
                    <h2 style={{ color: "#d4a84a" }}>₴{income}</h2>
                  </div>
                  <div className="card stat">
                    <p>{t("balance")}</p>
                    <h2 style={{ color: balance < 0 ? "#b85a35" : "#d4a84a" }}>₴{balance}</h2>
                  </div>
                  <div className="card stat" style={{ borderColor: "#b85a35" }}>
                    <p>{t("expenses")}</p>
                    <h2 style={{ color: "#c46444" }}>₴{total}</h2>
                  </div>
                </div>

                <div className="card form">
                  <input
                    placeholder={t("description")}
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addExpense()}
                  />
                  <input
                    type="number"
                    placeholder={t("amount")}
                    value={amt}
                    onChange={(e) => setAmt(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addExpense()}
                  />
                  <select value={cat} onChange={(e) => setCat(e.target.value)}>
                    {CATEGORIES.map((category) => (
                      <option key={category.value} value={category.value}>
                        {getCatLabel(category.value)}
                      </option>
                    ))}
                  </select>
                  <button onClick={addExpense}>{t("addExpense")}</button>
                </div>

                <div className="filters">
                  <button
                    className={filterCat === "all" ? "filter-btn active" : "filter-btn"}
                    onClick={() => setFilterCat("all")}
                  >
                    {t("all")}
                  </button>
                  {CATEGORIES.map((category) => (
                    <button
                      key={category.value}
                      className={filterCat === category.value ? "filter-btn active" : "filter-btn"}
                      onClick={() => setFilterCat(category.value)}
                    >
                      {getCatLabel(category.value)}
                    </button>
                  ))}
                </div>

                <div className="card list">
                  {filtered.length === 0 ? (
                    <p className="empty">{t("noExpensesInCategory")}</p>
                  ) : (
                    <>
                      <div className="list-header">
                        <span>{filtered.length} {t("records")}</span>
                        <span>{t("total")}: ₴{filteredTotal}</span>
                      </div>
                      {filtered.map((expense) => (
                        <div key={expense.id} className="item">
                          <span className="item-cat">{getCatLabel(expense.cat)}</span>
                          <span className="item-desc">{expense.desc}</span>
                          <span className="item-amt">₴{expense.amt}</span>
                          <button className="del-btn" onClick={() => deleteExpense(expense.id)}>
                            ✕
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                <Chart expenses={scopedExpenses} getCatLabel={getCatLabel} />
                <CalendarView expenses={scopedExpenses} getCatLabel={getCatLabel} />
              </>
            )}
          </div>
        )}
      </main>

      <nav className="bottom-nav">
        {TABS.map((tabItem) => (
          <button
            key={tabItem.id}
            className={tab === tabItem.id ? "bnav-item bnav-active" : "bnav-item"}
            onClick={() => setTab(tabItem.id)}
          >
            <NavIcon tabId={tabItem.id} active={tab === tabItem.id} />
            <span>{t(tabItem.labelKey)}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

