import { useEffect, useState, useCallback } from "react";
import { AUTH_API_URL } from "../config/api";
import { AuthContext } from "./authContextDef";

const STORAGE_USER_KEY = "studysync_user";
const STORAGE_TOKEN_KEY = "studysync_token";

function syncLegacyStorage(user) {
  if (user) {
    try {
      sessionStorage.setItem("studysync-user", JSON.stringify(user));
      sessionStorage.setItem("studysyncUser", JSON.stringify(user));
      localStorage.setItem("studysync-user", JSON.stringify(user));
    } catch (e) {
      console.warn("Storage sync error:", e);
    }
  } else {
    try {
      sessionStorage.removeItem("studysync-user");
      sessionStorage.removeItem("studysyncUser");
      localStorage.removeItem("studysync-user");
    } catch (e) {
      console.warn("Storage sync error:", e);
    }
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_USER_KEY);
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        syncLegacyStorage(parsed);
        return parsed;
      }
      const legacyUser = sessionStorage.getItem("studysync-user") || sessionStorage.getItem("studysyncUser");
      if (legacyUser) {
        return JSON.parse(legacyUser);
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem(STORAGE_TOKEN_KEY) || null;
  });

  const [loading, setLoading] = useState(true);

  // Validate session on mount
  useEffect(() => {
    let active = true;

    async function checkAuth() {
      const storedToken = localStorage.getItem(STORAGE_TOKEN_KEY);
      if (!storedToken) {
        if (active) setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${AUTH_API_URL}/me`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (active && data.user) {
            setUser(data.user);
            localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
            syncLegacyStorage(data.user);
          }
        } else if (response.status === 401) {
          // Token expired or invalid
          if (active) {
            setUser(null);
            setToken(null);
            localStorage.removeItem(STORAGE_USER_KEY);
            localStorage.removeItem(STORAGE_TOKEN_KEY);
            syncLegacyStorage(null);
          }
        }
      } catch (error) {
        // Network down or backend offline - keep local session intact
        console.warn("Auth check warning:", error.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    checkAuth();

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await fetch(`${AUTH_API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    setUser(data.user);
    setToken(data.token);

    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
    localStorage.setItem(STORAGE_TOKEN_KEY, data.token);
    syncLegacyStorage(data.user);

    return data.user;
  }, []);

  const signup = useCallback(async (name, email, password) => {
    const response = await fetch(`${AUTH_API_URL}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Signup failed");
    }

    if (data.user && data.token) {
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
      localStorage.setItem(STORAGE_TOKEN_KEY, data.token);
      syncLegacyStorage(data.user);
    }

    return data;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_USER_KEY);
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    syncLegacyStorage(null);
  }, []);

  const updateProfile = useCallback(async (name) => {
    const currentToken = token || localStorage.getItem(STORAGE_TOKEN_KEY);
    if (!currentToken) throw new Error("Not authenticated");

    const response = await fetch(`${AUTH_API_URL}/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentToken}`,
      },
      body: JSON.stringify({ name }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to update profile");
    }

    setUser(data.user);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
    syncLegacyStorage(data.user);

    return data.user;
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
