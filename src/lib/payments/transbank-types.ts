export interface TbkCreateResponse {
  token: string;
  url: string;
}

export interface TbkCommitResponse {
  vci: string;
  amount: number;
  status: string; // "AUTHORIZED" | "FAILED"
  buyOrder: string; // our orderId (set as buyOrder in create())
  sessionId: string; // our checkoutSessionId (set as sessionId in create())
  cardDetail: { cardNumber: string }; // last 4 digits masked
  accountingDate: string;
  transactionDate: string;
  authorizationCode: string;
  paymentTypeCode: string;
  responseCode: number; // 0 = success
  installmentsAmount?: number;
  installmentsNumber?: number;
  balance?: number;
}

export interface TbkRefundResponse {
  type: string;
  balance?: number;
  authorizationCode?: string;
  responseCode: number;
  nullifiedAmount?: number;
}

export type TbkStatusResponse = TbkCommitResponse;
