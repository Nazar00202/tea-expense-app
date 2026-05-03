import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { useLang } from "./useLang";
import PageTitle from "./PageTitle";

const round = (v, d = 4) => Math.round((v + Number.EPSILON) * 10 ** d) / 10 ** d;
const toNum = (v) => Number(String(v).replace(",", ".")) || 0;

const POPULAR_PAIRS = [
  "BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT","XRPUSDT","ADAUSDT","DOGEUSDT",
  "AVAXUSDT","DOTUSDT","LINKUSDT","MATICUSDT","UNIUSDT","LTCUSDT","ATOMUSDT",
  "ETCUSDT","XLMUSDT","NEARUSDT","APTUSDT","ARBUSDT","OPUSDT","INJUSDT",
  "SUIUSDT","SEIUSDT","TIAUSDT","WLDUSDT","JUPUSDT",
];

const STRATEGIES = [
  {
    name: "Скальпінг", tf: "1хв — 5хв",
    tags: ["Висока частота","Малі цілі","Швидкий вихід"],
    rr:"1:1—1:2", risk:"0.2—0.5%",
    indicators:"EMA 8/21, RSI, Стакан ордерів",
    setup:"Вхід на мікрорівнях підтримки/опору. Вихід при досягненні цілі або зміні моменту.",
    tips:["Низький спред — обирай ліквідні пари","Потрібна висока концентрація","Рахуй net PnL з комісіями"],
  },
  {
    name: "Дейтрейдинг", tf: "15хв — 1год",
    tags: ["Внутрішньоденний","Закриття до вечора","Новини важливі"],
    rr:"1:2—1:3", risk:"0.5—1%",
    indicators:"VWAP, EMA 50, MACD, обсяг",
    setup:"Торгівля в межах дня. Вхід на відкатах до ключового рівня. Закриття перед кінцем сесії.",
    tips:["Слідкуй за економічним календарем","Уникай утримання через ніч","Найкраща волатильність — перші 2 години"],
  },
  {
    name: "Свінг-трейдинг", tf: "4год — Денний",
    tags: ["Кілька днів","Менший стрес","Тех. аналіз"],
    rr:"1:3—1:5", risk:"1—2%",
    indicators:"EMA 20/50/200, Fibonacci, RSI дивергенція",
    setup:"Накопичення середньострокових трендів. Вхід на відкатах або при проборі консолідації.",
    tips:["Потрібно терпіння — угода може тривати тижні","Широкий стоп = менший розмір позиції","Дивись на вищий TF для контексту"],
  },
  {
    name: "Позиційна", tf: "Тижневий — Місячний",
    tags: ["Довгостроково","Фундамент","Мінімум угод"],
    rr:"1:5—1:10+", risk:"2—5%",
    indicators:"EMA 200, On-chain метрики, MA тренд",
    setup:"Великі трендові рухи. Вхід на значних рівнях підтримки або після підтвердження тренду.",
    tips:["Фундаментальний аналіз так само важливий","Ігноруй шум малих таймфреймів","Переглядай позицію раз на тиждень"],
  },
  {
    name: "За трендом", tf: "1год — 4год",
    tags: ["Слідування тренду","Трейлінг стоп","Менше угод"],
    rr:"1:3—1:8", risk:"1—1.5%",
    indicators:"ADX, EMA 50/200, Supertrend, ATR",
    setup:"Вхід тільки за напрямком тренду. Трейлінг стоп для максимізації прибутку.",
    tips:["Не торгуй проти тренду","ADX > 25 = сильний тренд","Трейлінг стоп = ключовий інструмент"],
  },
];

function RRChart({ trades }) {
  const items = [...trades]
    .filter((t) => t.tp && t.sl && t.entry)
    .slice(0, 20)
    .reverse()
    .map((t) => ({
      rr: Math.min(Math.abs(t.tp - t.entry) / Math.abs(t.entry - t.sl), 8),
      isLong: t.direction === "long",
      sym: t.symbol,
    }));
  if (items.length < 2) return null;
  const maxRR = Math.max(...items.map((i) => i.rr), 1);
  const w = 100 / items.length;
  return (
    <div style={{ marginBottom: 16 }}>
      <p className="tj-section-title" style={{ marginBottom: 8 }}>R:R по угодах</p>
      <svg viewBox={`0 0 100 36`} preserveAspectRatio="none" style={{ width: "100%", height: 60, display: "block" }}>
        <line x1="0" y1="35" x2="100" y2="35" stroke="#2d2620" strokeWidth="0.5" />
        {items.map((item, i) => {
          const h = Math.max((item.rr / maxRR) * 34, 1);
          return (
            <g key={i}>
              <rect
                x={i * w + 0.4}
                y={35 - h}
                width={w - 0.8}
                height={h}
                fill={item.isLong ? "#C8962B" : "#9B6AE8"}
                rx="1"
                opacity="0.85"
              />
            </g>
          );
        })}
      </svg>
      <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
        <span style={{ fontSize: "0.72rem", color: "#6b5e50", display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: "#C8962B", display: "inline-block" }} /> Long
        </span>
        <span style={{ fontSize: "0.72rem", color: "#6b5e50", display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: "#9B6AE8", display: "inline-block" }} /> Short
        </span>
      </div>
    </div>
  );
}

export default function TradingJournal({ user }) {
  const { lang } = useLang();
  const isUa = lang !== "en";

  const [activeTab, setActiveTab] = useState("journal");
  const [trades, setTrades] = useState([]);
  const [selStrat, setSelStrat] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [fetchLabel, setFetchLabel] = useState(isUa ? "Ціна" : "Price");
  const [livePriceLabel, setLivePriceLabel] = useState("");
  const [historyFilter, setHistoryFilter] = useState("all");

  const [symbol, setSymbol] = useState("");
  const [livePrice, setLivePrice] = useState("");
  const [direction, setDirection] = useState("long");
  const [strategy, setStrategy] = useState("Скальпінг");
  const [capital, setCapital] = useState("");
  const [riskPct, setRiskPct] = useState("1");
  const [leverage, setLeverage] = useState("1");
  const [entry, setEntry] = useState("");
  const [sl, setSl] = useState("");
  const [tp, setTp] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!user) return undefined;
    const q = query(collection(db, "trades"), where("userId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setTrades(data);
    });
    return () => unsub();
  }, [user]);

  const calc = useMemo(() => {
    const cap = toNum(capital), rP = toNum(riskPct) || 1, lev = toNum(leverage) || 1;
    const e = toNum(entry), s = toNum(sl), t = toNum(tp);
    if (!cap || !e || !s) return null;
    const slDist = Math.abs(e - s);
    if (!slDist) return null;
    const riskAmt = round(cap * rP / 100, 2);
    const posSize = round(riskAmt / slDist);
    const posVal = round(posSize * e / lev, 2);
    const spread = e * 0.0005;
    const spreadEntry = direction === "long" ? round(e + spread, e > 100 ? 2 : 4) : round(e - spread, e > 100 ? 2 : 4);
    let potProfit = null, rrRatio = null, rrPct = 0;
    if (t) {
      const tpDist = Math.abs(t - e);
      potProfit = round(posSize * tpDist, 2);
      rrRatio = round(tpDist / slDist, 2);
      rrPct = Math.min(rrRatio / 5 * 100, 100);
    }
    return { riskAmt, posSize, posVal, spreadEntry, potProfit, rrRatio, rrPct };
  }, [capital, riskPct, leverage, entry, sl, tp, direction]);

  const fetchPrice = async () => {
    const sym = (symbol.trim() || "BTCUSDT").toUpperCase();
    setFetching(true);
    setFetchLabel("...");
    try {
      const r = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${sym}`);
      const d = await r.json();
      if (d.price) {
        const p = parseFloat(d.price);
        const fmt = p.toFixed(p > 100 ? 2 : 6);
        setLivePrice(fmt);
        setEntry(fmt);
        setLivePriceLabel(`${sym}: ${fmt} USDT`);
        setFetchLabel(isUa ? "Оновити" : "Update");
      } else {
        setFetchLabel(isUa ? "Помилка" : "Error");
        setLivePriceLabel("");
      }
    } catch {
      setFetchLabel(isUa ? "Немає доступу" : "No access");
      setLivePriceLabel("");
    }
    setFetching(false);
  };

  const handleSymbolChange = (e) => {
    setSymbol(e.target.value.toUpperCase());
    setLivePriceLabel("");
    setFetchLabel(isUa ? "Ціна" : "Price");
  };

  const saveTrade = async () => {
    if (!user || !entry) return;
    await addDoc(collection(db, "trades"), {
      symbol: symbol || "N/A", entry: toNum(entry), sl: toNum(sl), tp: toNum(tp),
      direction, strategy, capital: toNum(capital), riskPct: toNum(riskPct),
      leverage: toNum(leverage), notes, userId: user.uid, createdAt: Date.now(),
    });
    setSymbol(""); setLivePrice(""); setEntry(""); setSl(""); setTp(""); setNotes(""); setLivePriceLabel("");
  };

  const deleteTrade = async (id) => { if (!user) return; await deleteDoc(doc(db, "trades", id)); };

  const filteredTrades = historyFilter === "all" ? trades : trades.filter((t) => t.strategy === historyFilter);

  const TABS = [
    { id: "journal", label: isUa ? "Журнал угоди" : "Trade Journal" },
    { id: "strategy", label: isUa ? "Стратегії" : "Strategies" },
    { id: "history", label: isUa ? "Збережені угоди" : "Saved Trades" },
  ];

  if (!user) {
    return (
      <div className="container page-trading">
        <PageTitle tabId="трейд">{isUa ? "Трейдинг" : "Trading"}</PageTitle>
        <div className="card"><p>{isUa ? "Увійди через Google, щоб вести торговий журнал." : "Sign in with Google to use the trading journal."}</p></div>
      </div>
    );
  }

  return (
    <div className="container page-trading">
      <div className="tj-header-row">
        <PageTitle tabId="трейд">{isUa ? "Трейдинг" : "Trading"}</PageTitle>
        <span className="tj-live-badge"><span className="tj-live-dot" />Binance live</span>
      </div>

      <div className="tj-tabs">
        {TABS.map((t) => (
          <button key={t.id} className={`tj-tab ${activeTab === t.id ? "tj-tab-active" : ""}`} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── JOURNAL ── */}
      {activeTab === "journal" && (
        <div className="trade-grid">
          <div className="card">
            <p className="tj-section-title">{isUa ? "Символ і ціна" : "Symbol & Price"}</p>
            <div className="form" style={{ marginBottom: 10 }}>
              <div style={{ flex: 2, position: "relative" }}>
                <input
                  list="crypto-pairs"
                  placeholder={isUa ? "BTCUSDT, ETHUSDT..." : "BTCUSDT, ETHUSDT..."}
                  value={symbol}
                  onChange={handleSymbolChange}
                />
                <datalist id="crypto-pairs">
                  {POPULAR_PAIRS.map((p) => <option key={p} value={p} />)}
                </datalist>
              </div>
              <button className="tj-fetch-btn" onClick={fetchPrice} disabled={fetching}>
                {fetchLabel}
              </button>
            </div>
            {livePriceLabel && (
              <div className="tj-price-badge">{livePriceLabel}</div>
            )}
            <div className="form" style={{ marginTop: 10 }}>
              <input
                type="number"
                placeholder={isUa ? "Поточна ціна (USDT)" : "Live price (USDT)"}
                value={livePrice}
                step="any"
                onChange={(e) => setLivePrice(e.target.value)}
              />
              {/* Direction toggle */}
              <div className="dir-toggle">
                <button
                  type="button"
                  className={`dir-btn ${direction === "long" ? "dir-long-active" : ""}`}
                  onClick={() => setDirection("long")}
                >↑ Long</button>
                <button
                  type="button"
                  className={`dir-btn ${direction === "short" ? "dir-short-active" : ""}`}
                  onClick={() => setDirection("short")}
                >↓ Short</button>
              </div>
              <select value={strategy} onChange={(e) => setStrategy(e.target.value)}>
                {STRATEGIES.map((s) => <option key={s.name}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="card">
            <p className="tj-section-title">{isUa ? "Параметри угоди" : "Trade Parameters"}</p>
            <div className="form" style={{ marginBottom: 10 }}>
              {[
                { label: isUa ? "Капітал" : "Capital", val: capital, set: setCapital, ph: "1000" },
                { label: isUa ? "Ризик (%)" : "Risk (%)", val: riskPct, set: setRiskPct, ph: "1", step: "0.1" },
                { label: isUa ? "Плече" : "Leverage", val: leverage, set: setLeverage, ph: "1" },
              ].map(({ label, val, set, ph, step }) => (
                <div key={label} style={{ flex: 1 }}>
                  <label className="tj-field-label">{label}</label>
                  <input type="number" placeholder={ph} value={val} step={step || "1"} onChange={(e) => set(e.target.value)} />
                </div>
              ))}
            </div>
            <div className="form">
              {[
                { label: isUa ? "Вхід" : "Entry", val: entry, set: setEntry },
                { label: "Стоп-лос", val: sl, set: setSl },
                { label: "Тейк-профіт", val: tp, set: setTp },
              ].map(({ label, val, set }) => (
                <div key={label} style={{ flex: 1 }}>
                  <label className="tj-field-label">{label}</label>
                  <input type="number" placeholder="0" value={val} step="any" onChange={(e) => set(e.target.value)} />
                </div>
              ))}
            </div>
            <textarea
              className="journal-textarea"
              placeholder={isUa ? "Сетап, причина входу..." : "Setup, entry reason..."}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              style={{ marginTop: 10, width: "100%" }}
            />
          </div>

          <div className="card">
            <p className="tj-section-title">{isUa ? "Автокалькулятор" : "Auto Calculator"}</p>
            {calc ? (
              <div className="tj-calc-grid">
                {[
                  { label: isUa ? "Розмір позиції" : "Position Size", val: calc.posSize, color: "#f5ede2" },
                  { label: isUa ? "Сума ризику" : "Risk Amount", val: calc.riskAmt, color: "#b85a35" },
                  { label: isUa ? "Потенційний прибуток" : "Potential Profit", val: calc.potProfit ?? "—", color: calc.potProfit ? "#C8962B" : "#6b5e50" },
                  { label: "R:R Ratio", val: calc.rrRatio ? `1 : ${calc.rrRatio}` : "—", color: "#f5ede2", rr: calc.rrPct },
                  { label: isUa ? "Цінність позиції" : "Position Value", val: calc.posVal, color: "#f5ede2" },
                  { label: isUa ? "Вхід зі спредом" : "Spread Entry", val: calc.spreadEntry, color: "#f5ede2" },
                ].map(({ label, val, color, rr }) => (
                  <div key={label} className="tj-calc-card">
                    <p className="tj-calc-label">{label}</p>
                    <p className="tj-calc-val" style={{ color }}>{val}</p>
                    {rr !== undefined && (
                      <div className="tj-rr-bar"><div className="tj-rr-fill" style={{ width: `${rr}%` }} /></div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty" style={{ padding: "20px 0" }}>
                {isUa ? "Введіть параметри угоди для розрахунку" : "Enter trade parameters to calculate"}
              </p>
            )}
          </div>

          <button className="tj-save-btn" onClick={saveTrade}>
            {isUa ? "+ Зберегти угоду" : "+ Save Trade"}
          </button>
        </div>
      )}

      {/* ── STRATEGY ── */}
      {activeTab === "strategy" && (
        <div className="trade-grid">
          <div className="card">
            <p className="tj-section-title">{isUa ? "Оберіть стратегію" : "Pick a Strategy"}</p>
            <div className="tj-strat-grid">
              {STRATEGIES.map((s, i) => (
                <div
                  key={s.name}
                  className={`tj-strat-card ${selStrat === i ? "tj-strat-active" : ""}`}
                  onClick={() => setSelStrat(selStrat === i ? null : i)}
                >
                  <p className="tj-strat-name">{s.name}</p>
                  <p className="tj-strat-tf">{s.tf}</p>
                  <div className="tj-strat-tags">
                    {s.tags.map((tag) => <span key={tag} className="tj-strat-tag">{tag}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {selStrat !== null && (
            <div className="card">
              <h3 style={{ color: "#C8962B", marginBottom: 14, fontSize: "1rem" }}>{STRATEGIES[selStrat].name}</h3>
              {[
                [isUa ? "Таймфрейм" : "Timeframe", STRATEGIES[selStrat].tf],
                ["R:R ціль", STRATEGIES[selStrat].rr],
                [isUa ? "Ризик/угода" : "Risk/trade", STRATEGIES[selStrat].risk],
                [isUa ? "Індикатори" : "Indicators", STRATEGIES[selStrat].indicators],
                [isUa ? "Сетап" : "Setup", STRATEGIES[selStrat].setup],
              ].map(([k, v]) => (
                <div key={k} className="tj-strat-row">
                  <span className="tj-strat-key">{k}</span>
                  <span className="tj-strat-val">{v}</span>
                </div>
              ))}
              <p className="tj-section-title" style={{ marginTop: 14, marginBottom: 8 }}>
                {isUa ? "Поради" : "Tips"}
              </p>
              {STRATEGIES[selStrat].tips.map((tip) => (
                <div key={tip} className="tj-strat-tip">{tip}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY ── */}
      {activeTab === "history" && (
        <div className="trade-grid">
          <RRChart trades={trades} />

          {/* Strategy filter */}
          <div className="filters" style={{ marginTop: 0 }}>
            <button
              className={historyFilter === "all" ? "filter-btn active" : "filter-btn"}
              onClick={() => setHistoryFilter("all")}
            >
              {isUa ? "Всі" : "All"}
            </button>
            {STRATEGIES.map((s) => (
              <button
                key={s.name}
                className={historyFilter === s.name ? "filter-btn active" : "filter-btn"}
                onClick={() => setHistoryFilter(s.name)}
              >
                {s.name}
              </button>
            ))}
          </div>

          <div className="card">
            <p className="tj-section-title">
              {filteredTrades.length} {isUa ? "угод" : "trades"}
              {historyFilter !== "all" && ` · ${historyFilter}`}
            </p>
            {filteredTrades.length === 0 ? (
              <p className="empty">{isUa ? "Угод ще немає" : "No trades yet"}</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filteredTrades.map((trade) => {
                  const rrRaw = trade.tp && trade.sl && trade.entry
                    ? Math.abs(trade.tp - trade.entry) / Math.abs(trade.entry - trade.sl)
                    : null;
                  const rr = rrRaw ? `1:${round(rrRaw, 1)}` : "—";
                  const isLong = trade.direction === "long";
                  return (
                    <div key={trade.id} className="tj-history-item">
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 600, color: "#f5ede2" }}>{trade.symbol}</span>
                          <span style={{
                            fontSize: "0.72rem",
                            color: isLong ? "#C8962B" : "#9B6AE8",
                            background: isLong ? "rgba(200,150,43,0.12)" : "rgba(155,106,232,0.12)",
                            padding: "2px 8px", borderRadius: 6,
                          }}>
                            {trade.direction?.toUpperCase()}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "#6b5e50" }}>{trade.strategy}</span>
                          <span style={{ fontSize: "0.72rem", color: "#6b5e50", marginLeft: "auto" }}>
                            {new Date(trade.createdAt).toLocaleDateString(isUa ? "uk-UA" : "en-US")}
                          </span>
                        </div>
                        <p style={{ fontSize: "0.78rem", color: "#6b5e50", marginTop: 4 }}>
                          {isUa ? "Вхід" : "Entry"}: {trade.entry}
                          {trade.sl ? ` · SL: ${trade.sl}` : ""}
                          {trade.tp ? ` · TP: ${trade.tp}` : ""}
                          {trade.leverage > 1 ? ` · x${trade.leverage}` : ""}
                        </p>
                        {trade.notes && (
                          <p style={{ fontSize: "0.82rem", color: "#a09082", marginTop: 4, fontStyle: "italic" }}>
                            {trade.notes}
                          </p>
                        )}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                        <span style={{ fontWeight: 600, color: "#C8962B", fontSize: "0.88rem" }}>R:R {rr}</span>
                        <button className="del-btn" onClick={() => deleteTrade(trade.id)}>✕</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
