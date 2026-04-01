const API_BASE = import.meta.env.VITE_API_URL || "https://dareloop.ru";

interface TokenPair {
  access_token: string;
  refresh_token: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAccessToken(): string | null {
    return localStorage.getItem("dareloop_access_token");
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem("dareloop_refresh_token");
  }

  private setTokens(tokens: TokenPair) {
    localStorage.setItem("dareloop_access_token", tokens.access_token);
    localStorage.setItem("dareloop_refresh_token", tokens.refresh_token);
  }

  private clearTokens() {
    localStorage.removeItem("dareloop_access_token");
    localStorage.removeItem("dareloop_refresh_token");
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
    auth = false
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (auth) {
      const token = this.getAccessToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }

    let res = await fetch(`${this.baseUrl}${path}`, { ...options, headers });

    // Auto-refresh on 401
    if (res.status === 401 && auth) {
      const refreshed = await this.refreshTokens();
      if (refreshed) {
        headers["Authorization"] = `Bearer ${this.getAccessToken()}`;
        res = await fetch(`${this.baseUrl}${path}`, { ...options, headers });
      } else {
        this.clearTokens();
        throw new Error("session_expired");
      }
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(error.error || error.message || res.statusText);
    }

    return res.json();
  }

  private async requestFormData<T>(
    path: string,
    formData: FormData
  ): Promise<T> {
    const token = this.getAccessToken();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(error.error || res.statusText);
    }

    return res.json();
  }

  // ─── Auth ──────────────────────────────────────
  async register(data: {
    username: string;
    first_name: string;
    last_name: string;
    phone: string;
    password: string;
    city: string;
    birth_date?: string;
    ref_code?: string;
  }) {
    return this.request<{ access_token: string; refresh_token: string; user: any }>(
      "/api/register",
      { method: "POST", body: JSON.stringify(data) }
    );
  }

  async login(data: { username: string; password: string }) {
    const res = await this.request<{ access_token: string; refresh_token: string; user: any }>(
      "/api/login",
      { method: "POST", body: JSON.stringify(data) }
    );
    this.setTokens(res);
    return res;
  }

  async refreshTokens(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;
    try {
      const res = await this.request<TokenPair>("/api/refresh", {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      this.setTokens(res);
      return true;
    } catch {
      return false;
    }
  }

  async logout() {
    try {
      await this.request("/api/logout", { method: "POST" }, true);
    } finally {
      this.clearTokens();
    }
  }

  // ─── User ──────────────────────────────────────
  async getMe() {
    return this.request<any>("/api/me", {}, true);
  }

  async updateUser(data: Record<string, any>) {
    return this.request<any>("/api/user", {
      method: "PUT",
      body: JSON.stringify(data),
    }, true);
  }

  async uploadAvatar(file: File) {
    const fd = new FormData();
    fd.append("avatar", file);
    return this.requestFormData<{ avatar: string }>("/api/upload-avatar", fd);
  }

  // ─── Dares ─────────────────────────────────────
  async getDailyDare() {
    return this.request<{ dare: any; remaining_secs: number }>("/api/daily");
  }

  async getDares(params?: { category?: string; difficulty?: string; offset?: number; limit?: number }) {
    const qs = new URLSearchParams();
    if (params?.category) qs.set("category", params.category);
    if (params?.difficulty) qs.set("difficulty", params.difficulty);
    if (params?.offset != null) qs.set("offset", String(params.offset));
    if (params?.limit != null) qs.set("limit", String(params.limit));
    const q = qs.toString();
    return this.request<any[]>(`/api/dares${q ? `?${q}` : ""}`);
  }

  async createDare(data: { title: string; description: string; category: string; difficulty: string }) {
    return this.request<any>("/api/dares", {
      method: "POST",
      body: JSON.stringify(data),
    }, true);
  }

  async acceptDare(id: number) {
    return this.request<any>(`/api/accept/${id}`, { method: "POST" }, true);
  }

  async cancelDare(id: number) {
    return this.request<any>(`/api/cancel/${id}`, { method: "POST" }, true);
  }

  async submitDare(id: number, file: File) {
    const fd = new FormData();
    fd.append("media", file);
    return this.requestFormData<any>(`/api/submit/${id}`, fd);
  }

  async getDare(id: number) {
    return this.request<any>(`/api/dares/${id}`);
  }

  async getSubmissions(dareId: number) {
    return this.request<any[]>(`/api/dares/${dareId}/submissions`);
  }

  async getComments(submissionId: number) {
    return this.request<any[]>(`/api/submissions/${submissionId}/comments`);
  }

  async addComment(submissionId: number, text: string) {
    return this.request<any>(`/api/submissions/${submissionId}/comments`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }, true);
  }

  // ─── Voting ────────────────────────────────────
  async vote(submissionId: number, voteType: "yes" | "no") {
    return this.request<any>(`/api/vote/${submissionId}`, {
      method: "POST",
      body: JSON.stringify({ vote_type: voteType }),
    }, true);
  }

  // ─── Leaderboard ───────────────────────────────
  async getLeaderboard(params?: { city?: string; period?: "week" | "all" }) {
    const qs = new URLSearchParams();
    if (params?.city) qs.set("city", params.city);
    if (params?.period) qs.set("period", params.period);
    const q = qs.toString();
    return this.request<any[]>(`/api/leaderboard${q ? `?${q}` : ""}`);
  }

  // ─── Admin ─────────────────────────────────────
  async setDailyDare(data: { title: string; description: string; category: string; difficulty: string; date: string }) {
    return this.request<any>("/api/admin/daily", { method: "POST", body: JSON.stringify(data) }, true);
  }

  async deleteDare(id: number) {
    return this.request<any>(`/api/admin/dare/${id}`, { method: "DELETE" }, true);
  }

  async banUser(id: number) {
    return this.request<any>(`/api/admin/ban/${id}`, { method: "POST" }, true);
  }

  async unbanUser(id: number) {
    return this.request<any>(`/api/admin/unban/${id}`, { method: "POST" }, true);
  }

  async getUsers() {
    return this.request<any[]>("/api/admin/users", {}, true);
  }

  async resetVotes(submissionId: number) {
    return this.request<any>(`/api/admin/reset-votes/${submissionId}`, { method: "POST" }, true);
  }

  // ─── Helpers ───────────────────────────────────
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

export const api = new ApiClient(API_BASE);
export default api;
