import type { CurrentUser } from "../types/Audit";

/** 统一请求前缀，禁止硬编码 localhost；生产由 Nginx 反代 /api */
const BASE = "/api";
const USER_KEY = "grid-repair-user";

export const saveCurrentUser = (user: CurrentUser | null): void => {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
};

export const readCurrentUser = (): CurrentUser | null => {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as CurrentUser) : null;
};

/** 模拟 JWT 场景下的身份头：后端 authMiddleware 据此构造 req.user */
export const authHeaders = (): Record<string, string> => {
  // 首次进入（未切换角色）默认以调度员身份访问，保证 /api/snapshot 不返回 401
  const user = readCurrentUser() ?? { id: 1, name: "调度员 郑凯", role: "DISPATCHER" };
  return {
    "x-user-id": String(user.id),
    "x-user-name": encodeURIComponent(user.name),
    "x-role": user.role
  };
};

export class HttpError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...authHeaders(), ...(init.headers ?? {}) },
    ...init
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new HttpError(res.status, body?.code ?? "HTTP_ERROR", body?.message ?? `请求失败 ${res.status}`);
  }
  return body as T;
};

export const getJson = <T>(path: string): Promise<T> => request<T>(path);
export const postJson = <T>(path: string, payload: unknown): Promise<T> =>
  request<T>(path, { method: "POST", body: JSON.stringify(payload) });

/** 网络层错误（DNS/拒绝连接/CORS）视为后端离线，回退本地数据 */
export const isOffline = (err: unknown): boolean => err instanceof TypeError;
