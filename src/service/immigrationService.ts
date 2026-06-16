import { apiClient } from "./apiClient";

/* ================= PASSPORT ================= */

export interface PassportPayload {
  passportNo: string;
  nameAsPassport: string;
  issueCountry: string;
  nationality: string;
  issueDate: string;   // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
}

const getPassport = (employeeId: number) =>
  apiClient.get(`/employees/${employeeId}/passport`).then(r => r.data);

const createPassport = (employeeId: number, payload: PassportPayload) =>
  apiClient.post(`/employees/${employeeId}/passport`, payload).then(r => r.data);

const updatePassport = (employeeId: number, payload: PassportPayload) =>
  apiClient.put(`/employees/${employeeId}/passport`, payload).then(r => r.data);

const deletePassport = (employeeId: number) =>
  apiClient.delete(`/employees/${employeeId}/passport`);


/* ================= RESIDENCE PERMIT ================= */

export interface ResidencePermitPayload {
  permitIdNumber: string; // ✅ ADDED
  visaType: string;
  durationType: string;
  visaDuration: string;
  nationality: string;
  occupation: string;
  issuePlace: string;
  issueAuthority: string;
  visaStatus: string;
  startDate: string;
  endDate: string;
}

const getResidencePermit = (employeeId: number) =>
  apiClient.get(`/employees/${employeeId}/residence-permit`).then(r => r.data);

const createResidencePermit = (employeeId: number, payload: ResidencePermitPayload) =>
  apiClient.post(`/employees/${employeeId}/residence-permit`, payload).then(r => r.data);

const updateResidencePermit = (employeeId: number, payload: ResidencePermitPayload) =>
  apiClient.put(`/employees/${employeeId}/residence-permit`, payload).then(r => r.data);

const deleteResidencePermit = (employeeId: number) =>
  apiClient.delete(`/employees/${employeeId}/residence-permit`);


/* ================= EXPIRY REPORT ================= */

export interface ImmigrationExpiryItem {
  documentType: "PASSPORT" | "RESIDENCE_PERMIT";
  employeeId: number;
  employeeCode: string | null;
  employeeName: string | null;
  documentNumber: string;
  expiryDate: string; // YYYY-MM-DD
  daysRemaining: number; // negative when expired
  status: "EXPIRED" | "EXPIRING_SOON";
}

const getExpiring = (withinDays = 30): Promise<ImmigrationExpiryItem[]> =>
  apiClient
    .get(`/immigration/expiring`, { params: { withinDays } })
    .then((r) => r.data ?? []);


/* ================= DOCUMENT UPLOAD ================= */

const uploadPassportDocument = (employeeId: number, file: File) => {
  const form = new FormData();
  form.append("file", file);
  return apiClient
    .post(`/employees/${employeeId}/passport/document`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

const uploadResidenceDocument = (employeeId: number, file: File) => {
  const form = new FormData();
  form.append("file", file);
  return apiClient
    .post(`/employees/${employeeId}/residence-permit/document`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

export const immigrationService = {
  getPassport,
  createPassport,
  updatePassport,
  deletePassport,

  getResidencePermit,
  createResidencePermit,
  updateResidencePermit,
  deleteResidencePermit,

  getExpiring,

  uploadPassportDocument,
  uploadResidenceDocument,
};

export default immigrationService;
