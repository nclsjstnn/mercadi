import {
  UCP_VERSION,
  UCP_SERVICE,
  UCP_CAPABILITY_CHECKOUT,
  UCP_TRANSPORT,
} from "./constants";

export function generateUCPProfile(tenantSlug: string, baseUrl: string) {
  const endpoint = `${baseUrl}/api/ucp/${tenantSlug}/v1`;

  return {
    ucp: { version: UCP_VERSION },
    services: {
      [UCP_SERVICE]: [
        {
          transport: UCP_TRANSPORT,
          endpoint,
        },
      ],
    },
    capabilities: {
      [UCP_CAPABILITY_CHECKOUT]: [
        {
          version: UCP_VERSION,
        },
      ],
    },
    payment: {
      handlers: [
        {
          type: "platform_managed",
          description: "Payment handled by Mercadi platform",
        },
      ],
    },
  };
}
