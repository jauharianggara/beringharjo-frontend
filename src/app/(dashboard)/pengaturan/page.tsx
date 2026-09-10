"use client";

import { useEffect, useState } from "react";
import {
  Server,
  Clock,
  CheckCircle2,
  XCircle,
  Info,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

/* ---------- Types ---------- */
interface HealthResponse {
  status: string;
  uptime?: number;
  version?: string;
  [key: string]: unknown;
}

/* ---------- Settings Page ---------- */
export default function PengaturanPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  async function fetchHealth() {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8082";
      const res = await fetch(`${baseUrl}/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: HealthResponse = await res.json();
      setHealth(data);
    } catch (err) {
      setHealthError(
        err instanceof Error ? err.message : "Gagal terhubung ke server"
      );
    } finally {
      setHealthLoading(false);
    }
  }

  useEffect(() => {
    fetchHealth();
  }, []);

  /* Format uptime seconds to human readable */
  function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const parts: string[] = [];
    if (days > 0) parts.push(`${days} hari`);
    if (hours > 0) parts.push(`${hours} jam`);
    if (mins > 0) parts.push(`${mins} menit`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs} detik`);
    return parts.join(", ");
  }

  const isHealthy = health?.status === "ok";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground">
          Informasi sistem dan pengaturan aplikasi.
        </p>
      </div>

      <Tabs defaultValue="system">
        <TabsList>
          <TabsTrigger value="system">System Status</TabsTrigger>
          <TabsTrigger value="about">Tentang</TabsTrigger>
        </TabsList>

        {/* System Status Tab */}
        <TabsContent value="system" className="mt-4 space-y-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchHealth();
                toast.success("Status diperbarui");
              }}
              disabled={healthLoading}
            >
              <RefreshCw
                className={`size-4 ${healthLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* API Server Status Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  API Server
                </CardTitle>
                <div
                  className={`flex size-9 items-center justify-center rounded-lg ${
                    healthLoading
                      ? "bg-gray-100 dark:bg-gray-800"
                      : isHealthy
                        ? "bg-emerald-100 dark:bg-emerald-900/30"
                        : "bg-red-100 dark:bg-red-900/30"
                  }`}
                >
                  <Server
                    className={`size-5 ${
                      healthLoading
                        ? "text-gray-400"
                        : isHealthy
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                    }`}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {healthLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                ) : healthError ? (
                  <>
                    <div className="flex items-center gap-2">
                      <XCircle className="size-5 text-red-500" />
                      <span className="text-lg font-bold text-red-600 dark:text-red-400">
                        Error
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {healthError}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <CheckCircle2
                        className={`size-5 ${
                          isHealthy
                            ? "text-emerald-500"
                            : "text-amber-500"
                        }`}
                      />
                      <span
                        className={`text-lg font-bold ${
                          isHealthy
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {isHealthy ? "Online" : "Degraded"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Status: {health?.status}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Uptime Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Uptime
                </CardTitle>
                <div className="flex size-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Clock className="size-5 text-amber-600 dark:text-amber-400" />
                </div>
              </CardHeader>
              <CardContent>
                {healthLoading ? (
                  <Skeleton className="h-6 w-32" />
                ) : health?.uptime != null ? (
                  <>
                    <div className="text-lg font-bold">
                      {formatUptime(health.uptime)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {health.uptime.toLocaleString("id-ID")} detik
                    </p>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Informasi uptime tidak tersedia
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* About Tab */}
        <TabsContent value="about" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="size-5 text-emerald-600" />
                Tentang Aplikasi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">
                      Nama Aplikasi
                    </div>
                    <div className="font-medium">Beringharjo Admin</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">Versi</div>
                    <div className="font-medium">1.0.0</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">
                      Frontend
                    </div>
                    <div className="font-medium">Next.js 16 + React 19</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">
                      Backend API
                    </div>
                    <div className="font-medium">Rust (Axum)</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">
                      UI Framework
                    </div>
                    <div className="font-medium">shadcn/ui + Tailwind CSS</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">
                      Database
                    </div>
                    <div className="font-medium">MySQL / PostgreSQL</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Panel admin untuk mengelola data BMT, petugas, setoran, dan
                  perangkat dalam sistem Beringharjo.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
