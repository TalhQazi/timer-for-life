// API Service Layer
const BASE_URL = "https://timerforlife.com/api/v1";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
}

class ApiService {
  private _baseURL: string;
  private accessToken: string | null = null;

  constructor(baseURL: string = BASE_URL) {
    this._baseURL = baseURL;
  }

  // Set access token for authenticated requests
  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  // Get base URL for testing
  get baseURL() {
    return this._baseURL;
  }

  // Get headers for API requests
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "ngrok-skip-browser-warning": "true",
    };

    if (this.accessToken) {
      // @ts-ignore - React Native HeadersInit accepts string index
      (headers as any).Authorization = `Bearer ${this.accessToken}`;
    }

    return headers;
  }

  // Generic API request method
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Build URL and append ngrok skip param if using ngrok
    let url = `${this._baseURL}${endpoint}`;
    if (this._baseURL.includes("ngrok")) {
      url +=
        (url.includes("?") ? "&" : "?") + "ngrok-skip-browser-warning=true";
    }
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    // Add a timeout so we don't hang forever on flaky networks
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let response: Response;
    try {
      response = await fetch(url, { ...config, signal: controller.signal });
    } catch (err: any) {
      clearTimeout(timeout);
      throw new Error(
        err?.name === "AbortError"
          ? "Network timeout. Please try again."
          : err?.message || "Network request failed"
      );
    }
    clearTimeout(timeout);

    // Attempt automatic refresh on 401 once
    if (response.status === 401) {
      const refreshed = await this.tryRefreshAccessToken();
      if (refreshed) {
        // retry original request with updated Authorization header
        const retryConfig: RequestInit = {
          ...config,
          headers: {
            ...this.getHeaders(),
            ...options.headers,
          },
        };
        response = await fetch(url, retryConfig);
      }
    }

    // Safely parse JSON; if not JSON, read as text for clearer errors
    const contentType = (
      response.headers.get("content-type") || ""
    ).toLowerCase();
    let data: any = null;
    if (contentType.includes("application/json")) {
      try {
        data = await response.json();
      } catch (e) {
        const text = await response.text().catch(() => "");
        throw new Error(
          text
            ? `Invalid JSON response: ${text.slice(0, 200)}`
            : "Invalid JSON response"
        );
      }
    } else {
      const text = await response.text().catch(() => "");
      if (!response.ok) {
        throw new Error(
          text
            ? `${response.status}: ${text.slice(0, 200)}`
            : `HTTP error! status: ${response.status}`
        );
      }
      // If server returned non-JSON but OK, wrap it
      data = { success: true, message: "OK", data: text } as any;
    }

    if (!response.ok) {
      throw new Error(
        (data && (data.message || data.error)) ||
          `HTTP error! status: ${response.status}`
      );
    }

    return data;
  }

  private async tryRefreshAccessToken(): Promise<boolean> {
    try {
      const stored = await AsyncStorage.getItem("auth_tokens");
      if (!stored) return false;
      const parsed = JSON.parse(stored) as {
        accessToken: string;
        refreshToken: string;
      };
      if (!parsed?.refreshToken) return false;
      let refreshUrl = `${this._baseURL}/auth/refresh-token`;
      if (this._baseURL.includes("ngrok")) {
        refreshUrl +=
          (refreshUrl.includes("?") ? "&" : "?") +
          "ngrok-skip-browser-warning=true";
      }
      const res = await fetch(refreshUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ refreshToken: parsed.refreshToken }),
      });
      if (!res.ok) return false;
      const json = await res.json();
      const newAccess =
        (json?.data && json.data.accessToken) || json.accessToken;
      if (!newAccess) return false;
      // persist updated tokens
      const nextTokens = {
        accessToken: newAccess,
        refreshToken: parsed.refreshToken,
      };
      await AsyncStorage.setItem("auth_tokens", JSON.stringify(nextTokens));
      this.setAccessToken(newAccess);
      return true;
    } catch {
      return false;
    }
  }

  // Authentication endpoints
  async register(userData: {
    email: string;
    password: string;
    name: string;
    timezone: string;
  }): Promise<ApiResponse> {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: {
    email: string;
    password: string;
  }): Promise<ApiResponse> {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse> {
    return this.request("/auth/refresh-token", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  }

  async logout(refreshToken: string): Promise<ApiResponse> {
    return this.request("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    return this.request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  // Timer endpoints
  async getTimers(): Promise<ApiResponse> {
    return this.request("/timers");
  }

  async createTimer(timerData: {
    name: string;
    intervalDays: number;
    category: string;
    icon: string;
    lastResetTimestamp?: number;
  }): Promise<ApiResponse> {
    return this.request("/timers", {
      method: "POST",
      body: JSON.stringify(timerData),
    });
  }

  async updateTimer(
    id: string,
    timerData: {
      name?: string;
      intervalDays?: number;
      category?: string;
      icon?: string;
    }
  ): Promise<ApiResponse> {
    return this.request(`/timers/${id}`, {
      method: "PUT",
      body: JSON.stringify(timerData),
    });
  }

  async deleteTimer(id: string): Promise<ApiResponse> {
    return this.request(`/timers/${id}`, {
      method: "DELETE",
    });
  }

  async resetTimer(
    id: string,
    newResetTimestamp?: number
  ): Promise<ApiResponse> {
    return this.request(`/timers/${id}/reset`, {
      method: "POST",
      body: JSON.stringify({ newResetTimestamp }),
    });
  }

  // Notification endpoints
  async scheduleNotification(notificationData: {
    timerId: string;
    notificationTime: number;
    title: string;
    message: string;
  }): Promise<ApiResponse> {
    return this.request("/notifications/schedule", {
      method: "POST",
      body: JSON.stringify(notificationData),
    });
  }

  async getNotifications(): Promise<ApiResponse> {
    return this.request("/notifications");
  }

  async cancelTimerNotifications(timerId: string): Promise<ApiResponse> {
    return this.request(`/notifications/timer/${timerId}`, {
      method: "DELETE",
    });
  }

  async testNotification(pushToken: string): Promise<ApiResponse> {
    return this.request("/notifications/test", {
      method: "POST",
      body: JSON.stringify({ pushToken }),
    });
  }
}

// Create singleton instance
export const apiService = new ApiService();
export default apiService;
