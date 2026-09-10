"use client";

import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Shield,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiGet } from "@/lib/api";
import { useSortable } from "@/lib/hooks/use-sortable";
import { SortableTableHead } from "@/components/sortable-table-head";

/* ---------- Types ---------- */
interface RoleItem {
  name: string;
  description: string | null;
}

interface RoleUserItem {
  id: number;
  username: string;
  email: string;
}

interface RoleListResponse {
  items: RoleItem[];
  total: number;
}

interface RoleUsersResponse {
  items: RoleUserItem[];
  total: number;
}

/* ---------- Role Card ---------- */
function RoleCard({ role }: { role: RoleItem }) {
  const [expanded, setExpanded] = useState(false);
  const [users, setUsers] = useState<RoleUserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const { sortedData, sortState, toggleSort } = useSortable<RoleUserItem>(users);

  async function toggleExpand() {
    if (!expanded && users.length === 0) {
      // Fetch users on first expand
      setLoadingUsers(true);
      try {
        const res = await apiGet<RoleUsersResponse>(
          `/api/admin/role/${encodeURIComponent(role.name)}/users`
        );
        setUsers(res.items ?? []);
      } catch {
        toast.error(`Gagal memuat user untuk role ${role.name}`);
      } finally {
        setLoadingUsers(false);
      }
    }
    setExpanded(!expanded);
  }

  return (
    <Card>
      <CardHeader
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={toggleExpand}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <Shield className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-base">{role.name}</CardTitle>
              {role.description && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {role.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Users className="size-3 mr-1" />
              {expanded && !loadingUsers
                ? `${users.length} user`
                : "Lihat user"}
            </Badge>
            {expanded ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          {loadingUsers ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Tidak ada user yang memiliki role ini.
            </p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead label="ID" sortKey="id" currentSortKey={sortState.key} direction={sortState.direction} onSort={toggleSort} className="w-[60px]" />
                    <SortableTableHead label="Username" sortKey="username" currentSortKey={sortState.key} direction={sortState.direction} onSort={toggleSort} />
                    <SortableTableHead label="Email" sortKey="email" currentSortKey={sortState.key} direction={sortState.direction} onSort={toggleSort} />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-muted-foreground">
                        {user.id}
                      </TableCell>
                      <TableCell className="font-medium">
                        {user.username}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

/* ---------- Roles Page ---------- */
export default function RolesListPage() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRoles() {
      setLoading(true);
      try {
        const res = await apiGet<RoleListResponse>("/api/admin/role");
        setRoles(res.items ?? []);
      } catch {
        toast.error("Gagal memuat data role");
      } finally {
        setLoading(false);
      }
    }
    fetchRoles();
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manajemen Roles</h1>
        <p className="text-muted-foreground">
          Daftar role yang tersedia dalam sistem. Klik role untuk melihat user
          yang memiliki role tersebut.
        </p>
      </div>

      {/* Role Cards */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Skeleton className="size-9 rounded-lg" />
                  <div className="space-y-1">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : roles.length === 0 ? (
        <Card>
          <CardContent className="text-center text-muted-foreground py-8">
            Tidak ada data role
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {roles.map((role) => (
            <RoleCard key={role.name} role={role} />
          ))}
        </div>
      )}
    </div>
  );
}
