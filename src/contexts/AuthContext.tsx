import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase';
import { User, onAuthStateChanged, getRedirectResult } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  redirectError: Error | null;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, redirectError: null, refreshUser: async () => {} });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirectError, setRedirectError] = useState<Error | null>(null);

  const refreshUser = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setUser({ ...auth.currentUser } as User);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let redirectResolved = false;
    let authStateResolved = false;

    const checkDone = () => {
      if (redirectResolved && authStateResolved) {
        setLoading(false);
      }
    };

    getRedirectResult(auth)
      .catch((error) => {
        console.error("Auth redirect error:", error);
        if (isMounted) setRedirectError(error as Error);
      })
      .finally(() => {
        if (isMounted) {
          redirectResolved = true;
          checkDone();
        }
      });

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (isMounted) {
        setUser(firebaseUser);
        authStateResolved = true;
        checkDone();
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, redirectError, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );

};
