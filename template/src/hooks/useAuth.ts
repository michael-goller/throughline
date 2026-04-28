import { useState, useEffect, useCallback } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
}

let cachedUser: User | null = null;
let checkedOnce = false;

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: cachedUser,
    loading: !checkedOnce,
  });

  useEffect(() => {
    if (checkedOnce) return;
    checkedOnce = true;

    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((user) => {
        cachedUser = user;
        setState({ user, loading: false });
      })
      .catch(() => {
        setState({ user: null, loading: false });
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const text = await res.text();
      let msg = 'Login failed';
      try { msg = JSON.parse(text).error || msg; } catch { msg = text.slice(0, 200) || msg; }
      throw new Error(msg);
    }
    const user = await res.json();
    cachedUser = user;
    setState({ user, loading: false });
    return user;
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, name }),
    });
    if (!res.ok) {
      const text = await res.text();
      let msg = 'Signup failed';
      try { msg = JSON.parse(text).error || msg; } catch { msg = text.slice(0, 200) || msg; }
      throw new Error(msg);
    }
    const data = await res.json();
    return data as { message: string };
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    cachedUser = null;
    checkedOnce = false;
    setState({ user: null, loading: false });
  }, []);

  return { ...state, login, signup, logout };
}
