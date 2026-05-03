import { signInWithPopup, signInWithRedirect, signOut } from "firebase/auth";
import { auth, provider } from "./firebase";
import { useLang } from "./useLang";

export default function Auth({ user }) {
  const { t } = useLang();

  const login = () => {
    signInWithPopup(auth, provider).catch((error) => {
      if (error.code === "auth/popup-blocked" || error.code === "auth/popup-cancelled-by-user") {
        signInWithRedirect(auth, provider);
      }
    });
  };

  const logout = async () => {
    await signOut(auth);
  };

  const userLabel = user?.displayName || user?.email || t("defaultUser");

  return (
    <div style={{ marginBottom: 20, display: "flex", gap: 12, alignItems: "center" }}>
      {user ? (
        <>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#a09082" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="7" r="4"/>
              <path d="M4 21 Q4 15 12 15 Q20 15 20 21"/>
            </svg>
            {userLabel}
          </span>
          <button onClick={logout}>{t("logout")}</button>
        </>
      ) : (
        <button onClick={login}>{t("loginGoogle")}</button>
      )}
    </div>
  );
}

