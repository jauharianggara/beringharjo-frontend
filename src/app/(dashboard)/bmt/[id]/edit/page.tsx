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
import { Textarea } from "@/components/ui/textarea";
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

/* ---------- Schema — matches Rust UpdateBmtInput ---------- */
const bmtSchema = z.object({
  nama: z.string().optional(),
  alamat: z.string().optional(),
  telp: z.string().optional(),
  status: z.coerce.number().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  db_host: z.string().optional(),
  db_database: z.string().optional(),
  db_username: z.string().optional(),
  db_password: z.string().optional(),
});

type BmtForm = z.infer<typeof bmtSchema>;

interface BmtItem {
  id: string;
  nama: string | null;
  alamat: string | null;
  telp: string | null;
  status: number | null;
  username: string | null;
  db_host: string | null;
  db_database: string | null;
  db_username: string | null;
  db_password: string | null;
}

interface BmtDetailResponse {
  item: BmtItem;
}

/* ---------- Page ---------- */
export default function BmtEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [form, setForm] = useState<BmtForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  /* Fetch existing data */
  useEffect(() => {
    async function fetchDetail() {
      try {
        const res = await apiGet<BmtDetailResponse>(`/api/admin/bmt/${id}`);
        const item = res.item;
        setForm({
          nama: item.nama ?? "",
          alamat: item.alamat ?? "",
          telp: item.telp ?? "",
          status: item.status ?? 1,
          username: item.username ?? "",
          password: "",
          db_host: "",
          db_database: "",
          db_username: "",
          db_password: "",
        });
      } catch {
        toast.error("Gagal memuat data BMT");
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [id]);

  function handleChange(field: keyof BmtForm, value: string | number) {
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

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = { ...form };
      if (!payload.password) delete payload.password;
      if (!payload.db_host) delete payload.db_host;
      if (!payload.db_database) delete payload.db_database;
      if (!payload.db_username) delete payload.db_username;
      if (!payload.db_password) delete payload.db_password;
      await apiPut(`/api/admin/bmt/${id}`, payload);
      toast.success("BMT berhasil diperbarui");
      router.push(`/bmt/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui BMT");
    } finally {
      setSubmitting(false);
    }
  }

  /* Loading skeleton */
  if (loading || !form) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" render={<Link href="/bmt" />}>
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
              {Array.from({ length: 6 }).map((_, i) => (
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
        <Button variant="ghost" size="icon-sm" render={<Link href={`/bmt/${id}`} />}>
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Edit BMT</h1>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Form BMT</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            {/* Kode BMT — readonly */}
            <div className="space-y-2">
              <Label>Kode BMT</Label>
              <Input value={id} disabled />
            </div>

            {/* Nama */}
            <div className="space-y-2">
              <Label htmlFor="nama">Nama BMT</Label>
              <Input
                id="nama"
                value={form.nama}
                onChange={(e) => handleChange("nama", e.target.value)}
                placeholder="Masukkan nama BMT"
              />
            </div>

            {/* Telepon */}
            <div className="space-y-2">
              <Label htmlFor="telp">Telepon</Label>
              <Input
                id="telp"
                value={form.telp}
                onChange={(e) => handleChange("telp", e.target.value)}
                placeholder="Masukkan nomor telepon"
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
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Aktif</SelectItem>
                  <SelectItem value="0">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Username login */}
            <div className="space-y-2">
              <Label htmlFor="username">Username Login</Label>
              <Input
                id="username"
                value={form.username}
                onChange={(e) => handleChange("username", e.target.value)}
                placeholder="Username untuk login BMT"
              />
            </div>

            {/* Password */}
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

            {/* Alamat — full width */}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="alamat">Alamat</Label>
              <Textarea
                id="alamat"
                value={form.alamat}
                onChange={(e) => handleChange("alamat", e.target.value)}
                placeholder="Masukkan alamat"
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 sm:col-span-2">
              <Button variant="outline" type="button" render={<Link href={`/bmt/${id}`} />}>
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Database Connection */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Database Connection</CardTitle>
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              Encrypted
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Nilai terenkripsi. Kosongkan jika tidak ingin mengubah.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* DB Host */}
            <div className="space-y-2">
              <Label htmlFor="db_host">DB Host</Label>
              <Input
                id="db_host"
                value={form.db_host}
                onChange={(e) => handleChange("db_host", e.target.value)}
                placeholder="Kosongkan jika tidak diubah"
              />
            </div>

            {/* DB Database */}
            <div className="space-y-2">
              <Label htmlFor="db_database">DB Database</Label>
              <Input
                id="db_database"
                value={form.db_database}
                onChange={(e) => handleChange("db_database", e.target.value)}
                placeholder="Kosongkan jika tidak diubah"
              />
            </div>

            {/* DB Username */}
            <div className="space-y-2">
              <Label htmlFor="db_username">DB Username</Label>
              <Input
                id="db_username"
                value={form.db_username}
                onChange={(e) => handleChange("db_username", e.target.value)}
                placeholder="Kosongkan jika tidak diubah"
              />
            </div>

            {/* DB Password */}
            <div className="space-y-2">
              <Label htmlFor="db_password">DB Password</Label>
              <Input
                id="db_password"
                type="password"
                value={form.db_password}
                onChange={(e) => handleChange("db_password", e.target.value)}
                placeholder="Kosongkan jika tidak diubah"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
