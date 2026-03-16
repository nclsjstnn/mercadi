import { Liquid } from "liquidjs";
import { DEFAULT_STORE_TEMPLATE } from "./default-template";
import { formatPrice } from "@/lib/utils/currency";

const engine = new Liquid({ strictVariables: false, strictFilters: false });

engine.registerFilter("format_price", (amount: number, currency?: string) => {
  return formatPrice(amount, currency || "CLP");
});

function stripScriptTags(html: string): string {
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
}

export async function renderStoreTemplate(
  template: string,
  variables: Record<string, unknown>
): Promise<string> {
  const tpl = template && template.trim() ? stripScriptTags(template) : DEFAULT_STORE_TEMPLATE;
  return engine.parseAndRender(tpl, variables);
}
