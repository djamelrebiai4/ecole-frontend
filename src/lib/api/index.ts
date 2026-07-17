import { api } from "./client";

export const schoolsApi = {
  list: (params?: { page?: number; limit?: number }) =>
    api.get<{ data: unknown[]; pagination: unknown }>("admin/schools", {
      ...(params?.page ? { page: String(params.page) } : {}),
      ...(params?.limit ? { limit: String(params.limit) } : {}),
    }),
  getById: (id: string) => api.get<unknown>(`admin/schools/${id}`),
  create: (data: unknown) => api.post<{ school_id: string }>("admin/schools", data),
  toggleActive: (id: string) => api.patch<unknown>(`admin/schools/${id}/toggle-active`),
};

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ access_token: string; user: unknown }>("auth/login", { email, password }),
  getProfile: () => api.get<unknown>("auth/profile"),
};

export const studentsApi = {
  list: (params?: { page?: number; search?: string; class_id?: string }) =>
    api.get<{ data: unknown[]; pagination: unknown }>("school/students", {
      ...(params?.page ? { page: String(params.page) } : {}),
      ...(params?.search ? { search: params.search } : {}),
      ...(params?.class_id ? { class_id: params.class_id } : {}),
    }),
  getById: (id: string) => api.get<unknown>(`school/students/${id}`),
  getStatement: (id: string) => api.get<unknown>(`school/students/${id}/statement`),
  create: (data: unknown) => api.post<unknown>("school/students", data),
};

export const dashboardApi = {
  getSchoolStats: () => api.get<unknown>("school/dashboard"),
  getRecentPayments: () => api.get<unknown>("school/dashboard/recent-payments"),
  getPendingFees: () => api.get<unknown>("school/dashboard/pending-fees"),
};

export const classesApi = {
  list: (academicYearId?: string) =>
    api.get<unknown[]>("school/classes", {
      ...(academicYearId ? { academic_year_id: academicYearId } : {}),
    }),
  getById: (id: string) => api.get<unknown>(`school/classes/${id}`),
  create: (data: unknown) => api.post<unknown>("school/classes", data),
};

export const financeApi = {
  getFeeCategories: () => api.get<unknown[]>("school/fee-categories"),
  getPayments: (params?: { page?: number; student_id?: string }) =>
    api.get<{ data: unknown[]; pagination: unknown }>("school/payments", {
      ...(params?.page ? { page: String(params.page) } : {}),
      ...(params?.student_id ? { student_id: params.student_id } : {}),
    }),
  createPayment: (data: unknown) => api.post<unknown>("school/payments", data),
  getGrants: (params?: { page?: number }) =>
    api.get<{ data: unknown[]; pagination: unknown }>("school/grants", {
      ...(params?.page ? { page: String(params.page) } : {}),
    }),
  createGrant: (data: unknown) => api.post<unknown>("school/grants", data),
  getExpenses: (params?: { page?: number }) =>
    api.get<{ data: unknown[]; pagination: unknown }>("school/expenses", {
      ...(params?.page ? { page: String(params.page) } : {}),
    }),
  createExpense: (data: unknown) => api.post<unknown>("school/expenses", data),
  getExpenseCategories: () => api.get<unknown[]>("school/expense-categories"),
};

export const attendanceApi = {
  getByDate: (date: string, classId?: string) =>
    api.get<unknown[]>("school/attendance", {
      date,
      ...(classId ? { class_id: classId } : {}),
    }),
  upsert: (data: { date: string; records: unknown[] }) =>
    api.post<unknown>("school/attendance", data),
};

export const roomsApi = {
  list: () => api.get<unknown[]>("school/rooms"),
  getById: (id: string) => api.get<unknown>(`school/rooms/${id}`),
  assignStudent: (data: unknown) => api.post<unknown>("school/room-assignments", data),
};

export const teachingRoomsApi = {
  list: () => api.get<unknown[]>("school/teaching-rooms"),
  getById: (id: string) => api.get<unknown>(`school/teaching-rooms/${id}`),
  create: (data: unknown) => api.post<unknown>("school/teaching-rooms", data),
  update: (id: string, data: unknown) => api.put<unknown>(`school/teaching-rooms/${id}`, data),
  getSchedule: (roomId: string) => api.get<{ slots: unknown[]; breaks: unknown[] }>(`school/teaching-rooms/${roomId}/schedule`),
};

export const scheduleApi = {
  createSlot: (data: unknown) => api.post<unknown>("school/schedule-slots", data),
  updateSlot: (id: string, data: unknown) => api.put<unknown>(`school/schedule-slots/${id}`, data),
  deleteSlot: (id: string) => api.delete<unknown>(`school/schedule-slots/${id}`),
};

export const staffApi = {
  list: () => api.get<unknown[]>("school/staff"),
  create: (data: unknown) => api.post<unknown>("school/staff", data),
};

export const notesApi = {
  list: (studentId?: string) =>
    api.get<unknown[]>("school/notes", {
      ...(studentId ? { student_id: studentId } : {}),
    }),
  create: (data: unknown) => api.post<unknown>("school/notes", data),
  remove: (id: string) => api.delete<unknown>(`school/notes/${id}`),
};

export const subscriptionsApi = {
  getPlans: () => api.get<unknown[]>("subscriptions/plans/active"),
  getAllPlans: () => api.get<unknown[]>("subscriptions/plans"),
  updatePlan: (id: string, data: unknown) =>
    api.put<unknown>(`subscriptions/plans/${id}`, data),
  getPlatformStats: () => api.get<unknown>("subscriptions/stats"),
  getRevenueHistory: () => api.get<unknown>("subscriptions/revenue"),
};

export const usersApi = {
  list: () => api.get<unknown[]>("school/users"),
  toggleActive: (id: string) => api.patch<unknown>(`school/users/${id}/toggle-active`),
};

export const notificationsApi = {
  list: (params?: { page?: number; limit?: number; type?: string; is_read?: boolean; priority?: string }) =>
    api.get<{ data: any[]; count: number; page: number; limit: number; total_pages: number }>("school/notifications", {
      ...(params?.page ? { page: String(params.page) } : {}),
      ...(params?.limit ? { limit: String(params.limit) } : {}),
      ...(params?.type ? { type: params.type } : {}),
      ...(params?.is_read !== undefined ? { is_read: String(params.is_read) } : {}),
      ...(params?.priority ? { priority: params.priority } : {}),
    }),
  getUnreadCount: () => api.get<{ count: number }>("school/notifications/unread-count"),
  getById: (id: string) => api.get<any>(`school/notifications/${id}`),
  markAsRead: (id: string) => api.patch<any>(`school/notifications/${id}/read`),
  markAllAsRead: () => api.post<{ updated: number }>("school/notifications/read-all"),
  deleteRead: () => api.delete<{ deleted: number }>("school/notifications/read"),
  delete: (id: string) => api.delete<any>(`school/notifications/${id}`),
};