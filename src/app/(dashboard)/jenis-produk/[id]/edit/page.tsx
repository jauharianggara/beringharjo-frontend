"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiGet, apiPut } from "@/lib/api";

/* ---------- Types ---------- */
interface JenisProdukItem {
  id: number;
  id_bmt: number;
  id_produk: string;
  nama_produk: string;
}

interface JenisProdukDetailResponse {
  item: JenisProdukItem;
}

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

/* ---------- Schema — matches Rust UpdateJenisProdukInput ---------- */
const schema = z.object({
  id_bmt: z.coerce.number().min(1, "BMT wajib dipilih"),
  id_produk: z.string().min(1, "ID Produk wajib diisi"),
  nama_produk: z.string().min(1, "Nama Produk wajib diisi"),
});

type Form = z.infer<typeof schema>;

/* ---------- Page ---------- */
export default function JenisProdukEditPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [form, setForm] = useState<Form | null>(null);
  const [bmtOptions, setBmtOptions] = useState<BmtOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  /* Fetch existing data & BMT options */
  useEffect(() => {
    async function fetchDetail() {
      try {
        const [res, bmtRes] = await Promise.all([
          apiGet<JenisProdukDetailResponse>(`/api/admin/jenis-produk/${id}`),
          apiGet<BmtListResponse>("/api/admin/bmt?per_page=100"),
        ]);
        const item = res.item;
        setForm({
          id_bmt: item.id_bmt,
          id_produk: item.id_produk,
          nama_produk: item.nama_produk,
        });
        setBmtOptions(bmtRes.items ?? []);
      } catch {
        toast.error("Gagal memuat data Jenis Produk");
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [id]);

  function handleChange(field: keyof Form, value: string | number) {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;

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
      await apiPut(`/api/admin/jenis-produk/${id}`, result.data);
      toast.success("Jenis Produk berhasil diperbarui");
      router.push(`/jenis-produk`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal memperbarui Jenis Produk"
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* Loading skeleton */
  if (loading || !form) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" render={<Link href="/jenis-produk" />}>
            <ArrowLeft className="size-4" />
          </Button>
          <Skeleton className="h-7 w-48" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" render={<Link href="/jenis-produk" />}>
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Edit Jenis Produk</h1>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Form Jenis Produk</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            {/* ID — readonly */}
            <div className="space-y-2">
              <Label>ID</Label>
              <Input value={id} disabled />
            </div>

            {/* BMT */}
            <div className="space-y-2">
              <Label htmlFor="id_bmt">BMT</Label>
              <select
                id="id_bmt"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={form.id_bmt || ""}
                onChange={(e) => handleChange("id_bmt", Number(e.target.value))}
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
            <div className="space-y-2">
              <Label htmlFor="id_produk">ID Produk</Label>
              <Input
                id="id_produk"
                value={form.id_produk}
                onChange={(e) => handleChange("id_produk", e.target.value)}
                placeholder="Masukkan ID produk"
              />
              {errors.id_produk && (
                <p className="text-xs text-destructive">{errors.id_produk}</p>
              )}
            </div>

            {/* Nama Produk */}
            <div className="space-y-2">
              <Label htmlFor="nama_produk">Nama Produk</Label>
              <Input
                id="nama_produk"
                value={form.nama_produk}
                onChange={(e) => handleChange("nama_produk", e.target.value)}
                placeholder="Masukkan nama produk"
              />
              {errors.nama_produk && (
                <p className="text-xs text-destructive">{errors.nama_produk}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 sm:col-span-2">
              <Button variant="outline" type="button" render={<Link href="/jenis-produk" />}>
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
