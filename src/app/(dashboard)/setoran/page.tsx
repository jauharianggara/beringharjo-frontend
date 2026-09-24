"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Eye } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import { apiGet } from "@/lib/api";
import { useSortable } from "@/lib/hooks/use-sortable";
import { SortableTableHead } from "@/components/sortable-table-head";

/* ---------- Types ---------- */
interface SetoranItem {
  id: string;
  tanggal?: string;
  nama_nasabah?: string;
  nomor_rekening?: string;
  nominal?: number;
  bmt_id: string;
  user_id: number;
  batch?: string;
  cabang?: number;
  imei?: string;
  version?: string;
  date_add?: string;
  status_add?: number;
  status_upload?: number;
  date_edit?: string;
  status_edit?: number;
  longitude?: string;
  latitude?: string;
}

interface SetoranListResponse {
  items: SetoranItem[];
  total: number;
  page: number;
  per_page: number;
}

interface BmtOption {
  id: string;
  nama?: string;
}

interface BmtListResponse {
  items: BmtOption[];
  total: number;
  page: number;
  per_page: number;
}

interface PetugasOption {
  id: number;
  nama?: string;
}

interface PetugasListResponse {
  items: PetugasOption[];
  total: number;
  page: number;
  per_page: number;
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

function statusBadge(status: number | undefined) {
  const label = status === 1 ? "Verified" : status === 0 ? "Pending" : String(status ?? "-");
  const cls =
    status === 1
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      : status === 0
        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
        : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {label}
    </span>
  );
}

/* ---------- Inner Content ---------- */
function SetoranListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") || "";
  const bmtFilter = searchParams.get("bmt_id") || "";
  const petugasFilter = searchParams.get("petugas_id") || "";
  const fromDate = searchParams.get("from_date") || "";
  const toDate = searchParams.get("to_date") || "";
  const page = Number(searchParams.get("page") || "1");

  const [data, setData] = useState<SetoranItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(search);
  const [bmtOptions, setBmtOptions] = useState<BmtOption[]>([]);
  const [petugasOptions, setPetugasOptions] = useState<PetugasOption[]>([]);

  const { sortedData, sortState, toggleSort } = useSortable<SetoranItem>(data);

  /* Fetch filter options */
  useEffect(() => {
    async function fetchOptions() {
      try {
        const [bmtRes, ptRes] = await Promise.all([
          apiGet<BmtListResponse>("/api/admin/bmt?per_page=100"),
          apiGet<PetugasListResponse>("/api/admin/petugas?per_page=500"),
        ]);
        setBmtOptions(bmtRes.items ?? []);
        setPetugasOptions(
          [...(ptRes.items ?? [])].sort((a, b) =>
            (a.nama ?? "").localeCompare(b.nama ?? "", "id")
          )
        );
      } catch {
        // silently fail for filter options
      }
    }
    fetchOptions();
  }, []);

  /* Fetch data */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: "20",
      });
      if (search) params.set("search", search);
      if (bmtFilter) params.set("bmt_id", bmtFilter);
      if (petugasFilter) params.set("petugas_id", petugasFilter);
      if (fromDate) params.set("from_date", fromDate);
      if (toDate) params.set("to_date", toDate);

      const res = await apiGet<SetoranListResponse>(
        `/api/admin/setoran-mobile?${params.toString()}`
      );
      setData(res.items ?? []);
      setTotalCount(res.total ?? 0);
      setCurrentPage(res.page ?? page);
      setPerPage(res.per_page ?? 20);
    } catch {
      toast.error("Gagal memuat data Setoran");
    } finally {
      setLoading(false);
    }
  }, [page, search, bmtFilter, petugasFilter, fromDate, toDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* Debounced search */
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchInput) {
        params.set("search", searchInput);
      } else {
        params.delete("search");
      }
      params.delete("page");
      router.push(`/setoran?${params.toString()}`);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  /* Update URL helper */
  function updateFilter(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`/setoran?${params.toString()}`);
  }

  /* Summary */
  const totalNominal = sortedData.reduce((sum, item) => sum + Number(item.nominal || 0), 0);

  /* Pagination */
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / perPage) : 1;

  return (
    <div className="space-y-4">
      {/* Header */}
      <h1 className="text-2xl font-bold tracking-tight">Setoran</h1>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari setoran..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-8"
          />
        </div>

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
                {bmt.id} - {bmt.nama ?? "-"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={petugasFilter || undefined}
          onValueChange={(v) => updateFilter("petugas_id", v ?? null)}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Semua Petugas" />
          </SelectTrigger>
          <SelectContent>
            {petugasOptions.map((pt) => (
              <SelectItem key={pt.id} value={String(pt.id)}>
                {pt.nama}
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

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Actions</TableHead>
              <SortableTableHead label="ID" sortKey="id" currentSortKey={sortState.key} direction={sortState.direction} onSort={toggleSort} />
              <SortableTableHead label="Anggota" sortKey="nama_nasabah" currentSortKey={sortState.key} direction={sortState.direction} onSort={toggleSort} />
              <SortableTableHead label="BMT" sortKey="bmt_id" currentSortKey={sortState.key} direction={sortState.direction} onSort={toggleSort} />
              <SortableTableHead label="Nominal" sortKey="nominal" currentSortKey={sortState.key} direction={sortState.direction} onSort={toggleSort} className="text-right" />
              <SortableTableHead label="Tanggal" sortKey="tanggal" currentSortKey={sortState.key} direction={sortState.direction} onSort={toggleSort} />
              <SortableTableHead label="Status" sortKey="status_add" currentSortKey={sortState.key} direction={sortState.direction} onSort={toggleSort} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : sortedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-8"
                >
                  Tidak ada data Setoran
                </TableCell>
              </TableRow>
            ) : (
              <>
                {sortedData.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/setoran/${item.id}`)}
                  >
                    <TableCell className="w-[100px]">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/setoran/${item.id}`);
                        }}
                      >
                        <Eye className="size-4" />
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{item.id}</TableCell>
                    <TableCell>{item.nama_nasabah ?? "-"}</TableCell>
                    <TableCell>{item.bmt_id ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      {formatRupiah(Number(item.nominal ?? 0))}
                    </TableCell>
                    <TableCell>
                      {item.tanggal
                        ? new Date(item.tanggal).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </TableCell>
                    <TableCell>{statusBadge(item.status_add)}</TableCell>
                  </TableRow>
                ))}
                {/* Summary Row */}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell colSpan={4} className="text-right">
                    Total Nominal
                  </TableCell>
                  <TableCell className="text-right">
                    {formatRupiah(totalNominal)}
                  </TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!loading && totalCount > 0 && totalPages > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Halaman {currentPage} dari {totalPages} ({totalCount} data)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("page", String(page - 1));
                router.push(`/setoran?${params.toString()}`);
              }}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("page", String(page + 1));
                router.push(`/setoran?${params.toString()}`);
              }}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Page (Suspense wrapper) ---------- */
export default function SetoranListPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-7 w-24" />
          <div className="flex gap-3">
            <Skeleton className="h-9 w-full max-w-sm" />
            <Skeleton className="h-9 w-[220px]" />
            <Skeleton className="h-9 w-[220px]" />
            <Skeleton className="h-9 w-[180px]" />
            <Skeleton className="h-9 w-[180px]" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <SetoranListContent />
    </Suspense>
  );
}
