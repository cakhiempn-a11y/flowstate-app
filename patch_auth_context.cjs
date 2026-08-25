const fs = require('fs');
let code = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');

code = code.replace(
  "import { User, onAuthStateChanged } from 'firebase/auth';",
  "import { User, onAuthStateChanged, getRedirectResult } from 'firebase/auth';"
);

code = code.replace(
  "interface AuthContextType {\n  user: User | null;\n  loading: boolean;\n  refreshUser: () => Promise<void>;\n}",
  "interface AuthContextType {\n  user: User | null;\n  loading: boolean;\n  redirectError: Error | null;\n  refreshUser: () => Promise<void>;\n}"
);

code = code.replace(
  "const AuthContext = createContext<AuthContextType>({ user: null, loading: true, refreshUser: async () => {} });",
  "const AuthContext = createContext<AuthContextType>({ user: null, loading: true, redirectError: null, refreshUser: async () => {} });"
);

code = code.replace(
  "const [user, setUser] = useState<User | null>(null);\n  const [loading, setLoading] = useState(true);",
  "const [user, setUser] = useState<User | null>(null);\n  const [loading, setLoading] = useState(true);\n  const [redirectError, setRedirectError] = useState<Error | null>(null);"
);

code = code.replace(
  "  return (\n    <AuthContext.Provider value={{ user, loading, refreshUser }}>",
  "  return (\n    <AuthContext.Provider value={{ user, loading, redirectError, refreshUser }}>"
);

const oldEffect = `  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);`;

const newEffect = `  useEffect(() => {
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
  }, []);`;

code = code.replace(oldEffect, newEffect);

fs.writeFileSync('src/contexts/AuthContext.tsx', code);
