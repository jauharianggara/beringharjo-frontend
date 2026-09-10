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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiPost } from "@/lib/api";

/* ---------- Schema — matches Rust CreateBmtInput ---------- */
const bmtSchema = z.object({
  id: z.string().min(1, "Kode BMT wajib diisi"),
  nama: z.string().optional().default(""),
  alamat: z.string().optional().default(""),
  telp: z.string().optional().default(""),
  logo: z.string().optional().default(""),
  username: z.string().optional().default(""),
  password: z.string().optional().default(""),
  db_host: z.string().optional().default(""),
  db_database: z.string().optional().default(""),
  db_username: z.string().optional().default(""),
  db_password: z.string().optional().default(""),
});

type BmtForm = z.infer<typeof bmtSchema>;

/* ---------- Page ---------- */
export default function BmtCreatePage() {
  const router = useRouter();

  const [form, setForm] = useState<BmtForm>({
    id: "",
    nama: "",
    alamat: "",
    telp: "",
    logo: "",
    username: "",
    password: "",
    db_host: "",
    db_database: "",
    db_username: "",
    db_password: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function handleChange(field: keyof BmtForm, value: string) {
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

    const result = bmtSchema.safeParse(form);
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
      await apiPost("/api/admin/bmt", result.data);
      toast.success("BMT berhasil ditambahkan");
      router.push("/bmt");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menambahkan BMT");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" render={<Link href="/bmt" />}>
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Tambah BMT</h1>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Form BMT</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            {/* Kode BMT */}
            <div className="space-y-2">
              <Label htmlFor="id">Kode BMT</Label>
              <Input
                id="id"
                value={form.id}
                onChange={(e) => handleChange("id", e.target.value)}
                placeholder="Contoh: 0001"
              />
              {errors.id && (
                <p className="text-xs text-destructive">{errors.id}</p>
              )}
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

            {/* Username Login */}
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="Password untuk login BMT"
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
              <Button variant="outline" type="button" render={<Link href="/bmt" />}>
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
          <CardTitle>Database Connection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* DB Host */}
            <div className="space-y-2">
              <Label htmlFor="db_host">DB Host</Label>
              <Input
                id="db_host"
                value={form.db_host}
                onChange={(e) => handleChange("db_host", e.target.value)}
                placeholder="Contoh: localhost:3306"
              />
            </div>

            {/* DB Database */}
            <div className="space-y-2">
              <Label htmlFor="db_database">DB Database</Label>
              <Input
                id="db_database"
                value={form.db_database}
                onChange={(e) => handleChange("db_database", e.target.value)}
                placeholder="Nama database"
              />
            </div>

            {/* DB Username */}
            <div className="space-y-2">
              <Label htmlFor="db_username">DB Username</Label>
              <Input
                id="db_username"
                value={form.db_username}
                onChange={(e) => handleChange("db_username", e.target.value)}
                placeholder="Username database"
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
                placeholder="Password database"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
