import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { setApiAuthToken } from '../services/api';

// Define the User interface
interface User {
  username: string;
  email: string;
  role: 'superadmin' | 'plantationadmin' | 'tourist';
  plantationId?: string;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  signIn: (userData: Omit<User, 'role'> & { role?: 'superadmin' | 'plantationadmin' | 'tourist'; plantationId?: string; token?: string }) => void;
  logOut: () => void;
  isAuthenticated: boolean;
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

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('camellia_user', JSON.stringify(user));
        setApiAuthToken(user.token);
      } else {
        localStorage.removeItem('camellia_user');
        setApiAuthToken();
      }
    } catch (error) {
      console.error('Failed to save user to localStorage', error);
    }
  }, [user]);

  const signIn = (userData: Omit<User, 'role'> & { role?: 'superadmin' | 'plantationadmin' | 'tourist'; plantationId?: string; token?: string }) => {
    const userWithRole: User = {
      ...userData,
      role: userData.role || 'tourist',
    };
    setUser(userWithRole);
  };

  const logOut = () => {
    setUser(null);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, signIn, logOut, isAuthenticated }}>
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
