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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiGet, apiPut } from "@/lib/api";

/* ---------- Schema — matches Rust UpdatePetugasInput ---------- */
const petugasSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi"),
  password: z.string().optional(),
  imei: z.string().optional(),
  batch: z.string().optional(),
  kode_ao: z.string().optional(),
  nomorhp: z.string().optional(),
  id_jabatan: z.coerce.number().optional(),
  target: z.coerce.number().optional(),
  status: z.coerce.number().optional(),
});

type PetugasForm = z.infer<typeof petugasSchema>;

/* ---------- AO Option (dari MSSQL core banking) ---------- */
interface AoOption {
  kode: string;
  nama: string;
}

interface AoListResponse {
  items: AoOption[];
  total: number;
}

/* ---------- Types — matches Rust Petugas model ---------- */
interface PetugasItem {
  id: number;
  username: string | null;
  nama: string | null;
  imei: string | null;
  batch: string | null;
  kode_ao: string | null;
  target: number | null;
  bmt_id: string;
  tanggal_daftar: string | null;
  tanggal_ubah: string | null;
  status: number | null;
  nomorhp: string | null;
  id_jabatan: number;
}

interface PetugasDetailResponse {
  item: PetugasItem;
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

/* ---------- Page ---------- */
export default function PetugasEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [form, setForm] = useState<PetugasForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [bmtOptions, setBmtOptions] = useState<BmtOption[]>([]);
  const [bmtLoading, setBmtLoading] = useState(true);
  const [bmtId, setBmtId] = useState<string>("");
  const [aoOptions, setAoOptions] = useState<AoOption[]>([]);
  const [aoLoading, setAoLoading] = useState(false);
  const [existingKodeAo, setExistingKodeAo] = useState<string>("");

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

  /* Fetch existing data */
  useEffect(() => {
    async function fetchDetail() {
      try {
        const res = await apiGet<PetugasDetailResponse>(`/api/admin/petugas/${id}`);
        const item = res.item;
        setBmtId(item.bmt_id ?? "");
        setExistingKodeAo(item.kode_ao ?? "");
        setForm({
          nama: item.nama ?? "",
          password: "",
          imei: item.imei ?? "",
          batch: item.batch ?? "",
          kode_ao: item.kode_ao ?? "",
          nomorhp: item.nomorhp ?? "",
          id_jabatan: item.id_jabatan ?? 1,
          target: item.target ?? 0,
          status: item.status ?? 1,
        });
      } catch {
        toast.error("Gagal memuat data Petugas");
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [id]);

  /* Fetch AO options dari MSSQL core banking (terikat ke BMT petugas) */
  useEffect(() => {
    if (!bmtId) {
      setAoOptions([]);
      return;
    }
    async function fetchAo() {
      setAoLoading(true);
      try {
        const res = await apiGet<AoListResponse>(`/api/admin/bmt/${bmtId}/ao`);
        setAoOptions(res.items ?? []);
      } catch {
        setAoOptions([]);
      } finally {
        setAoLoading(false);
      }
    }
    fetchAo();
  }, [bmtId]);

  function handleChange(field: keyof PetugasForm, value: string | number) {
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
      // Build payload — omit password if empty
      const payload: Record<string, unknown> = { ...result.data };
      if (!payload.password) {
        delete payload.password;
      }
      await apiPut(`/api/admin/petugas/${id}`, payload);
      toast.success("Petugas berhasil diperbarui");
      router.push(`/petugas/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui Petugas");
    } finally {
      setSubmitting(false);
    }
  }

  /* Loading skeleton */
  if (loading || !form) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" render={<Link href="/petugas" />}>
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
              {Array.from({ length: 8 }).map((_, i) => (
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
        <Button variant="ghost" size="icon-sm" render={<Link href={`/petugas/${id}`} />}>
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Edit Petugas</h1>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Form Petugas</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
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

            {/* Password (optional) */}
            <div className="space-y-2">
              <Label htmlFor="password">Password Baru</Label>
              <Input
                id="password"
                type="password"
                value={form.password ?? ""}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="Kosongkan jika tidak diubah"
              />
            </div>

            {/* BMT — readonly, show current */}
            <div className="space-y-2">
              <Label>BMT</Label>
              {bmtLoading ? (
                <Skeleton className="h-9 w-full" />
              ) : (
                <Input
                  value={`${bmtId} - ${bmtOptions.find((b) => b.id === bmtId)?.nama ?? "-"}`}
                  disabled
                />
              )}
            </div>

            {/* Kode AO (dari MSSQL core banking) */}
            <div className="space-y-2">
              <Label>Kode AO</Label>
              {aoLoading ? (
                <Skeleton className="h-9 w-full" />
              ) : aoOptions.length === 0 ? (
                <Input value={existingKodeAo || "-"} disabled />
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
                value={form.nomorhp ?? ""}
                onChange={(e) => handleChange("nomorhp", e.target.value)}
                placeholder="Masukkan nomor HP"
              />
            </div>

            {/* IMEI */}
            <div className="space-y-2">
              <Label htmlFor="imei">IMEI</Label>
              <Input
                id="imei"
                value={form.imei ?? ""}
                onChange={(e) => handleChange("imei", e.target.value)}
                placeholder="IMEI perangkat"
              />
            </div>

            {/* Batch */}
            <div className="space-y-2">
              <Label htmlFor="batch">Batch</Label>
              <Input
                id="batch"
                value={form.batch ?? ""}
                onChange={(e) => handleChange("batch", e.target.value)}
                placeholder="Batch"
              />
            </div>

            {/* Target */}
            <div className="space-y-2">
              <Label htmlFor="target">Target</Label>
              <Input
                id="target"
                type="number"
                value={form.target ?? 0}
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
              <Button variant="outline" type="button" render={<Link href={`/petugas/${id}`} />}>
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
