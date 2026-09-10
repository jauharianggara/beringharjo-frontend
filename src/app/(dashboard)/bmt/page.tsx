"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
interface BmtItem {
  id: string;
  nama: string | null;
  alamat: string | null;
  telp: string | null;
  status: number | null;
  cabang: number | null;
}

interface BmtListResponse {
  items: BmtItem[];
  total: number;
  page: number;
  per_page: number;
}

/* ---------- Inner Content (uses useSearchParams) ---------- */
function BmtListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") || "";
  const page = Number(searchParams.get("page") || "1");

  const [data, setData] = useState<BmtItem[]>([]);
  const [meta, setMeta] = useState<BmtListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(search);

  const { sortedData, sortState, toggleSort } = useSortable<BmtItem>(data);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<BmtItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* Fetch data */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: "20",
      });
      if (search) params.set("search", search);

      const res = await apiGet<BmtListResponse>(
        `/api/admin/bmt?${params.toString()}`
      );
      setData(res.items ?? []);
      setMeta(res);

      // Hanya ada 1 BMT → langsung ke halaman detail (view/update)
      if (!search && page === 1 && (res.items?.length ?? 0) === 1) {
        router.replace(`/bmt/${res.items[0].id}`);
        return;
      }
    } catch {
      toast.error("Gagal memuat data BMT");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

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
      router.push(`/bmt?${params.toString()}`);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  /* Delete handler */
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiDelete(`/api/admin/bmt/${deleteTarget.id}/delete`);
      toast.success("BMT berhasil dihapus");
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus BMT");
    } finally {
      setDeleting(false);
    }
  }

  /* Pagination */
  const totalPages = meta ? Math.ceil(meta.total / meta.per_page) : 1;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">BMT</h1>
        <Button render={<Link href="/bmt/create" />}>
          <Plus className="size-4" />
          Tambah BMT
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari BMT..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Actions</TableHead>
              <SortableTableHead label="Kode BMT" sortKey="id" currentSortKey={sortState.key} direction={sortState.direction} onSort={toggleSort} />
              <SortableTableHead label="Nama" sortKey="nama" currentSortKey={sortState.key} direction={sortState.direction} onSort={toggleSort} />
              <SortableTableHead label="Alamat" sortKey="alamat" currentSortKey={sortState.key} direction={sortState.direction} onSort={toggleSort} />
              <SortableTableHead label="Telepon" sortKey="telp" currentSortKey={sortState.key} direction={sortState.direction} onSort={toggleSort} />
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
                  Tidak ada data BMT
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/bmt/${item.id}`)}
                >
                  <TableCell className="w-[100px]">
                    <div className="flex items-center justify-start gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/bmt/${item.id}`);
                        }}
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/bmt/${item.id}/edit`);
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
                  <TableCell className="font-mono font-medium">{item.id}</TableCell>
                  <TableCell>{item.nama ?? "-"}</TableCell>
                  <TableCell>{item.alamat ?? "-"}</TableCell>
                  <TableCell>{item.telp ?? "-"}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        item.status === 1
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {item.status === 1 ? "Aktif" : "Nonaktif"}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!loading && meta && totalPages > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Halaman {meta?.page ?? page} dari {totalPages} ({meta?.total ?? 0} data)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("page", String(page - 1));
                router.push(`/bmt?${params.toString()}`);
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
                router.push(`/bmt?${params.toString()}`);
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
            <DialogTitle>Hapus BMT</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus BMT{" "}
              <strong>{deleteTarget?.nama ?? deleteTarget?.id}</strong>? Tindakan ini tidak
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
export default function BmtListPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-8 w-32" />
          </div>
          <Skeleton className="h-9 w-full max-w-sm" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <BmtListContent />
    </Suspense>
  );
}
