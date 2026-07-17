import { toast } from "sonner";

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  silent?: boolean;
};

class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

let _apiToken: string | null = null;

export function setApiToken(token: string | null) {
  _apiToken = token;
}

function getAuthToken(): string | null {
  return _apiToken;
}

let _academicYearId: string | null = null;

export function setAcademicYearId(id: string | null) {
  _academicYearId = id;
  if (typeof window !== "undefined") {
    if (id) localStorage.setItem("academic_year_id", id);
    else localStorage.removeItem("academic_year_id");
  }
}

function getAcademicYearId(): string | null {
  if (_academicYearId !== null) return _academicYearId;
  if (typeof window !== "undefined") {
    _academicYearId = localStorage.getItem("academic_year_id");
  }
  return _academicYearId;
}

function showErrorToast(status: number, message: string) {
  if (typeof window === "undefined") return;

  const errorMessages: Record<number, string> = {
    400: "بيانات غير صحيحة، يرجى التحقق من المدخلات",
    401: "انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى",
    403: "ليس لديك صلاحية للقيام بهذه العملية",
    404: "الصفحة أو المورد غير موجود",
    409: "تعارض في البيانات، يرجى المحاولة مرة أخرى",
    422: "بيانات غير صالحة",
    429: "طلبات كثيرة جداً، يرجى الانتظار",
    500: "حدث خطأ في الخادم، يرجى المحاولة لاحقاً",
    503: "الخدمة غير متوفرة حالياً",
  };

  const label = errorMessages[status] || message || "حدث خطأ غير متوقع";

  if (status === 401) {
    toast.error(label, {
      duration: 5000,
      action: {
        label: "تسجيل الدخول",
        onClick: () => {
          if (typeof window !== "undefined") {
            window.location.href = "/auth/login";
          }
        },
      },
    });
    return;
  }

  toast.error(label);
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {}, silent = false } = options;

  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  headers["X-Requested-With"] = "XMLHttpRequest";

  const yearId = getAcademicYearId();
  let url = `/api/${path}`;
  if (yearId) {
    const sep = url.includes("?") ? "&" : "?";
    url += `${sep}academic_year_id=${encodeURIComponent(yearId)}`;
  }

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({
      error: { code: "UNKNOWN", message: "Request failed" },
    }));
    const message = errorBody.error?.message || response.statusText;
    const code = errorBody.error?.code || "UNKNOWN";

    if (!silent) {
      showErrorToast(response.status, message);
    }

    throw new ApiError(message, response.status, code);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  get: <T>(path: string, params?: Record<string, string>, options?: RequestOptions) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<T>(`${path}${query}`, { ...options, method: "GET" });
  },
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};

export { ApiError };
