import NavIcon from "./NavIcons";

export default function PageTitle({ tabId, children }) {
  return (
    <div className="page-title">
      <span className="page-title-icon">
        <NavIcon tabId={tabId} active={false} />
      </span>
      <h1>{children}</h1>
    </div>
  );
}
