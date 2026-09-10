"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Moon, Sun, LogOut, User } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { logout, getUser } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const segmentLabels: Record<string, string> = {
  bmt: "BMT",
  petugas: "Petugas",
  setoran: "Setoran",
  "device-request": "Approval Perangkat",
  "jenis-produk": "Jenis Produk",
  laporan: "Laporan",
  user: "User",
  lokasi: "Lokasi",
  pengaturan: "Pengaturan",
  users: "Pengguna",
  roles: "Role & Permission",
  system: "System Status",
};

export function AppHeader() {
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const router = useRouter();
  const [username, setUsername] = useState<string>("Admin");
  const [userId, setUserId] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const user = getUser();
      if (user && typeof user.username === "string") {
        setUsername(user.username);
        if (typeof user.id === "number") {
          setUserId(user.id);
        }
      }
    } catch {
      // Ignore localStorage parse errors — keep default
    }
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const segments = pathname.split("/").filter(Boolean);

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // Ignore logout errors — clear local state via logout() anyway
    }
    router.push("/login");
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      <Breadcrumb className="flex-1">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/" />}>
              Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>
          {segments.map((seg, idx) => {
            const isLast = idx === segments.length - 1;
            const href = "/" + segments.slice(0, idx + 1).join("/");
            const label = segmentLabels[seg] || seg;

            return (
              <span key={href} className="contents">
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink render={<Link href={href} />}>
                      {label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </span>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Dark mode toggle */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      >
        <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>

      {/* User dropdown (custom — compact, no Base UI Menu) */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-md p-1 hover:bg-accent outline-none cursor-pointer"
        >
          <Avatar size="sm">
            <AvatarFallback className="bg-emerald-700 text-white text-xs">
              {username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium sm:inline-block">
            {username}
          </span>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-lg border bg-popover p-1 text-popover-foreground shadow-md">
            <div className="flex flex-col space-y-1 px-2 py-2">
              <p className="text-sm font-medium leading-none">{username}</p>
              <p className="text-xs leading-none text-muted-foreground">
                Administrator
              </p>
            </div>
            <div className="my-1 h-px bg-border" />
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                router.push(`/pengaturan/users/${userId ?? 1}`);
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
            >
              <User className="size-4" />
              Profil Saya
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                handleLogout();
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
            >
              <LogOut className="size-4" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
