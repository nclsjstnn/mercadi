import type { ReceiptProvider } from "./provider";
import { MockReceiptProvider } from "./mock-provider";
import { BaseApiReceiptProvider } from "./baseapi-provider";

const providers = new Map<string, ReceiptProvider>();

function getOrCreate<T extends ReceiptProvider>(
  name: string,
  factory: () => T
): T {
  if (!providers.has(name)) {
    providers.set(name, factory());
  }
  return providers.get(name) as T;
}

export function getReceiptProvider(name: string): ReceiptProvider {
  switch (name) {
    case "mock":
      return getOrCreate("mock", () => new MockReceiptProvider());
    case "baseapi":
      return getOrCreate("baseapi", () => new BaseApiReceiptProvider());
    default:
      throw new Error(`Unknown receipt provider: ${name}`);
  }
}
