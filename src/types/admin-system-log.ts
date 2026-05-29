export interface AdminSystemLog {
  id: number;
  createdAt: string;
  level: string;
  module: string;
  loggerName?: string | null;
  message: string;
  stackTrace?: string | null;
  userId?: number | null;
  userEmail?: string | null;
  userUsername?: string | null;
  companyId?: number | null;
  requestMethod?: string | null;
  requestUri?: string | null;
}

export interface AdminSystemLogPage {
  content: AdminSystemLog[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
