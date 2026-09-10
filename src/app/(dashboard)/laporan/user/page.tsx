"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiGet } from "@/lib/api";
import { useSortable } from "@/lib/hooks/use-sortable";
import { SortableTableHead } from "@/components/sortable-table-head";

/* ---------- Types ---------- */
interface UserReportItem {
  petugas_id: number;
  petugas_nama: string;
  jumlah_setoran: number;
  total_nominal: number;
}

interface UserReportResponse {
  items: UserReportItem[];
}

interface BmtOption {
  id: number;
  kode_bmt: string;
  nama_cabang: string;
}

interface BmtListResponse {
  items: BmtOption[];
}

/* ---------- Helpers ---------- */
function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/* ---------- Inner Content ---------- */
function LaporanUserContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const bmtFilter = searchParams.get("bmt_id") || "";
  const fromDate = searchParams.get("from_date") || "";
  const toDate = searchParams.get("to_date") || "";

  const [data, setData] = useState<UserReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [bmtOptions, setBmtOptions] = useState<BmtOption[]>([]);

  const { sortedData, sortState, toggleSort } = useSortable<UserReportItem>(data);

  /* Fetch BMT options */
  useEffect(() => {
    async function fetchBmt() {
      try {
        const res = await apiGet<BmtListResponse>("/api/admin/bmt?per_page=100");
        setBmtOptions(res.items ?? []);
      } catch {
        // silently fail
      }
    }
    fetchBmt();
  }, []);

  /* Fetch data */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (bmtFilter) params.set("bmt_id", bmtFilter);
      if (fromDate) params.set("from_date", fromDate);
      if (toDate) params.set("to_date", toDate);

      const qs = params.toString();
      const res = await apiGet<UserReportResponse>(
        `/api/admin/setoran-mobile/kriteria/user${qs ? `?${qs}` : ""}`
      );
      setData(res.items ?? []);
    } catch {
      toast.error("Gagal memuat laporan user");
    } finally {
      setLoading(false);
    }
  }, [bmtFilter, fromDate, toDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* Update URL helper */
  function updateFilter(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/laporan/user?${params.toString()}`);
  }

  /* Summary */
  const totalSetoran = sortedData.reduce((sum, item) => sum + Number(item.jumlah_setoran || 0), 0);
  const totalNominal = sortedData.reduce((sum, item) => sum + Number(item.total_nominal || 0), 0);
  const jumlahPetugas = sortedData.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <h1 className="text-2xl font-bold tracking-tight">Laporan User</h1>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <Select
          value={bmtFilter || undefined}
          onValueChange={(v) => updateFilter("bmt_id", v ?? null)}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Semua BMT" />
          </SelectTrigger>
          <SelectContent>
            {bmtOptions.map((bmt) => (
              <SelectItem key={bmt.id} value={String(bmt.id)}>
                {bmt.kode_bmt} - {bmt.nama_cabang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={fromDate}
          onChange={(e) => updateFilter("from_date", e.target.value || null)}
          className="w-[180px]"
          placeholder="Dari tanggal"
        />
        <Input
          type="date"
          value={toDate}
          onChange={(e) => updateFilter("to_date", e.target.value || null)}
          className="w-[180px]"
          placeholder="Sampai tanggal"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Setoran
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-24" /> : totalSetoran.toLocaleString("id-ID")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Nominal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-40" /> : formatRupiah(totalNominal)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Jumlah Petugas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-16" /> : jumlahPetugas.toLocaleString("id-ID")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead label="Nama Petugas" sortKey="petugas_nama" currentSortKey={sortState.key} direction={sortState.direction} onSort={toggleSort} />
              <SortableTableHead label="Jumlah Setoran" sortKey="jumlah_setoran" currentSortKey={sortState.key} direction={sortState.direction} onSort={toggleSort} className="text-right" />
              <SortableTableHead label="Total Nominal" sortKey="total_nominal" currentSortKey={sortState.key} direction={sortState.direction} onSort={toggleSort} className="text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 3 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : sortedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center text-muted-foreground py-8"
                >
                  Tidak ada data
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((item) => (
                <TableRow key={item.petugas_id}>
                  <TableCell className="font-medium">
                    {item.petugas_nama}
                  </TableCell>
                  <TableCell className="text-right">
                    {Number(item.jumlah_setoran).toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatRupiah(Number(item.total_nominal))}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/* ---------- Page (Suspense wrapper) ---------- */
export default function LaporanUserPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-7 w-40" />
          <div className="flex gap-3">
            <Skeleton className="h-9 w-[220px]" />
            <Skeleton className="h-9 w-[180px]" />
            <Skeleton className="h-9 w-[180px]" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <LaporanUserContent />
    </Suspense>
  );
}
