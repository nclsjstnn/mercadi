export interface MpItem {
  id?: string;
  title: string;
  quantity: number;
  unit_price: number;
  currency_id: string;
  description?: string;
  picture_url?: string;
}

export interface MpPayer {
  name?: string;
  email: string;
  identification?: {
    type: string;
    number: string;
  };
}

export interface MpBackUrls {
  success: string;
  failure: string;
  pending: string;
}

export interface MpPreferenceRequest {
  items: MpItem[];
  payer: MpPayer;
  back_urls: MpBackUrls;
  auto_return?: "approved" | "all";
  notification_url: string;
  external_reference?: string;
  metadata?: Record<string, unknown>;
}

export interface MpPreferenceResponse {
  id: string;
  init_point: string;
  sandbox_init_point: string;
  date_created: string;
  external_reference?: string;
  items: MpItem[];
}

export interface MpPaymentResponse {
  id: number;
  status:
    | "approved"
    | "pending"
    | "in_process"
    | "rejected"
    | "cancelled"
    | "refunded"
    | "charged_back";
  status_detail: string;
  date_created: string;
  date_approved?: string;
  preference_id: string;
  transaction_amount: number;
  currency_id: string;
  external_reference?: string;
  metadata?: Record<string, unknown>;
  payer?: {
    email: string;
    id?: string;
  };
  payment_method_id?: string;
  payment_type_id?: string;
}

export interface MpWebhookPayload {
  action: string;
  api_version?: string;
  data: {
    id: string;
  };
  date_created?: string;
  id?: string;
  live_mode?: boolean;
  type?: string;
  user_id?: string;
}

export interface MpRefundResponse {
  id: number;
  payment_id: number;
  amount: number;
  status: string;
  date_created: string;
}
