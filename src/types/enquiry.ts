export type EnquiryChannel = "EMAIL" | "WHATSAPP";
export type EnquiryStatus = "NEW" | "IN_PROGRESS" | "CLOSED";

export interface Enquiry {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  interest?: string | null;
  message?: string | null;
  channel: EnquiryChannel;
  status: EnquiryStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  created?: boolean | null;
}

export interface EnquiryPage {
  content: Enquiry[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface EnquiryUpdatePayload {
  status?: EnquiryStatus;
  notes?: string | null;
}
