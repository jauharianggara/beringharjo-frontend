import { apiPost } from "./api";

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email?: string;
  };
  petugas: Record<string, unknown>;
  roles: string[];
}

export interface StoredUser {
  id: number;
  username: string;
  email?: string;
  petugas: Record<string, unknown>;
  roles: string[];
}

function setCookie(name: string, value: string, days = 7): void {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  // Secure otomatis aktif di HTTPS (tunnel), nonaktif di HTTP (localhost dev)
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${secure}`;
}

function deleteCookie(name: string): void {
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax${secure}`;
}

export async function login(
  username: string,
  password: string
): Promise<LoginResponse> {
  const data = await apiPost<LoginResponse>("/api/admin/auth/login", {
    username,
    password,
  });

  // Store token in cookie
  setCookie("admin_token", data.token);

  // Store user data in localStorage
  const user: StoredUser = {
    id: data.user.id,
    username: data.user.username,
    email: data.user.email,
    petugas: data.petugas,
    roles: data.roles,
  };
  localStorage.setItem("admin_user", JSON.stringify(user));

  return data;
}

export async function logout(): Promise<void> {
  try {
    await apiPost("/api/admin/auth/logout");
  } catch {
    // Ignore errors on logout — clear local state regardless
  }

  deleteCookie("admin_token");
  localStorage.removeItem("admin_user");
}

export function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )admin_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function getUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("admin_user");
    if (!raw) return null;
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}
