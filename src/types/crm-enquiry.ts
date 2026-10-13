export type CrmProspectType = "CUSTOMER" | "SUPPLIER" | "BOTH";
export type CrmPipelineStatus =
  | "NEW"
  | "IN_PROGRESS"
  | "WON"
  | "LOST"
  | "ON_HOLD";
export type CrmRelationshipStage = "PROSPECTIVE" | "CURRENT" | "PAST";

export interface CrmEnquiryNote {
  id: number;
  body: string;
  createdBy?: string | null;
  createdAt: string;
}

export interface CrmEnquiry {
  id: number;
  name: string;
  organizationName?: string | null;
  prospectType: CrmProspectType;
  email?: string | null;
  phone?: string | null;
  secondaryContact?: string | null;
  address?: string | null;
  source?: string | null;
  interest?: string | null;
  summary?: string | null;
  pipelineStatus: CrmPipelineStatus;
  relationshipStage: CrmRelationshipStage;
  customerId?: number | null;
  vendorId?: number | null;
  createdAt: string;
  updatedAt: string;
  notes?: CrmEnquiryNote[];
}

export interface CrmEnquiryPage {
  content: CrmEnquiry[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export type CrmEnquiryPayload = {
  name: string;
  organizationName?: string | null;
  prospectType?: CrmProspectType;
  email?: string | null;
  phone?: string | null;
  secondaryContact?: string | null;
  address?: string | null;
  source?: string | null;
  interest?: string | null;
  summary?: string | null;
  pipelineStatus?: CrmPipelineStatus;
  relationshipStage?: CrmRelationshipStage;
};
