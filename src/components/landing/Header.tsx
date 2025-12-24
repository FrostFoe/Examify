"use client";
import {
  House,
  LogOut,
  User as UserIcon,
  LayoutDashboard,
  Users,
  FileText,
  LogIn,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "../theme-toggle";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

const navLinks = [
  { label: "হোম", href: "/", icon: <House size={18} /> },
  {
    label: "ড্যাশবোর্ড",
    href: "/dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  {
    label: "ব্যাচ",
    href: "/dashboard/batches",
    icon: <Users size={18} />,
  },
  {
    label: "পরীক্ষা",
    href: "/dashboard/exams",
    icon: <FileText size={18} />,
  },
];

export function Header() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card rounded-b-2xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-x-4">
          <Link
            href="/"
            aria-label="হোমপেজে যান"
            className="group flex items-center space-x-2"
          >
            <Logo className="h-6 w-auto transition-transform duration-300 group-hover:scale-110 group-active:scale-95" />
            <span className="font-bold text-lg hidden sm:inline">MNR Study</span>
          </Link>
        </div>

        <nav className="flex items-center gap-x-2">
          {navLinks.map(({ label, href, icon }) => (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={cn(
                "relative flex cursor-pointer items-center justify-center rounded-md transition-colors duration-300 h-9 px-2 md:px-3",
                pathname === href
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <div className="relative z-10 flex items-center gap-2">
                <div className="relative">
                  {icon}
                  {pathname === href && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-full h-0.5 bg-primary rounded-full"></div>
                  )}
                </div>
                <span className="whitespace-nowrap text-sm hidden md:inline">
                  {label}
                </span>
              </div>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-x-2">
          <ThemeToggle />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <UserIcon className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.roll}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>ড্যাশবোর্ড</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>লগ আউট</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="md:w-auto w-9 px-0 md:px-3"
            >
              <Link href="/login">
                <LogIn className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">লগইন</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
