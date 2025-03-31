
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, getCurrentUser, loginUser, logoutUser, registerUser } from '@/services/authService';
import { toast } from 'sonner';

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error("Failed to load user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      await loginUser(email, password);
      const user = await getCurrentUser();
      setCurrentUser(user);
      toast.success("You have been logged in successfully.");
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Invalid email or password.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await logoutUser();
      setCurrentUser(null);
      toast.success("You have been logged out successfully.");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      await registerUser(email, password);
      const user = await getCurrentUser();
      setCurrentUser(user);
      toast.success("Account created successfully.");
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Could not create account.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmin = currentUser?.role === "admin";

  const value = {
    currentUser,
    isLoading,
    login,
    logout,
    register,
    isAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
