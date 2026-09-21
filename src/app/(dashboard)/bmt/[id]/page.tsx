"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Pencil, Plug } from "lucide-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiGet, apiPost } from "@/lib/api";

/* ---------- Types — matches Rust Bmt model ---------- */
interface BmtItem {
  id: string;
  nama: string | null;
  alamat: string | null;
  telp: string | null;
  logo: string | null;
  tanggal_daftar: string | null;
  status: number | null;
  username: string | null;
  cabang: number | null;
  db_host: string | null;
  db_database: string | null;
  db_username: string | null;
  db_password: string | null;
}

interface BmtDetailResponse {
  item: BmtItem;
}

/* ---------- Page ---------- */
export default function BmtDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<BmtItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDetail() {
      try {
        const res = await apiGet<BmtDetailResponse>(`/api/admin/bmt/${id}`);
        setData(res.item);
      } catch {
        toast.error("Gagal memuat detail BMT");
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [id]);

  // Test DB connection state
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    connected: boolean;
    db_host?: string;
    latency_ms?: number;
    message?: string;
    error?: string;
  } | null>(null);

  async function handleTestConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await apiPost<{
        connected: boolean;
        db_host?: string;
        latency_ms?: number;
        message?: string;
        error?: string;
      }>(`/api/admin/bmt/${id}/test-db`);
      setTestResult(res);
      if (res.connected) {
        toast.success(res.message || "Koneksi berhasil");
      } else {
        toast.error(res.error || "Koneksi gagal");
      }
    } catch (err) {
      setTestResult({
        connected: false,
        error: err instanceof Error ? err.message : "Gagal test koneksi",
      });
      toast.error(err instanceof Error ? err.message : "Gagal test koneksi");
    } finally {
      setTesting(false);
    }
  }

  const infoFields = [
    { label: "Kode BMT", value: data?.id },
    { label: "Nama", value: data?.nama },
    { label: "Alamat", value: data?.alamat },
    { label: "Telepon", value: data?.telp },
    { label: "Username", value: data?.username },
    {
      label: "Status",
      value: data?.status != null ? (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            data.status === 1
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {data.status === 1 ? "Aktif" : "Nonaktif"}
        </span>
      ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" render={<Link href="/bmt" />}>
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            {loading ? (
              <Skeleton className="h-7 w-48" />
            ) : (
              `BMT - ${data?.nama ?? id}`
            )}
          </h1>
        </div>
        {!loading && data && (
          <div className="flex gap-2">
            <Button variant="outline" render={<Link href={`/bmt/${id}/edit`} />}>
              <Pencil className="size-4" />
              Edit
            </Button>
          </div>
        )}
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi BMT</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {infoFields.map((field) => (
                <div key={field.label} className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    {field.label}
                  </span>
                  <div className="text-sm">{field.value ?? "-"}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Database Connection Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>Database Connection</CardTitle>
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                Encrypted
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={testing}
              >
                {testing ? (
                  <>
                    <Loader2 className="mr-1 size-4 animate-spin" />
                    Mengetes...
                  </>
                ) : (
                  <>
                    <Plug className="mr-1 size-4" />
                    Test Koneksi
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: "DB Host", encrypted: data?.db_host },
                  { label: "DB Database", encrypted: data?.db_database },
                  { label: "DB Username", encrypted: data?.db_username },
                  { label: "DB Password", encrypted: data?.db_password },
                ].map((field) => (
                  <div key={field.label} className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-muted-foreground">{field.label}</span>
                    <div className="text-sm font-mono break-all">
                      {field.encrypted ? "••••••••••••••••" : "-"}
                    </div>
                  </div>
                ))}
              </div>

              {/* Hasil Test Koneksi */}
              {testResult && (
                <div
                  className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                    testResult.connected
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-400"
                      : "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400"
                  }`}
                >
                  <div className="flex items-center gap-2 font-medium">
                    {testResult.connected ? "✅ Koneksi Berhasil" : "❌ Koneksi Gagal"}
                    {testResult.latency_ms !== undefined && (
                      <span className="font-normal opacity-70">
                        ({testResult.latency_ms}ms)
                      </span>
                    )}
                  </div>
                  <div className="mt-1 opacity-90">
                    {testResult.connected
                      ? testResult.message || `Terhubung ke ${testResult.db_host}`
                      : testResult.error || "Tidak dapat terhubung"}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
