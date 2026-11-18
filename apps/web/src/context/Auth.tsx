import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { api, type User } from '../services/api';
interface AuthValue {
  user: User | null;
  loading: boolean;
  googleEnabled: boolean;
  emailDeliveryEnabled: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    fullName: string,
    email: string,
    password: string,
    confirmPassword: string,
  ) => Promise<void>;
  google: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (name: string, language: 'en' | 'hi') => Promise<void>;
  requireAuth: (action?: () => void) => boolean;
  closeDialog: () => void;
  dialogOpen: boolean;
  refresh: () => Promise<void>;
}
const Context = createContext<AuthValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [emailDeliveryEnabled, setEmailDeliveryEnabled] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const pending = useRef<(() => void) | undefined>(undefined);
  const refresh = async () => {
    const result = await api.auth.me();
    setUser(result.user);
    setGoogleEnabled(result.googleEnabled);
    setEmailDeliveryEnabled(result.emailDeliveryEnabled);
  };
  useEffect(() => {
    refresh()
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);
  const complete = (next: User) => {
    setUser(next);
    setDialogOpen(false);
    const action = pending.current;
    pending.current = undefined;
    action?.();
  };
  const login = async (email: string, password: string) =>
    complete((await api.auth.login(email, password)).user);
  const signup = async (name: string, email: string, password: string, confirm: string) =>
    complete((await api.auth.signup(name, email, password, confirm)).user);
  const google = async (credential: string) => complete((await api.auth.google(credential)).user);
  const logout = async () => {
    await api.auth.logout();
    setUser(null);
  };
  const updateProfile = async (name: string, language: 'en' | 'hi') =>
    setUser((await api.auth.profile(name, language)).user);
  const requireAuth = (action?: () => void) => {
    if (user) {
      action?.();
      return true;
    }
    pending.current = action;
    setDialogOpen(true);
    return false;
  };
  const closeDialog = () => {
    pending.current = undefined;
    setDialogOpen(false);
  };
  return (
    <Context.Provider
      value={{
        user,
        loading,
        googleEnabled,
        emailDeliveryEnabled,
        login,
        signup,
        google,
        logout,
        updateProfile,
        requireAuth,
        closeDialog,
        dialogOpen,
        refresh,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error('Auth provider missing');
  return value;
}
