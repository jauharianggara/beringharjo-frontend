"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { useSortable } from "@/lib/hooks/use-sortable";
import { SortableTableHead } from "@/components/sortable-table-head";

/* ---------- Types ---------- */
interface JenisProdukItem {
  id: number;
  id_bmt: number;
  id_produk: string;
  nama_produk: string;
  date_add: string | null;
  user_add: number | null;
  date_edit: string | null;
  user_edit: number | null;
}

interface JenisProdukListResponse {
  items: JenisProdukItem[];
  total: number;
  page: number;
  per_page: number;
}

/* ---------- Zod schema ---------- */
const createSchema = z.object({
  id_bmt: z.coerce.number().min(1, "BMT wajib dipilih"),
  id_produk: z.string().min(1, "ID Produk wajib diisi"),
  nama_produk: z.string().min(1, "Nama Produk wajib diisi"),
});

const editSchema = z.object({
  id_bmt: z.coerce.number().min(1, "BMT wajib dipilih"),
  id_produk: z.string().min(1, "ID Produk wajib diisi"),
  nama_produk: z.string().min(1, "Nama Produk wajib diisi"),
});

type CreateForm = z.infer<typeof createSchema>;
type EditForm = z.infer<typeof editSchema>;

/* ---------- BMT Option ---------- */
interface BmtOption {
  id: string;
  nama: string | null;
}

interface BmtListResponse {
  items: BmtOption[];
  total: number;
  page: number;
  per_page: number;
}

/* ---------- Inner Content ---------- */
function JenisProdukContent() {
  const [data, setData] = useState<JenisProdukItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [loading, setLoading] = useState(true);

  // BMT dropdown
  const [bmtOptions, setBmtOptions] = useState<BmtOption[]>([]);

  // Form dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<JenisProdukItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateForm | EditForm>({
    id_bmt: 0,
    id_produk: "",
    nama_produk: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<JenisProdukItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { sortedData, sortState, toggleSort } = useSortable<JenisProdukItem>(data);

  /* Fetch BMT options */
  useEffect(() => {
    async function fetchBmt() {
      try {
        const res = await apiGet<BmtListResponse>("/api/admin/bmt?per_page=100");
        setBmtOptions(res.items ?? []);
      } catch {
        // silent
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
        per_page: String(perPage),
      });
      const res = await apiGet<JenisProdukListResponse>(
        `/api/admin/jenis-produk?${params.toString()}`
      );
      setData(res.items ?? []);
      setTotal(res.total ?? 0);
    } catch {
      toast.error("Gagal memuat data Jenis Produk");
    } finally {
      setLoading(false);
    }
  }, [page, perPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* Open create dialog */
  function openCreate() {
    setEditTarget(null);
    setForm({ id_bmt: 0, id_produk: "", nama_produk: "" });
    setErrors({});
    setFormOpen(true);
  }

  /* Open edit dialog */
  function openEdit(item: JenisProdukItem) {
    setEditTarget(item);
    setForm({
      id_bmt: item.id_bmt,
      id_produk: item.id_produk,
      nama_produk: item.nama_produk,
    });
    setErrors({});
    setFormOpen(true);
  }

  /* Submit form */
  async function handleSubmit() {
    const schema = editTarget ? editSchema : createSchema;
    const result = schema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      if (editTarget) {
        await apiPut(`/api/admin/jenis-produk/${editTarget.id}/edit`, result.data);
        toast.success("Jenis Produk berhasil diperbarui");
      } else {
        await apiPost("/api/admin/jenis-produk/create", result.data);
        toast.success("Jenis Produk berhasil ditambahkan");
      }
      setFormOpen(false);
      fetchData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal menyimpan Jenis Produk"
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* Delete handler */
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiDelete(`/api/admin/jenis-produk/${deleteTarget.id}/delete`);
      toast.success("Jenis Produk berhasil dihapus");
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal menghapus Jenis Produk"
      );
    } finally {
      setDeleting(false);
    }
  }

  /* Pagination */
  const totalPages = Math.ceil(total / perPage) || 1;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Jenis Produk</h1>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Tambah
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead label="ID" sortKey="id" currentSortKey={sortState.key} direction={sortState.direction} onSort={toggleSort} className="w-[60px]" />
              <SortableTableHead label="BMT ID" sortKey="id_bmt" currentSortKey={sortState.key} direction={sortState.direction} onSort={toggleSort} />
              <SortableTableHead label="ID Produk" sortKey="id_produk" currentSortKey={sortState.key} direction={sortState.direction} onSort={toggleSort} />
              <SortableTableHead label="Nama Produk" sortKey="nama_produk" currentSortKey={sortState.key} direction={sortState.direction} onSort={toggleSort} />
              <SortableTableHead label="Tanggal Dibuat" sortKey="date_add" currentSortKey={sortState.key} direction={sortState.direction} onSort={toggleSort} />
              <TableHead className="text-right">Aksi</TableHead>
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
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-8"
                >
                  Tidak ada data Jenis Produk
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.id}</TableCell>
                  <TableCell>{item.id_bmt}</TableCell>
                  <TableCell className="font-mono text-xs">{item.id_produk}</TableCell>
                  <TableCell>{item.nama_produk}</TableCell>
                  <TableCell>
                    {item.date_add
                      ? new Date(item.date_add).toLocaleDateString("id-ID")
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteTarget(item)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!loading && total > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Halaman {page} dari {totalPages} ({total} data)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Edit Jenis Produk" : "Tambah Jenis Produk"}
            </DialogTitle>
            <DialogDescription>
              {editTarget
                ? "Perbarui informasi jenis produk."
                : "Isi form berikut untuk menambahkan jenis produk baru."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {/* BMT */}
            <div className="grid gap-2">
              <Label>BMT</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={form.id_bmt || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, id_bmt: Number(e.target.value) }))
                }
              >
                <option value="">Pilih BMT</option>
                {bmtOptions.map((bmt) => (
                  <option key={bmt.id} value={bmt.id}>
                    {bmt.id} - {bmt.nama ?? "-"}
                  </option>
                ))}
              </select>
              {errors.id_bmt && (
                <p className="text-xs text-destructive">{errors.id_bmt}</p>
              )}
            </div>
            {/* ID Produk */}
            <div className="grid gap-2">
              <Label htmlFor="id_produk">ID Produk</Label>
              <Input
                id="id_produk"
                value={form.id_produk}
                onChange={(e) =>
                  setForm((f) => ({ ...f, id_produk: e.target.value }))
                }
                placeholder="Masukkan ID produk"
              />
              {errors.id_produk && (
                <p className="text-xs text-destructive">{errors.id_produk}</p>
              )}
            </div>
            {/* Nama Produk */}
            <div className="grid gap-2">
              <Label htmlFor="nama_produk">Nama Produk</Label>
              <Input
                id="nama_produk"
                value={form.nama_produk}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nama_produk: e.target.value }))
                }
                placeholder="Masukkan nama produk"
              />
              {errors.nama_produk && (
                <p className="text-xs text-destructive">{errors.nama_produk}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFormOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {editTarget ? "Simpan" : "Tambah"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Jenis Produk</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus jenis produk{" "}
              <strong>{deleteTarget?.nama_produk}</strong>? Tindakan ini tidak
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
export default function JenisProdukPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-8 w-24" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <JenisProdukContent />
    </Suspense>
  );
}
