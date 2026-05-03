const ICON_COLORS = {
  "дашборд": "#E8762B",
  "бюджет":  "#6AAF3D",
  "витрати": "#E05A2B",
  "портфель":"#3DA8C8",
  "трейд":   "#C8962B",
  "планер":  "#9B6AE8",
  "записник":"#3DC8A0",
};

function IconHome({ color }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="40,14 16,34 16,64 64,64 64,34" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
      <rect x="30" y="44" width="20" height="20" rx="2" fill={color} opacity="0.9"/>
      <circle cx="40" cy="14" r="3" fill={color}/>
    </svg>
  );
}

function IconBudget({ color }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="36" r="20" stroke={color} strokeWidth="2"/>
      <text x="40" y="43" textAnchor="middle" fill={color} style={{ fontFamily: "sans-serif", fontSize: "18px", fontWeight: "700" }}>₴</text>
      <line x1="20" y1="62" x2="60" y2="62" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="26" y1="69" x2="54" y2="69" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    </svg>
  );
}

function IconExpenses({ color }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="24" y="16" width="32" height="38" rx="4" stroke={color} strokeWidth="1.8"/>
      <line x1="30" y1="26" x2="50" y2="26" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>
      <line x1="30" y1="32" x2="44" y2="32" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>
      <line x1="30" y1="38" x2="47" y2="38" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>
      <line x1="40" y1="54" x2="40" y2="70" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
      <polyline points="32,63 40,72 48,63" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconPortfolio({ color }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="16" y="32" width="48" height="34" rx="5" stroke={color} strokeWidth="2"/>
      <path d="M28 32 L28 26 Q28 20 40 20 Q52 20 52 26 L52 32" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="16" y1="48" x2="64" y2="48" stroke={color} strokeWidth="1.5" opacity="0.5"/>
      <rect x="35" y="45" width="10" height="7" rx="2" fill={color} opacity="0.8"/>
    </svg>
  );
}

function IconTrading({ color }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="26" y1="18" x2="26" y2="62" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
      <rect x="21" y="24" width="10" height="22" rx="2" fill="#6AAF3D"/>
      <line x1="40" y1="20" x2="40" y2="64" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
      <rect x="35" y="32" width="10" height="18" rx="2" fill="#E05A2B"/>
      <line x1="54" y1="16" x2="54" y2="58" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
      <rect x="49" y="20" width="10" height="24" rx="2" fill="#6AAF3D"/>
      <line x1="16" y1="66" x2="64" y2="66" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
    </svg>
  );
}

function IconPlanner({ color }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="20" width="52" height="46" rx="5" stroke={color} strokeWidth="1.8"/>
      <rect x="14" y="20" width="52" height="14" rx="5" fill={color} opacity="0.3"/>
      <line x1="28" y1="16" x2="28" y2="26" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="52" y1="16" x2="52" y2="26" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="26" cy="44" r="2.5" fill={color}/>
      <circle cx="40" cy="44" r="2.5" fill={color} opacity="0.6"/>
      <circle cx="54" cy="44" r="2.5" fill={color} opacity="0.6"/>
      <circle cx="26" cy="56" r="2.5" fill={color} opacity="0.6"/>
      <circle cx="40" cy="56" r="2.5" fill={color}/>
      <circle cx="54" cy="56" r="2.5" fill={color} opacity="0.3"/>
    </svg>
  );
}

function IconJournal({ color }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="14" width="40" height="52" rx="4" stroke={color} strokeWidth="1.8"/>
      <line x1="30" y1="14" x2="30" y2="66" stroke={color} strokeWidth="2" opacity="0.5"/>
      <circle cx="30" cy="24" r="3" stroke={color} strokeWidth="1.5"/>
      <circle cx="30" cy="36" r="3" stroke={color} strokeWidth="1.5"/>
      <circle cx="30" cy="48" r="3" stroke={color} strokeWidth="1.5"/>
      <circle cx="30" cy="60" r="3" stroke={color} strokeWidth="1.5"/>
      <line x1="36" y1="28" x2="54" y2="28" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
      <line x1="36" y1="36" x2="54" y2="36" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
      <line x1="36" y1="44" x2="54" y2="44" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
      <line x1="36" y1="52" x2="48" y2="52" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.4"/>
    </svg>
  );
}

const ICON_MAP = {
  "дашборд": IconHome,
  "бюджет":  IconBudget,
  "витрати": IconExpenses,
  "портфель":IconPortfolio,
  "трейд":   IconTrading,
  "планер":  IconPlanner,
  "записник":IconJournal,
};

export default function NavIcon({ tabId, active }) {
  const Icon = ICON_MAP[tabId];
  if (!Icon) return null;
  const color = active ? "#fff8f4" : (ICON_COLORS[tabId] || "#a09082");
  return (
    <span className="tab-icon">
      <Icon color={color} />
    </span>
  );
}
