import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getAuth, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
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
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (userData: User) => void;
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
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const idToken = await firebaseUser.getIdToken();

          try {
            const syncResponse = await apiClient.post('/users/sync', {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email,
            });

            const userData: User = {
              id: syncResponse.data.id,
              uid: firebaseUser.uid,
              username: syncResponse.data.username,
              name: syncResponse.data.name,
              email: syncResponse.data.email,
              role: syncResponse.data.role || 'tourist',
              plantationId: syncResponse.data.plantation_id,
              token: idToken,
            };

            setUser(userData);
            localStorage.setItem('camellia_user', JSON.stringify(userData));
            localStorage.setItem('firebaseAuthToken', idToken);

            apiClient.defaults.headers.common.Authorization = `Bearer ${idToken}`;
          } catch (syncError) {
            console.error('Failed to sync user with backend:', syncError);
            const userData: User = {
              email: firebaseUser.email || 'unknown@example.com',
              role: 'tourist',
              token: idToken,
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'User',
            };
            setUser(userData);
            localStorage.setItem('firebaseAuthToken', idToken);
            apiClient.defaults.headers.common.Authorization = `Bearer ${idToken}`;
          }
        } else {
          setUser(null);
          localStorage.removeItem('camellia_user');
          localStorage.removeItem('firebaseAuthToken');
          delete apiClient.defaults.headers.common.Authorization;
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  const signIn = (userData: User) => {
    setUser(userData);
    localStorage.setItem('camellia_user', JSON.stringify(userData));
    if (userData.token) {
      localStorage.setItem('firebaseAuthToken', userData.token);
      apiClient.defaults.headers.common.Authorization = `Bearer ${userData.token}`;
    }
  };

  const logOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Firebase sign out error:', error);
    }
    setUser(null);
    localStorage.removeItem('camellia_user');
    localStorage.removeItem('firebaseAuthToken');
    delete apiClient.defaults.headers.common.Authorization;
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

  return (
    <AuthContext.Provider value={{ user, loading, signIn, logOut, isAuthenticated: !!user, setAuthToken }}>
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
