"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiPost, apiGet } from "@/lib/api";

/* ---------- Schema — matches Rust CreatePetugasInput ---------- */
const petugasSchema = z.object({
  // username TIDAK diinput — otomatis = BMT ID + batch (mis. 0001+102 → 0001102)
  password: z.string().min(6, "Password minimal 6 karakter"),
  nama: z.string().min(1, "Nama wajib diisi"),
  imei: z.string().optional().default(""),
  batch: z.string().min(1, "Batch wajib diisi — username otomatis BMT ID + batch"),
  bmt_id: z.string().min(1, "BMT wajib dipilih"),
  kode_ao: z.string().optional().default(""),
  nomorhp: z.string().optional().default(""),
  id_jabatan: z.coerce.number().optional().default(1),
  target: z.coerce.number().optional().default(0),
  status: z.coerce.number().optional().default(1),
});

type PetugasForm = z.infer<typeof petugasSchema>;

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

/* ---------- AO Option (dari MSSQL core banking) ---------- */
interface AoOption {
  kode: string;
  nama: string;
}

interface AoListResponse {
  items: AoOption[];
  total: number;
}

/* ---------- Page ---------- */
export default function PetugasCreatePage() {
  const router = useRouter();

  const [form, setForm] = useState<PetugasForm>({
    password: "",
    nama: "",
    imei: "",
    batch: "",
    bmt_id: "",
    kode_ao: "",
    nomorhp: "",
    id_jabatan: 1,
    target: 0,
    status: 1,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [bmtOptions, setBmtOptions] = useState<BmtOption[]>([]);
  const [bmtLoading, setBmtLoading] = useState(true);
  const [aoOptions, setAoOptions] = useState<AoOption[]>([]);
  const [aoLoading, setAoLoading] = useState(false);

  /* Fetch BMT options */
  useEffect(() => {
    async function fetchBmt() {
      try {
        const res = await apiGet<BmtListResponse>("/api/admin/bmt?per_page=100");
        setBmtOptions(res.items ?? []);
      } catch {
        toast.error("Gagal memuat daftar BMT");
      } finally {
        setBmtLoading(false);
      }
    }
    fetchBmt();
  }, []);

  /* Fetch AO options ketika BMT dipilih (data dari MSSQL core banking) */
  useEffect(() => {
    if (!form.bmt_id) {
      setAoOptions([]);
      return;
    }
    async function fetchAo() {
      setAoLoading(true);
      try {
        const res = await apiGet<AoListResponse>(`/api/admin/bmt/${form.bmt_id}/ao`);
        setAoOptions(res.items ?? []);
      } catch {
        toast.error("Gagal memuat daftar Kode AO dari core banking");
        setAoOptions([]);
      } finally {
        setAoLoading(false);
      }
    }
    fetchAo();
  }, [form.bmt_id]);

  function handleChange(field: keyof PetugasForm, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
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

    const result = petugasSchema.safeParse(form);
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
      await apiPost("/api/admin/petugas", result.data);
      toast.success("Petugas berhasil ditambahkan");
      router.push("/petugas");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menambahkan Petugas");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" render={<Link href="/petugas" />}>
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Tambah Petugas</h1>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Form Petugas</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            {/* Username (otomatis: BMT ID + Batch) */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                readOnly
                value={
                  form.bmt_id && form.batch
                    ? `${form.bmt_id}${form.batch}`
                    : ""
                }
                placeholder="Otomatis dari BMT ID + Batch"
                className="bg-muted font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Otomatis: BMT ID + Batch (mis. 0001 + 102 → 0001102)
              </p>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="Minimal 6 karakter"
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>

            {/* Nama */}
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Lengkap</Label>
              <Input
                id="nama"
                value={form.nama}
                onChange={(e) => handleChange("nama", e.target.value)}
                placeholder="Masukkan nama petugas"
              />
              {errors.nama && (
                <p className="text-xs text-destructive">{errors.nama}</p>
              )}
            </div>

            {/* BMT */}
            <div className="space-y-2">
              <Label>BMT</Label>
              {bmtLoading ? (
                <Skeleton className="h-9 w-full" />
              ) : (
                <Select
                  value={form.bmt_id || undefined}
                  onValueChange={(v) => {
                    if (v) handleChange("bmt_id", v);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih BMT" />
                  </SelectTrigger>
                  <SelectContent>
                    {bmtOptions.map((bmt) => (
                      <SelectItem key={bmt.id} value={bmt.id}>
                        {bmt.id} - {bmt.nama ?? "-"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.bmt_id && (
                <p className="text-xs text-destructive">{errors.bmt_id}</p>
              )}
            </div>

            {/* Kode AO (dari MSSQL core banking, terikat ke BMT) */}
            <div className="space-y-2">
              <Label>Kode AO</Label>
              {!form.bmt_id ? (
                <Select disabled>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih BMT dulu" />
                  </SelectTrigger>
                </Select>
              ) : aoLoading ? (
                <Skeleton className="h-9 w-full" />
              ) : aoOptions.length === 0 ? (
                <Select disabled>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Tidak ada data AO" />
                  </SelectTrigger>
                </Select>
              ) : (
                <Select
                  value={form.kode_ao || undefined}
                  onValueChange={(v) => {
                    if (v) handleChange("kode_ao", v);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Kode AO" />
                  </SelectTrigger>
                  <SelectContent>
                    {aoOptions.map((ao) => (
                      <SelectItem key={ao.kode} value={ao.kode}>
                        {ao.kode} - {ao.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-xs text-muted-foreground">
                Diambil dari core banking MSSQL (tabel USERPROFILE)
              </p>
            </div>

            {/* Nomor HP */}
            <div className="space-y-2">
              <Label htmlFor="nomorhp">Nomor HP</Label>
              <Input
                id="nomorhp"
                value={form.nomorhp}
                onChange={(e) => handleChange("nomorhp", e.target.value)}
                placeholder="Masukkan nomor HP"
              />
            </div>

            {/* IMEI */}
            <div className="space-y-2">
              <Label htmlFor="imei">IMEI</Label>
              <Input
                id="imei"
                value={form.imei}
                onChange={(e) => handleChange("imei", e.target.value)}
                placeholder="IMEI perangkat (opsional)"
              />
            </div>

            {/* Batch */}
            <div className="space-y-2">
              <Label htmlFor="batch">Batch</Label>
              <Input
                id="batch"
                value={form.batch}
                onChange={(e) => handleChange("batch", e.target.value)}
                placeholder="Nomor batch, mis. 102"
              />
              {errors.batch && (
                <p className="text-xs text-destructive">{errors.batch}</p>
              )}
            </div>

            {/* Target */}
            <div className="space-y-2">
              <Label htmlFor="target">Target</Label>
              <Input
                id="target"
                type="number"
                value={form.target}
                onChange={(e) => handleChange("target", e.target.value)}
                placeholder="0"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={String(form.status ?? 1)}
                onValueChange={(v) => {
                  handleChange("status", Number(v));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{form.status === 0 ? "Nonaktif" : "Aktif"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Aktif</SelectItem>
                  <SelectItem value="0">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 sm:col-span-2">
              <Button variant="outline" type="button" render={<Link href="/petugas" />}>
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
