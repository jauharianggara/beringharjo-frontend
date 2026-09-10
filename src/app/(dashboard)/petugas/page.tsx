"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Eye, Pencil, Trash2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiGet, apiDelete } from "@/lib/api";
import { useSortable } from "@/lib/hooks/use-sortable";
import { SortableTableHead } from "@/components/sortable-table-head";

/* ---------- Types ---------- */
interface PetugasItem {
  id: number;
  username?: string;
  nama?: string;
  imei?: string;
  batch?: string;
  kode_ao?: string;
  target?: number;
  bmtId: string;
  tanggalDaftar?: string;
  tanggalUbah?: string;
  status?: number;
  nomorhp?: string;
  id_jabatan?: number;
}

interface PetugasListResponse {
  items: PetugasItem[];
  total: number;
  page: number;
  per_page: number;
}

interface BmtOption {
  id: string;
  nama?: string;
  alamat?: string;
  telp?: string;
  status?: number;
  cabang?: number;
}

interface BmtListResponse {
  items: BmtOption[];
  total: number;
  page: number;
  per_page: number;
}

/* ---------- Inner Content (uses useSearchParams) ---------- */
function PetugasListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") || "";
  const bmtFilter = searchParams.get("bmt_id") || "";
  const page = Number(searchParams.get("page") || "1");

  const [data, setData] = useState<PetugasItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(search);
  const [bmtOptions, setBmtOptions] = useState<BmtOption[]>([]);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<PetugasItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { sortedData, sortState, toggleSort } = useSortable<PetugasItem>(data);

  /* Fetch BMT options for filter */
  useEffect(() => {
    async function fetchBmt() {
      try {
        const res = await apiGet<BmtListResponse>("/api/admin/bmt?per_page=100");
        setBmtOptions(res.items ?? []);
      } catch {
        // silently fail for filter
      }
    }
    fetchBmt();
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

      const res = await apiGet<PetugasListResponse>(
        `/api/admin/petugas?${params.toString()}`
      );
      setData(res.items ?? []);
      setTotalCount(res.total ?? 0);
      setCurrentPage(res.page ?? page);
      setPerPage(res.per_page ?? 20);
    } catch {
      toast.error("Gagal memuat data Petugas");
    } finally {
      setLoading(false);
    }
  }, [page, search, bmtFilter]);

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
      router.push(`/petugas?${params.toString()}`);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  /* Delete handler */
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiDelete(`/api/admin/petugas/${deleteTarget.id}/delete`);
      toast.success("Petugas berhasil dihapus");
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus Petugas");
    } finally {
      setDeleting(false);
    }
  }

  /* Pagination */
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / perPage) : 1;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Petugas</h1>
        <Button render={<Link href="/petugas/create" />}>
          <Plus className="size-4" />
          Tambah Petugas
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari petugas..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select
          value={bmtFilter || undefined}
          onValueChange={(v) => {
            const params = new URLSearchParams(searchParams.toString());
            if (v) {
              params.set("bmt_id", v);
            } else {
              params.delete("bmt_id");
            }
            params.delete("page");
            router.push(`/petugas?${params.toString()}`);
          }}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Semua BMT" />
          </SelectTrigger>
          <SelectContent>
            {bmtOptions.map((bmt) => (
              <SelectItem key={bmt.id} value={String(bmt.id)}>
                {bmt.id} - {bmt.nama ?? bmt.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Actions</TableHead>
              <SortableTableHead label="Nama" sortKey="nama" currentSortKey={sortState.key} direction={sortState.direction} onSort={toggleSort} />
              <SortableTableHead label="Username" sortKey="username" currentSortKey={sortState.key} direction={sortState.direction} onSort={toggleSort} />
              <SortableTableHead label="BMT" sortKey="bmtId" currentSortKey={sortState.key} direction={sortState.direction} onSort={toggleSort} />
              <SortableTableHead label="No. HP" sortKey="nomorhp" currentSortKey={sortState.key} direction={sortState.direction} onSort={toggleSort} />
              <SortableTableHead label="Status" sortKey="status" currentSortKey={sortState.key} direction={sortState.direction} onSort={toggleSort} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Tidak ada data Petugas
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/petugas/${item.id}`)}
                >
                  <TableCell className="w-[100px]">
                    <div className="flex items-center justify-start gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/petugas/${item.id}`);
                        }}
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/petugas/${item.id}/edit`);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(item);
                        }}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{item.nama ?? "-"}</TableCell>
                  <TableCell>{item.username ?? "-"}</TableCell>
                  <TableCell>{item.bmtId ?? "-"}</TableCell>
                  <TableCell>{item.nomorhp ?? "-"}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        item.status == null
                          ? "bg-gray-100 text-gray-500 dark:bg-gray-800/30 dark:text-gray-400"
                          : item.status === 1
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {item.status == null ? "—" : item.status === 1 ? "Aktif" : "Nonaktif"}
                    </span>
                  </TableCell>
                </TableRow>
              ))
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
                router.push(`/petugas?${params.toString()}`);
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
                router.push(`/petugas?${params.toString()}`);
              }}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Petugas</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus petugas{" "}
              <strong>{deleteTarget?.nama}</strong>? Tindakan ini tidak
              dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------- Page (Suspense wrapper) ---------- */
export default function PetugasListPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-8 w-40" />
          </div>
          <Skeleton className="h-9 w-full max-w-sm" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <PetugasListContent />
    </Suspense>
  );
}
