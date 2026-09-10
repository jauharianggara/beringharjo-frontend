"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { apiGet, apiPost } from "@/lib/api";
import { useSortable } from "@/lib/hooks/use-sortable";
import { SortableTableHead } from "@/components/sortable-table-head";

/* ---------- Types ---------- */
interface DeviceRequestItem {
  id: number;
  petugas_id: number;
  device_info?: string;
  requested_token: string;
  status: string;
  requested_at: string;
  responded_at?: string;
  responded_by?: number;
  nama?: string;
  username?: string;
  bmt_id?: string;
}

interface DeviceRequestListResponse {
  items: DeviceRequestItem[];
  total: number;
  page: number;
  per_page: number;
}

interface PetugasItem {
  id: number;
  username: string;
  nama: string;
  imei?: string;
  bmtId: string;
}

interface PetugasListResponse {
  items: PetugasItem[];
  total: number;
  page: number;
  per_page: number;
}

/* ---------- Helpers ---------- */
function timeAgo(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diff = now.getTime() - then.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "baru saja";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} menit lalu`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} jam lalu`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} hari lalu`;
  const mon = Math.floor(day / 30);
  if (mon < 12) return `${mon} bulan lalu`;
  return `${Math.floor(mon / 12)} tahun lalu`;
}

/* ---------- Status badge ---------- */
function StatusBadge({ status }: { status: string }) {
  if (status === "pending")
    return (
      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        Pending
      </Badge>
    );
  if (status === "approved")
    return (
      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
        Disetujui
      </Badge>
    );
  if (status === "rejected")
    return (
      <Badge variant="destructive">Ditolak</Badge>
    );
  return <Badge>{status}</Badge>;
}

/* ---------- Confirm Dialog ---------- */
function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  variant,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  variant: "default" | "destructive";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onCancel}>
      <div
        className="w-full max-w-sm rounded-lg bg-card p-6 shadow-lg ring-1 ring-foreground/10"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Batal
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            size="sm"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Inner Content ---------- */
function DeviceRequestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") || "1");

  // Filter state
  const [searchName, setSearchName] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  // Pending requests state
  const [data, setData] = useState<DeviceRequestItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(20);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Active devices state
  const [activeDevices, setActiveDevices] = useState<PetugasItem[]>([]);
  const [activeTotal, setActiveTotal] = useState(0);
  const [activePage, setActivePage] = useState(1);
  const [activePerPage] = useState(20);
  const [activeLoading, setActiveLoading] = useState(true);
  const [revokeLoading, setRevokeLoading] = useState<number | null>(null);

  // Confirm dialog state
  const [confirm, setConfirm] = useState<{
    type: "approve" | "reject" | "revoke";
    id: number;
    nama: string;
  } | null>(null);

  const { sortedData, sortState, toggleSort } = useSortable<DeviceRequestItem>(data);
  const {
    sortedData: sortedActive,
    sortState: activeSortState,
    toggleSort: toggleActiveSort,
  } = useSortable<PetugasItem>(activeDevices, "nama", "asc");

  /* Fetch device requests */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("per_page", String(perPage));
      if (statusFilter) params.set("status", statusFilter);

      const res = await apiGet<DeviceRequestListResponse>(
        `/api/admin/device-request?${params.toString()}`
      );

      let items = res.items ?? [];
      // Client-side filter by petugas name
      if (searchName.trim()) {
        const q = searchName.toLowerCase();
        items = items.filter(
          (it) =>
            it.nama?.toLowerCase().includes(q) ||
            it.username?.toLowerCase().includes(q)
        );
      }

      setData(items);
      setTotalCount(searchName ? items.length : (res.total ?? 0));
      setCurrentPage(res.page ?? page);
    } catch {
      toast.error("Gagal memuat data device request");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, statusFilter, searchName]);

  /* Fetch active devices (petugas with non-empty imei) */
  const fetchActiveDevices = useCallback(async () => {
    setActiveLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(activePage));
      params.set("per_page", String(activePerPage));
      params.set("search", activeSearch);

      const res = await apiGet<PetugasListResponse>(
        `/api/admin/petugas?${params.toString()}`
      );

      // Filter: only those with non-empty imei
      const withImei = (res.items ?? []).filter(
        (p) => p.imei && p.imei.trim() !== ""
      );
      setActiveDevices(withImei);
      setActiveTotal(withImei.length);
    } catch {
      toast.error("Gagal memuat data perangkat aktif");
    } finally {
      setActiveLoading(false);
    }
  }, [activePage, activePerPage, activeSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchActiveDevices();
  }, [fetchActiveDevices]);

  /* Pending count for badge */
  const pendingCount = data.filter((d) => d.status === "pending").length;

  /* Handle confirm actions */
  async function doAction() {
    if (!confirm) return;
    const { type, id } = confirm;

    if (type === "revoke") {
      setRevokeLoading(id);
      try {
        await apiPost(`/api/admin/device-request/revoke/${id}`);
        toast.success("Akses perangkat berhasil dicabut");
        fetchActiveDevices();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal mencabut akses");
      } finally {
        setRevokeLoading(null);
      }
    } else {
      setActionLoading(id);
      try {
        await apiPost(`/api/admin/device-request/${id}/${type}`);
        toast.success(
          type === "approve"
            ? "Perangkat berhasil disetujui"
            : "Perangkat berhasil ditolak"
        );
        fetchData();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Gagal memproses permintaan"
        );
      } finally {
        setActionLoading(null);
      }
    }
    setConfirm(null);
  }

  /* Pagination */
  const totalPages = Math.ceil(totalCount / perPage);
  const activeTotalPages = Math.ceil(activeTotal / activePerPage);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Approval Perangkat</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchData();
            fetchActiveDevices();
          }}
        >
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </div>

      {/* ========== Section 1: Permintaan Perangkat ========== */}
      <div className="rounded-lg border">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            Permintaan Perangkat
            {pendingCount > 0 && (
              <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                {pendingCount} pending
              </Badge>
            )}
          </h2>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
          <Input
            placeholder="Cari nama petugas..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="h-8 w-[200px]"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              // Reset to page 1 when filter changes
              if (page !== 1) {
                const params = new URLSearchParams(searchParams.toString());
                params.set("page", "1");
                router.push(`/device-request?${params.toString()}`);
              }
            }}
            className="h-8 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Disetujui</option>
            <option value="rejected">Ditolak</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchName("");
              setStatusFilter("");
            }}
          >
            Reset
          </Button>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">No.</TableHead>
              <SortableTableHead
                label="Nama Petugas"
                sortKey="nama"
                currentSortKey={sortState.key}
                direction={sortState.direction}
                onSort={toggleSort}
              />
              <SortableTableHead
                label="Perangkat"
                sortKey="device_info"
                currentSortKey={sortState.key}
                direction={sortState.direction}
                onSort={toggleSort}
              />
              <SortableTableHead
                label="Waktu"
                sortKey="requested_at"
                currentSortKey={sortState.key}
                direction={sortState.direction}
                onSort={toggleSort}
              />
              <SortableTableHead
                label="Status"
                sortKey="status"
                currentSortKey={sortState.key}
                direction={sortState.direction}
                onSort={toggleSort}
              />
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : sortedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-8"
                >
                  Tidak ada data device request
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((item, idx) => (
                <TableRow key={item.id}>
                  <TableCell className="text-muted-foreground">
                    {(currentPage - 1) * perPage + idx + 1}
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.nama ?? item.username ?? `Petugas #${item.petugas_id}`}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {item.device_info ?? "-"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.requested_at ? timeAgo(item.requested_at) : "-"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {item.status === "pending" ? (
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          disabled={actionLoading === item.id}
                          onClick={() =>
                            setConfirm({
                              type: "approve",
                              id: item.id,
                              nama: item.nama ?? item.username ?? "Petugas",
                            })
                          }
                        >
                          {actionLoading === item.id ? "..." : "Setujui"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={actionLoading === item.id}
                          onClick={() =>
                            setConfirm({
                              type: "reject",
                              id: item.id,
                              nama: item.nama ?? item.username ?? "Petugas",
                            })
                          }
                        >
                          {actionLoading === item.id ? "..." : "Tolak"}
                        </Button>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {!loading && totalCount > 0 && totalPages > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
            <span>
              Halaman {currentPage} dari {totalPages} ({totalCount} data)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("page", String(page - 1));
                  router.push(`/device-request?${params.toString()}`);
                }}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("page", String(page + 1));
                  router.push(`/device-request?${params.toString()}`);
                }}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ========== Section 2: Perangkat Aktif ========== */}
      <div className="rounded-lg border">
        <div className="border-b px-4 py-3">
          <h2 className="text-base font-semibold">Perangkat Aktif</h2>
        </div>

        {/* Active Search */}
        <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
          <Input
            placeholder="Cari nama/username petugas..."
            value={activeSearch}
            onChange={(e) => setActiveSearch(e.target.value)}
            className="h-8 w-[220px]"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveSearch("")}
          >
            Reset
          </Button>
        </div>

        {/* Active Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">No.</TableHead>
              <SortableTableHead
                label="Nama"
                sortKey="nama"
                currentSortKey={activeSortState.key}
                direction={activeSortState.direction}
                onSort={toggleActiveSort}
              />
              <SortableTableHead
                label="Username"
                sortKey="username"
                currentSortKey={activeSortState.key}
                direction={activeSortState.direction}
                onSort={toggleActiveSort}
              />
              <TableHead>IMEI</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : sortedActive.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-8"
                >
                  Tidak ada perangkat aktif
                </TableCell>
              </TableRow>
            ) : (
              sortedActive.map((item, idx) => (
                <TableRow key={item.id}>
                  <TableCell className="text-muted-foreground">
                    {(activePage - 1) * activePerPage + idx + 1}
                  </TableCell>
                  <TableCell className="font-medium">{item.nama}</TableCell>
                  <TableCell>{item.username}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {item.imei ?? "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
                      disabled={revokeLoading === item.id}
                      onClick={() =>
                        setConfirm({
                          type: "revoke",
                          id: item.id,
                          nama: item.nama,
                        })
                      }
                    >
                      {revokeLoading === item.id ? "..." : "Cabut"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Active Pagination */}
        {!activeLoading && activeTotal > 0 && activeTotalPages > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
            <span>
              Halaman {activePage} dari {activeTotalPages} ({activeTotal} data)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={activePage <= 1}
                onClick={() => setActivePage((p) => p - 1)}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={activePage >= activeTotalPages}
                onClick={() => setActivePage((p) => p + 1)}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirm !== null}
        title={
          confirm?.type === "approve"
            ? "Setujui Perangkat?"
            : confirm?.type === "reject"
              ? "Tolak Permintaan?"
              : "Cabut Akses Perangkat?"
        }
        message={
          confirm?.type === "approve"
            ? `Setujui perangkat untuk ${confirm.nama}? Perangkat lama akan diganti.`
            : confirm?.type === "reject"
              ? `Tolak permintaan untuk ${confirm.nama}?`
              : `Cabut akses perangkat ${confirm?.nama}? Perangkat ini tidak dapat login lagi.`
        }
        confirmLabel={
          confirm?.type === "approve"
            ? "Setujui"
            : confirm?.type === "reject"
              ? "Tolak"
              : "Cabut"
        }
        variant={
          confirm?.type === "approve" ? "default" : "destructive"
        }
        onConfirm={doAction}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

/* ---------- Page (Suspense wrapper) ---------- */
export default function DeviceRequestPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <DeviceRequestContent />
    </Suspense>
  );
}
