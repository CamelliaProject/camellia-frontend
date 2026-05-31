import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '../firebase';
import apiClient from '../services/apiClient';

interface User {
  id?: string;
  uid?: string;
  username?: string;
  name?: string;
  email: string;
  role: 'superadmin' | 'plantationadmin' | 'tourist';
  plantationId?: string;
  token?: string;
  passwordChanged?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (userData: User) => void;
  updateUser: (patch: Partial<User>) => void;
  logOut: () => void;
  isAuthenticated: boolean;
  setAuthToken: (token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem('camellia_user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error('Failed to parse user from localStorage', error);
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          await handleFirebaseUser(firebaseUser);
        } else {
          clearAuth();
        }
      } catch (error) {
        console.error('Auth state handling error:', error);
        clearAuth();
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleFirebaseUser = async (firebaseUser: FirebaseUser) => {
    const idToken = await firebaseUser.getIdToken();

    // Custom-token sign-ins (admin login) produce a Firebase user with no email.
    // Don't call /users/sync for these — the signIn() call in the login component
    // already set the correct user/role. Just refresh the stored token and return.
    if (!firebaseUser.email) {
      localStorage.setItem('firebaseAuthToken', idToken);
      apiClient.defaults.headers.common.Authorization = `Bearer ${idToken}`;
      return;
    }

    const email = firebaseUser.email;
    const name = firebaseUser.displayName ?? email.split('@')[0] ?? 'User';

    try {
      const response = await apiClient.post('/users/sync', {
        uid: firebaseUser.uid,
        name,
        email,
      });

      const syncedUser: User = {
        id: response.data?.id,
        uid: firebaseUser.uid,
        username: response.data?.username,
        name: response.data?.name,
        email: response.data?.email ?? email,
        role: response.data?.role || 'tourist',
        plantationId: response.data?.plantation_id,
        token: idToken,
      };

      setUser(syncedUser);
      localStorage.setItem('camellia_user', JSON.stringify(syncedUser));
      localStorage.setItem('firebaseAuthToken', idToken);
      apiClient.defaults.headers.common.Authorization = `Bearer ${idToken}`;
    } catch (err) {
      console.error('Failed to sync user with backend:', err);
      const fallbackUser: User = {
        uid: firebaseUser.uid,
        email,
        name,
        role: 'tourist',
        token: idToken,
      };
      setUser(fallbackUser);
      localStorage.setItem('firebaseAuthToken', idToken);
      apiClient.defaults.headers.common.Authorization = `Bearer ${idToken}`;
    }
  };

  const clearAuth = () => {
    setUser(null);
    localStorage.removeItem('camellia_user');
    localStorage.removeItem('firebaseAuthToken');
    delete apiClient.defaults.headers.common.Authorization;
  };

  const signIn = (userData: User) => {
    setUser(userData);
    localStorage.setItem('camellia_user', JSON.stringify(userData));
    if (userData.token) {
      localStorage.setItem('firebaseAuthToken', userData.token);
      apiClient.defaults.headers.common.Authorization = `Bearer ${userData.token}`;
    }
  };

  const updateUser = (patch: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      localStorage.setItem('camellia_user', JSON.stringify(updated));
      return updated;
    });
  };

  const logOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Firebase sign-out failed:', error);
    }
    clearAuth();
  };

  const setAuthToken = (token: string) => {
    if (user) {
      const updatedUser = { ...user, token };
      setUser(updatedUser);
      localStorage.setItem('camellia_user', JSON.stringify(updatedUser));
    }
    localStorage.setItem('firebaseAuthToken', token);
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, loading, signIn, updateUser, logOut, isAuthenticated, setAuthToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
