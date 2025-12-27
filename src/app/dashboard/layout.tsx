"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, ReactNode, useState } from "react";
import {
  BarChart,
  LayoutDashboard,
  User as UserIcon,
  FileText,
  Users,
  Home,
} from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { CustomLoader } from "@/components";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const sidebarNavItems = [
  { title: "ড্যাশবোর্ড", href: "/dashboard", icon: LayoutDashboard },
  { title: "সকল ব্যাচ", href: "/dashboard/batches", icon: Users },
  { title: "পরীক্ষাসমূহ", href: "/dashboard/exams", icon: FileText },
  { title: "ফলাফল", href: "/dashboard/results", icon: BarChart },
  { title: "প্রোফাইল", href: "/dashboard/profile", icon: UserIcon },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const isPublicPath =
    pathname?.match(/^\/dashboard\/exams\/[^/]+/) ||
    pathname?.match(/^\/dashboard\/batches\/[^/]+/);

  const isExamPage = pathname?.match(/^\/dashboard\/exams\/[^/]+$/);

  useEffect(() => {
    if (loading) return;

    if (!user && !isPublicPath) {
      router.push(`/login?redirect=${pathname}`);
    }
  }, [user, loading, router, pathname, isPublicPath]);

  if (loading || (!user && !isPublicPath)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <CustomLoader />
      </div>
    );
  }

  const handleLogout = () => {
    signOut();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <DashboardSidebar
        items={sidebarNavItems}
        userInfo={{
          name: user?.name || "Guest User",
          role: user?.roll ? `রোল: ${user.roll}` : user ? "Student" : "Guest",
        }}
        onLogout={handleLogout}
        panelType="student"
        onExpandedChange={setSidebarExpanded}
        hideMobileNav={!!isExamPage}
      />

      {/* Main Content */}
      <div
        className={`flex flex-1 flex-col pb-16 lg:pb-0 ${
          sidebarExpanded ? "lg:ml-64" : "lg:ml-20"
        }`}
      >
        <header className="flex h-16 items-center justify-between border-b bg-card pr-6 sticky top-0 z-20 rounded-b-2xl">
          <div className="flex items-center gap-2">
            <Link href="/" aria-label="হোমপেজে যান">
              <Button variant="ghost" size="icon">
                <Home className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <h1 className="text-xl font-semibold cursor-pointer">
                ড্যাশবোর্ড
              </h1>
            </Link>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <ThemeToggle />
            <Avatar className="h-9 w-9">
              <AvatarFallback>
                <UserIcon className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="text-right">
              <p className="text-sm font-medium">
                {user?.name
                  ? user.name.length > 11
                    ? `${user.name.slice(0, 11)}...`
                    : user.name
                  : "Guest"}
              </p>
              <p className="text-xs text-muted-foreground">
                {user?.roll ? `রোল: ${user.roll}` : user ? "Student" : "Guest"}
              </p>
            </div>
          </div>
        </header>
        <main className="flex-1 p-2 md:p-4 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
