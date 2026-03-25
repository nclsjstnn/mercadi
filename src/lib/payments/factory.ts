import type { PaymentProvider } from "./provider";
import { MockPaymentProvider } from "./mock-provider";
import { MercadoPagoProvider } from "./mercadopago-provider";

const providers = new Map<string, PaymentProvider>();

function getOrCreate<T extends PaymentProvider>(
  name: string,
  factory: () => T
): T {
  if (!providers.has(name)) {
    providers.set(name, factory());
  }
  return providers.get(name) as T;
}

export function getPaymentProvider(name: string): PaymentProvider {
  switch (name) {
    case "mock":
      return getOrCreate("mock", () => new MockPaymentProvider());
    case "transbank":
      throw new Error(
        "Transbank provider not yet implemented. See https://www.transbankdevelopers.cl/"
      );
    case "mercadopago":
      return getOrCreate("mercadopago", () => new MercadoPagoProvider());
    default:
      throw new Error(`Unknown payment provider: ${name}`);
  }
}
