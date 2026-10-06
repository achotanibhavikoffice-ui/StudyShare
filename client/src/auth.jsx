import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!sessionStorage.getItem('token'));

  useEffect(() => {
    if (!sessionStorage.getItem('token')) return;
    api('/auth/me').then(setUser).catch(() => sessionStorage.removeItem('token')).finally(() => setLoading(false));
  }, []);

  const login = ({ token, user }) => { sessionStorage.setItem('token', token); setUser(user); };
  const logout = () => { sessionStorage.removeItem('token'); setUser(null); };

  return <Ctx.Provider value={{ user, setUser, login, logout, loading }}>{children}</Ctx.Provider>;
}
