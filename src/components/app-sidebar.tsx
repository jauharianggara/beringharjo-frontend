"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Building2,
  Users,
  Wallet,
  Smartphone,
  Package,
  BarChart3,
  FileText,
  MapPin,
  Settings,
  UserCog,
  Shield,
  Activity,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const mainNav = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "BMT", icon: Building2, href: "/bmt" },
  { label: "Petugas", icon: Users, href: "/petugas" },
  { label: "Setoran", icon: Wallet, href: "/setoran" },
  { label: "Approval Perangkat", icon: Smartphone, href: "/device-request" },
  { label: "Jenis Produk", icon: Package, href: "/jenis-produk" },
];

const laporanNav = [
  { label: "Laporan User", icon: FileText, href: "/laporan/user" },
  { label: "Laporan Lokasi", icon: MapPin, href: "/laporan/lokasi" },
];

const pengaturanNav = [
  { label: "Pengguna", icon: UserCog, href: "/pengaturan/users" },
  { label: "Role & Permission", icon: Shield, href: "/pengaturan/roles" },
  { label: "System Status", icon: Activity, href: "/pengaturan/system" },
];

export function AppSidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-0">
        <Link
          href="/"
          className="relative flex h-16 w-full items-center justify-center overflow-hidden px-3 hover:bg-sidebar-accent transition-colors"
        >
          {/* Logo penuh (landscape) — tampil saat sidebar expanded */}
          <Image
            src="/logo.png"
            alt="BMT Beringharjo"
            width={720}
            height={227}
            className="h-9 w-auto max-w-full object-contain group-data-[collapsible=icon]:hidden"
            priority
          />
          {/* Icon (kotak) — tampil saat sidebar collapsed */}
          <Image
            src="/icon.png"
            alt="BMT Beringharjo"
            width={192}
            height={192}
            className="hidden size-8 object-contain group-data-[collapsible=icon]:flex"
          />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* Main navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isActive(item.href)}
                    tooltip={item.label}
                    render={<Link href={item.href} />}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Laporan group */}
        <SidebarGroup>
          <SidebarGroupLabel>
            <BarChart3 className="mr-1 size-4" />
            Laporan
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {laporanNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isActive(item.href)}
                    tooltip={item.label}
                    render={<Link href={item.href} />}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Pengaturan group */}
        <SidebarGroup>
          <SidebarGroupLabel>
            <Settings className="mr-1 size-4" />
            Pengaturan
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {pengaturanNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isActive(item.href)}
                    tooltip={item.label}
                    render={<Link href={item.href} />}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="sm" className="text-xs text-muted-foreground">
              <span>© 2026 BMT Beringharjo</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
