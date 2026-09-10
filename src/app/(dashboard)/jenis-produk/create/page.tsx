"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiPost } from "@/lib/api";

/* ---------- Schema — matches Rust CreateJenisProdukInput ---------- */
const jenisProdukSchema = z.object({
  id_bmt: z.coerce.number().min(1, "ID BMT wajib diisi"),
  id_produk: z.string().min(1, "ID Produk wajib diisi"),
  nama_produk: z.string().min(1, "Nama Produk wajib diisi"),
});

type JenisProdukForm = z.infer<typeof jenisProdukSchema>;

/* ---------- Page ---------- */
export default function JenisProdukCreatePage() {
  const router = useRouter();

  const [form, setForm] = useState<JenisProdukForm>({
    id_bmt: 0,
    id_produk: "",
    nama_produk: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function handleChange(field: keyof JenisProdukForm, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: field === "id_bmt" ? Number(value) : value,
    }));
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

    const result = jenisProdukSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      await apiPost("/api/admin/jenis-produk", result.data);
      toast.success("Jenis Produk berhasil ditambahkan");
      router.push("/jenis-produk");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal menambahkan Jenis Produk"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          render={<Link href="/jenis-produk" />}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          Tambah Jenis Produk
        </h1>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Form Jenis Produk</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            {/* ID BMT */}
            <div className="space-y-2">
              <Label htmlFor="id_bmt">ID BMT</Label>
              <Input
                id="id_bmt"
                type="number"
                value={form.id_bmt || ""}
                onChange={(e) => handleChange("id_bmt", e.target.value)}
                placeholder="Masukkan ID BMT"
              />
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
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="nama_produk">Nama Produk</Label>
              <Input
                id="nama_produk"
                value={form.nama_produk}
                onChange={(e) => handleChange("nama_produk", e.target.value)}
                placeholder="Masukkan nama produk"
              />
              {errors.nama_produk && (
                <p className="text-xs text-destructive">
                  {errors.nama_produk}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 sm:col-span-2">
              <Button
                variant="outline"
                type="button"
                render={<Link href="/jenis-produk" />}
              >
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
