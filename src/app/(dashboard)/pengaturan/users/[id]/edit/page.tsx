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

/* ---------- Schema — matches Rust UpdateUserInput ---------- */
const userSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().optional(),
  status: z.coerce.number(),
});

type UserForm = z.infer<typeof userSchema>;

interface UserItem {
  id: number;
  username: string;
  email: string;
  status: number;
  created_at: number;
  updated_at: number;
}

interface UserDetailResponse {
  item: UserItem;
  roles: string[];
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [form, setForm] = useState<UserForm>({
    email: "",
    password: "",
    status: 10,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await apiGet<UserDetailResponse>(`/api/admin/user/${id}`);
        setForm({
          email: res.item.email,
          password: "",
          status: res.item.status,
        });
      } catch {
        toast.error("Gagal memuat data user");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const result = userSchema.safeParse(form);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Validasi gagal");
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        email: form.email,
        status: Number(form.status),
      };
      // Hanya kirim password jika diisi (kosong = skip update)
      if (form.password && form.password.trim() !== "") {
        payload.password = form.password;
      }
      await apiPut(`/api/admin/user/${id}/edit`, payload);
      toast.success("User berhasil diperbarui");
      router.push(`/pengaturan/users/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui user");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full max-w-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          render={<Link href={`/pengaturan/users/${id}`} />}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Edit User</h1>
      </div>

      {/* Form */}
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Informasi User</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password Baru</Label>
              <Input
                id="password"
                type="password"
                placeholder="Kosongkan jika tidak ingin mengubah"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                Isi hanya jika ingin mengganti password
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={String(form.status)}
                onValueChange={(v) => setForm({ ...form, status: Number(v) })}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">Aktif</SelectItem>
                  <SelectItem value="0">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan"}
              </Button>
              <Button
                type="button"
                variant="outline"
                render={<Link href={`/pengaturan/users/${id}`} />}
                disabled={saving}
              >
                Batal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
