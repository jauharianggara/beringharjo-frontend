"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Users,
  Wallet,
  Smartphone,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiGet } from "@/lib/api";

/* ---------- Types ---------- */
interface DashboardStats {
  totalBmt: number;
  petugasAktif: number;
  setoranHariIni: number;
  pendingDevice: number;
}

interface ChartDataPoint {
  hari: string;
  jumlah: number;
}

interface RecentSetoran {
  id: number;
  petugas: string;
  bmt: string;
  nominal: number;
  tanggal: string;
  status: string;
}

/* ---------- Stat Card ---------- */
function StatCard({
  title,
  value,
  icon: Icon,
  accent,
  loading,
  note,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  accent: string;
  loading: boolean;
  note: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div
          className="flex size-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: accent }}
        >
          <Icon className="size-5 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <div className="text-2xl font-bold">
              {typeof value === "number" ? value.toLocaleString("id-ID") : value}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{note}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------- Dashboard Page ---------- */
export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [recentSetoran, setRecentSetoran] = useState<RecentSetoran[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [statsData, chartRes, recentRes] = await Promise.all([
          apiGet<DashboardStats>("/api/admin/dashboard/stats").catch(() => null),
          apiGet<{ items: ChartDataPoint[] }>("/api/admin/dashboard/chart").catch(() => ({ items: [] })),
          apiGet<{ items: RecentSetoran[] }>("/api/admin/dashboard/recent-setoran").catch(() => ({ items: [] })),
        ]);
        if (statsData) setStats(statsData);
        setChartData(chartRes.items ?? []);
        setRecentSetoran(recentRes.items ?? []);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Ringkasan data dan aktivitas Tumang.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total BMT"
          value={stats?.totalBmt ?? 0}
          icon={Building2}
          accent="#2E7D32"
          loading={loading}
          note="Total cabang BMT terdaftar"
        />
        <StatCard
          title="Petugas Aktif"
          value={stats?.petugasAktif ?? 0}
          icon={Users}
          accent="#388E3C"
          loading={loading}
          note="Petugas aktif bulan ini"
        />
        <StatCard
          title="Setoran Hari Ini"
          value={stats?.setoranHariIni ?? 0}
          icon={Wallet}
          accent="#C8A415"
          loading={loading}
          note="Jumlah setoran hari ini"
        />
        <StatCard
          title="Pending Device"
          value={stats?.pendingDevice ?? 0}
          icon={Smartphone}
          accent="#DC2626"
          loading={loading}
          note="Perangkat menunggu approval"
        />
      </div>

      {/* Chart + Recent Table */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Bar chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-5 text-emerald-700" />
              Setoran 7 Hari Terakhir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="hari"
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: any) => [
                      `${Number(value).toLocaleString("id-ID")}`,
                      "Jumlah Setoran",
                    ]}
                  />
                  <Bar
                    dataKey="jumlah"
                    fill="#2E7D32"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent setoran */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Setoran Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Petugas</TableHead>
                  <TableHead>Nominal</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSetoran.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                      Belum ada data setoran
                    </TableCell>
                  </TableRow>
                ) : (
                  recentSetoran.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium">{item.petugas}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.bmt}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      Rp {item.nominal.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          item.status === "Selesai"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        }`}
                      >
                        {item.status}
                      </span>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
