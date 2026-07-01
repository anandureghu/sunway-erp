export type PublicDeliveryTrackingCompany = {
  companyCode: string;
  companyName: string;
  logoUrl?: string | null;
  phoneNo?: string | null;
  companyEmail?: string | null;
  websiteUrl?: string | null;
};

export type PublicDeliveryTrackingEvent = {
  status: string;
  location?: string | null;
  notes?: string | null;
  eventAt?: string | null;
};

export type PublicDeliveryTrackingItem = {
  itemName?: string | null;
  quantity?: number | null;
};

export type PublicDeliveryTrackingShipment = {
  shipmentNumber: string;
  orderNumber: string;
  status: string;
  carrierName?: string | null;
  trackingNumber?: string | null;
  estimatedDeliveryDate?: string | null;
  deliveryAddress?: string | null;
  createdAt?: string | null;
  deliveredAt?: string | null;
  items: PublicDeliveryTrackingItem[];
  trackingEvents: PublicDeliveryTrackingEvent[];
};

export type PublicDeliveryTrackingLookupResponse = {
  company: PublicDeliveryTrackingCompany;
  deliveries: PublicDeliveryTrackingShipment[];
};

export type PublicDeliveryTrackingLookupRequest = {
  orderNumber?: string;
  email?: string;
  phone?: string;
};
