/**
 * Transbank OneClick Mall raw HTTP client.
 *
 * Docs: https://www.transbankdevelopers.cl/referencia/oneclick
 *
 * Flow:
 *  1. inscriptionStart(username, email, responseUrl)  → { token, url_webpay }
 *     Redirect user to url_webpay to enroll their card.
 *
 *  2. Transbank POSTs TBK_TOKEN back to responseUrl.
 *
 *  3. inscriptionFinish(tbkToken) → { response_code, tbk_user, card_type, card_number, ... }
 *     response_code 0 = success. Save tbk_user for future charges.
 *
 *  4. authorize(username, tbkUser, buyOrder, amount) → { detail }
 *     detail.response_code 0 = approved.
 *
 *  5. inscriptionDelete(tbkUser, username) — revokes saved card.
 */

const INTEGRATION_BASE = "https://webpay3gw.transbank.cl";
const PRODUCTION_BASE  = "https://webpay3g.transbank.cl";

// Integration credentials for OneClick Mall (public Transbank test codes)
const INTEGRATION_COMMERCE_CODE       = "597055555541";
const INTEGRATION_CHILD_COMMERCE_CODE = "597055555542";
const INTEGRATION_API_KEY = "579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C";

const ONECLICK_PATH = "/rswebpaytransaction/api/oneclick/v1.2";

export interface OneclickCredentials {
  environment: "integration" | "production";
  commerceCode: string;       // parent commerce code
  childCommerceCode: string;  // child commerce code (can equal parent for simple setup)
  apiKey: string;
}

export function getPlatformOneclickCredentials(): OneclickCredentials {
  const env = (process.env.TBK_ONECLICK_ENVIRONMENT ?? "integration") as
    | "integration"
    | "production";

  if (env === "production") {
    return {
      environment: "production",
      commerceCode:      process.env.TBK_ONECLICK_COMMERCE_CODE!,
      childCommerceCode: process.env.TBK_ONECLICK_CHILD_COMMERCE_CODE ?? process.env.TBK_ONECLICK_COMMERCE_CODE!,
      apiKey:            process.env.TBK_ONECLICK_API_KEY!,
    };
  }

  return {
    environment: "integration",
    commerceCode:      INTEGRATION_COMMERCE_CODE,
    childCommerceCode: INTEGRATION_CHILD_COMMERCE_CODE,
    apiKey:            INTEGRATION_API_KEY,
  };
}

function baseUrl(env: "integration" | "production") {
  return env === "production" ? PRODUCTION_BASE : INTEGRATION_BASE;
}

async function tbkFetch<T>(
  env: "integration" | "production",
  commerceCode: string,
  apiKey: string,
  method: string,
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  const url = `${baseUrl(env)}${ONECLICK_PATH}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Tbk-Api-Key-Id":     commerceCode,
      "Tbk-Api-Key-Secret": apiKey,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "(no body)");
    throw new Error(`Transbank OneClick ${method} ${path} → HTTP ${res.status}: ${text}`);
  }

  const text = await res.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

// ---------------------------------------------------------------------------
// Inscription Start
// ---------------------------------------------------------------------------

export interface InscriptionStartResponse {
  token: string;
  url_webpay: string;
}

export async function inscriptionStart(
  creds: OneclickCredentials,
  username: string,
  email: string,
  responseUrl: string
): Promise<InscriptionStartResponse> {
  return tbkFetch<InscriptionStartResponse>(
    creds.environment,
    creds.commerceCode,
    creds.apiKey,
    "POST",
    "/inscriptions",
    { username, email, response_url: responseUrl }
  );
}

// ---------------------------------------------------------------------------
// Inscription Finish
// ---------------------------------------------------------------------------

export interface InscriptionFinishResponse {
  response_code: number;
  tbk_user: string;
  authorization_code: string;
  card_type: string;
  card_number: string;
}

export async function inscriptionFinish(
  creds: OneclickCredentials,
  tbkToken: string
): Promise<InscriptionFinishResponse> {
  return tbkFetch<InscriptionFinishResponse>(
    creds.environment,
    creds.commerceCode,
    creds.apiKey,
    "PUT",
    `/inscriptions/${tbkToken}`
  );
}

// ---------------------------------------------------------------------------
// Authorize (charge saved card)
// ---------------------------------------------------------------------------

export interface AuthorizeDetail {
  amount: number;
  status: string;
  authorization_code: string;
  payment_type_code: string;
  response_code: number;
  installments_number: number;
  commerce_code: string;
  buy_order: string;
}

export interface AuthorizeResponse {
  details: AuthorizeDetail[];
}

export async function authorize(
  creds: OneclickCredentials,
  params: {
    username: string;
    tbkUser: string;
    buyOrder: string;
    amount: number;
  }
): Promise<{ success: boolean; detail: AuthorizeDetail | null; raw: AuthorizeResponse }> {
  const raw = await tbkFetch<AuthorizeResponse>(
    creds.environment,
    creds.commerceCode,
    creds.apiKey,
    "POST",
    "/transactions",
    {
      username:  params.username,
      tbk_user:  params.tbkUser,
      buy_order: params.buyOrder,
      details: [
        {
          commerce_code:        creds.childCommerceCode,
          buy_order:            params.buyOrder,
          amount:               params.amount,
          installments_number:  1,
        },
      ],
    }
  );

  const detail = raw.details?.[0] ?? null;
  return {
    success: detail?.response_code === 0 && detail?.status === "AUTHORIZED",
    detail,
    raw,
  };
}

// ---------------------------------------------------------------------------
// Delete Inscription
// ---------------------------------------------------------------------------

export async function inscriptionDelete(
  creds: OneclickCredentials,
  tbkUser: string,
  username: string
): Promise<void> {
  await tbkFetch<void>(
    creds.environment,
    creds.commerceCode,
    creds.apiKey,
    "DELETE",
    "/inscriptions",
    { tbk_user: tbkUser, username }
  );
}
