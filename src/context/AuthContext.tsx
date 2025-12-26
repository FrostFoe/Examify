"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { apiRequest } from "@/lib/api";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/types";

type AuthContextType = {
  user: User | null;
  signIn: (
    rollNumber: string,
    password: string,
    redirectTo?: string,
  ) => Promise<void>;
  signOut: () => void;
  setGuestUser: (user: User) => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Guard against server-side rendering
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    // This code now runs only on the client
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = async (
    rollNumber: string,
    password: string,
    redirectTo?: string,
  ) => {
    let actualRollNumber = rollNumber;
    if (rollNumber.includes("-")) {
      const parts = rollNumber.split("-");
      if (parts.length > 1 && parts[1]) {
        actualRollNumber = parts[1].trim();
      }
    }

    const result = await apiRequest<User>(
      "auth",
      "POST",
      {
        roll: actualRollNumber,
        pass: password,
      },
      { action: "student-login" },
    );

    if (!result.success || !result.data) {
      throw new Error(
        result.message || "ব্যবহারকারী খুঁজে পাওয়া যায়নি বা পাসওয়ার্ড ভুল।",
      );
    }

    const userData = result.data;
    setUser(userData);

    // Guard localStorage access
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(userData));
    }

    if (redirectTo) {
      router.push(redirectTo);
    } else {
      router.push("/dashboard");
    }
  };

  const setGuestUser = (userData: User) => {
    setUser(userData);
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(userData));
    }
  };

  const signOut = () => {
    setUser(null);

    // Guard localStorage access
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
    }

    router.push("/login");
  };

  const value = {
    user,
    signIn,
    signOut,
    setGuestUser,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error(
      "useAuth অবশ্যই একটি AuthProvider এর মধ্যে ব্যবহার করতে হবে",
    );
  }
  return context;
};
