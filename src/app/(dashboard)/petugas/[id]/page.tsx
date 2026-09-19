"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiGet, apiDelete } from "@/lib/api";

/* ---------- Types — matches Rust Petugas model ---------- */
interface PetugasItem {
  id: number;
  username: string | null;
  password: string | null;
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
  print_logo: string | null;
  longitude: string | null;
  latitude: string | null;
  demo: number | null;
  id_jabatan: number;
}

interface PetugasDetailResponse {
  item: PetugasItem;
}

/* SetoranItem matches Rust SetoranMobile model */
interface SetoranItem {
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
  status_upload: number | null;
  date_upload: string | null;
  longitude: string | null;
  latitude: string | null;
}

interface SetoranListResponse {
  items: SetoranItem[];
  total: number;
}

/* ---------- Helpers ---------- */
function statusPetugasLabel(val: number | null): string {
  if (val === null || val === undefined) return "-";
  switch (val) {
    case 0: return "Nonaktif";
    case 1: return "Aktif";
    default: return String(val);
  }
}

function statusPetugasBadge(val: number | null) {
  const text = statusPetugasLabel(val);
  const isActive = val === 1;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        isActive
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      }`}
    >
      {text}
    </span>
  );
}

function statusAddBadge(val: number | null) {
  if (val === null) return "-";
  const text = val === 1 ? "Berhasil" : val === 0 ? "Pending" : String(val);
  const cls =
    val === 1
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {text}
    </span>
  );
}

function fmtDate(d: string | null): string {
  if (!d) return "-";
  return new Date(d).toLocaleString("id-ID");
}

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/* ---------- Page ---------- */
export default function PetugasDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<PetugasItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Setoran
  const [setoranData, setSetoranData] = useState<SetoranItem[]>([]);
  const [setoranLoading, setSetoranLoading] = useState(false);

  // Delete dialog
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchDetail() {
      try {
        const res = await apiGet<PetugasDetailResponse>(`/api/admin/petugas/${id}`);
        setData(res.item);
      } catch {
        toast.error("Gagal memuat detail Petugas");
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [id]);

  async function fetchSetoran() {
    setSetoranLoading(true);
    try {
      const res = await apiGet<SetoranListResponse>(
        `/api/admin/petugas/${id}/setoran`
      );
      setSetoranData(res.items ?? []);
    } catch {
      toast.error("Gagal memuat data setoran");
    } finally {
      setSetoranLoading(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await apiDelete(`/api/admin/petugas/${id}/delete`);
      toast.success("Petugas berhasil dihapus");
      router.push("/petugas");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus Petugas");
    } finally {
      setDeleting(false);
    }
  }

  const infoFields = [
    { label: "ID", value: data?.id },
    { label: "Username", value: data?.username },
    { label: "Nama", value: data?.nama },
    { label: "Kode AO", value: data?.kode_ao },
    { label: "BMT ID", value: data?.bmt_id },
    { label: "No. HP", value: data?.nomorhp },
    { label: "IMEI", value: data?.imei },
    { label: "Batch", value: data?.batch },
    { label: "Target", value: data?.target != null ? data.target.toLocaleString("id-ID") : "-" },
    { label: "Jabatan ID", value: data?.id_jabatan },
    { label: "Latitude", value: data?.latitude },
    { label: "Longitude", value: data?.longitude },
    {
      label: "Status",
      value: data?.status != null ? statusPetugasBadge(data.status) : null,
    },
    { label: "Demo", value: data?.demo === 1 ? "Ya" : data?.demo === 0 ? "Tidak" : "-" },
    { label: "Tanggal Daftar", value: fmtDate(data?.tanggal_daftar ?? null) },
    { label: "Tanggal Ubah", value: fmtDate(data?.tanggal_ubah ?? null) },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" render={<Link href="/petugas" />}>
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            {loading ? (
              <Skeleton className="h-7 w-48" />
            ) : (
              `Petugas - ${data?.nama ?? ""}`
            )}
          </h1>
        </div>
        {!loading && data && (
          <div className="flex gap-2">
            <Button variant="outline" render={<Link href={`/petugas/${id}/edit`} />}>
              <Pencil className="size-4" />
              Edit
            </Button>
            <Button variant="destructive" onClick={() => setShowDelete(true)}>
              <Trash2 className="size-4" />
              Hapus
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue="profil"
        onValueChange={(val) => {
          if (val === "setoran" && setoranData.length === 0 && !setoranLoading) {
            fetchSetoran();
          }
        }}
      >
        <TabsList>
          <TabsTrigger value="profil">Profil</TabsTrigger>
          <TabsTrigger value="setoran">Setoran</TabsTrigger>
        </TabsList>

        {/* Profil Tab */}
        <TabsContent value="profil">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Petugas</CardTitle>
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
        </TabsContent>

        {/* Setoran Tab */}
        <TabsContent value="setoran">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Setoran</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Anggota</TableHead>
                      <TableHead>Nominal</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {setoranLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 5 }).map((_, j) => (
                            <TableCell key={j}>
                              <Skeleton className="h-4 w-full" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : setoranData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Tidak ada data setoran
                        </TableCell>
                      </TableRow>
                    ) : (
                      setoranData.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-xs">{item.id}</TableCell>
                          <TableCell>{item.tanggal ? fmtDate(item.tanggal) : "-"}</TableCell>
                          <TableCell>{item.nama_nasabah ?? "-"}</TableCell>
                          <TableCell>
                            {item.nominal != null
                              ? formatRupiah(item.nominal)
                              : "-"}
                          </TableCell>
                          <TableCell>{statusAddBadge(item.status_add)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Petugas</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus petugas{" "}
              <strong>{data?.nama}</strong>? Tindakan ini tidak dapat
              dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDelete(false)}
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
