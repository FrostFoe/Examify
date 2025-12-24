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
import type { Admin } from "@/lib/types";

type AdminAuthContextType = {
  admin: Admin | null;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => void;
  loading: boolean;
};

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined,
);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // This code now runs only on the client
    if (typeof window !== "undefined") {
      try {
        const storedAdmin = localStorage.getItem("admin-user");
        if (storedAdmin) {
          setAdmin(JSON.parse(storedAdmin));
        }
      } catch (error) {
        console.error("Failed to parse admin user from localStorage", error);
        localStorage.removeItem("admin-user");
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (
      !loading &&
      !admin &&
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/admin") &&
      window.location.pathname !== "/admin/login"
    ) {
      router.push("/admin/login");
    }
  }, [admin, loading, router]);

  const signIn = async (username: string, password: string) => {
    const result = await apiRequest<Admin>(
      "auth",
      "POST",
      {
        username,
        password,
      },
      { action: "admin-login" },
    );

    if (!result.success || !result.data) {
      throw new Error(
        result.message || "অ্যাডমিন খুঁজে পাওয়া যায়নি বা পাসওয়ার্ড ভুল।",
      );
    }

    const adminData = result.data;
    setAdmin(adminData);
    localStorage.setItem("admin-user", JSON.stringify(adminData));
  };

  const signOut = () => {
    setAdmin(null);
    localStorage.removeItem("admin-user");
    router.push("/admin/login");
  };

  const value = {
    admin,
    signIn,
    signOut,
    loading,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
};
