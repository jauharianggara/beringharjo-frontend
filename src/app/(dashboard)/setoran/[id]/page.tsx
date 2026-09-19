"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiGet } from "@/lib/api";

/* ---------- Types — matches Rust SetoranMobile model ---------- */
interface SetoranDetail {
  id: string;
  tanggal: string | null;
  nama_nasabah: string | null;
  nomor_rekening: string | null;
  nominal: number | null;
  bmt_id: string;
  user_id: number;
  batch: string | null;
  cabang: number;
  imei: string | null;
  version: string | null;
  date_add: string | null;
  status_add: number | null;
  date_upload: string | null;
  status_upload: number | null;
  date_edit: string | null;
  status_edit: number | null;
  longitude: string | null;
  latitude: string | null;
}

interface SetoranDetailResponse {
  item: SetoranDetail;
}

/* ---------- Helpers ---------- */
function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function statusLabel(val: number | null): string {
  if (val === null || val === undefined) return "-";
  switch (val) {
    case 0:
      return "Pending";
    case 1:
      return "Berhasil";
    case 2:
      return "Gagal";
    default:
      return String(val);
  }
}

function statusBadge(val: number | null) {
  const text = statusLabel(val);
  const cls =
    val === 1
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      : val === 2
        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {text}
    </span>
  );
}

function fmtDate(d: string | null): string {
  if (!d) return "-";
  return new Date(d).toLocaleString("id-ID");
}

/* ---------- Page ---------- */
export default function SetoranDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<SetoranDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDetail() {
      try {
        const res = await apiGet<SetoranDetailResponse>(
          `/api/admin/setoran-mobile/${id}`
        );
        setData(res.item);
      } catch {
        toast.error("Gagal memuat detail Setoran");
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [id]);

  const hasLocation = data?.latitude && data?.longitude;

  const infoFields = [
    { label: "ID", value: data?.id },
    { label: "Tanggal", value: data?.tanggal ? fmtDate(data.tanggal) : "-" },
    { label: "Nama Anggota", value: data?.nama_nasabah },
    { label: "Nomor Rekening", value: data?.nomor_rekening },
    {
      label: "Nominal",
      value: data?.nominal != null ? formatRupiah(data.nominal) : null,
    },
    { label: "BMT ID", value: data?.bmt_id },
    { label: "User ID", value: data?.user_id },
    { label: "Batch", value: data?.batch },
    { label: "Cabang", value: data?.cabang },
    { label: "IMEI", value: data?.imei },
    { label: "Version", value: data?.version },
    { label: "Tanggal Input", value: fmtDate(data?.date_add ?? null) },
    {
      label: "Status Add",
      value: data?.status_add != null ? statusBadge(data.status_add) : null,
    },
    { label: "Tanggal Upload", value: fmtDate(data?.date_upload ?? null) },
    {
      label: "Status Upload",
      value:
        data?.status_upload != null ? statusBadge(data.status_upload) : null,
    },
    { label: "Tanggal Edit", value: fmtDate(data?.date_edit ?? null) },
    {
      label: "Status Edit",
      value: data?.status_edit != null ? statusBadge(data.status_edit) : null,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" render={<Link href="/setoran" />}>
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          {loading ? (
            <Skeleton className="h-7 w-48" />
          ) : (
            `Setoran #${id}`
          )}
        </h1>
      </div>

      {/* Detail Card */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Setoran</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
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

      {/* Location Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="size-5" />
            Lokasi Setoran
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-48" />
            </div>
          ) : hasLocation ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    Latitude
                  </span>
                  <span className="text-sm">{data!.latitude}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    Longitude
                  </span>
                  <span className="text-sm">{data!.longitude}</span>
                </div>
              </div>
              <a
                href={`https://www.google.com/maps?q=${data!.latitude},${data!.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <MapPin className="size-4" />
                Buka di Google Maps
              </a>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Data lokasi tidak tersedia
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
