import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API } from "@/lib/api";

/**
 * Emergent managed Google sign-in.
 * REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
 */

const AuthContext = createContext({ user: null, loading: true, login: () => {}, logout: () => {} });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch(`${API}/auth/me`, { credentials: "include" });
      if (!res.ok) throw new Error("unauthenticated");
      setUser(await res.json());
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // CRITICAL: If returning from OAuth callback, skip the /me check.
    // AuthCallback will exchange the session_id and establish the session first.
    if (window.location.hash?.includes("session_id=")) {
      setLoading(false);
      return;
    }
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(() => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" });
    } catch (e) {
      /* session cleanup best-effort */
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

/** Handles the one-time session_id in the URL fragment after Google auth. */
export const AuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;
    const params = new URLSearchParams(location.hash.replace(/^#/, ""));
    const sessionId = params.get("session_id");
    const finish = (userData) => {
      window.history.replaceState(null, "", window.location.pathname);
      if (userData) setUser(userData);
      navigate("/", { replace: true, state: userData ? { user: userData } : undefined });
    };
    if (!sessionId) {
      finish(null);
      return;
    }
    fetch(`${API}/auth/session`, {
      method: "POST",
      headers: { "X-Session-ID": sessionId },
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("exchange failed"))))
      .then((data) => finish(data.user))
      .catch(() => finish(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#E0D8C1]" data-testid="auth-callback">
      <p className="sys-chip text-[#232A2A]/60">Signing you in…</p>
    </div>
  );
};
