import { notFound } from "next/navigation";
import Link from "next/link";
import { connectDB } from "@/lib/db/connect";
import { Order } from "@/lib/db/models/order";
import { Tenant } from "@/lib/db/models/tenant";
import { formatPrice } from "@/lib/utils/currency";
import { CheckCircle2 } from "lucide-react";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ tenantSlug: string; orderId: string }>;
}) {
  const { tenantSlug, orderId } = await params;
  await connectDB();

  const tenant = await Tenant.findOne({ slug: tenantSlug, status: "active" });
  if (!tenant) return notFound();

  const order = await Order.findOne({
    orderId,
    tenantId: tenant._id,
  });
  if (!order) return notFound();

  return (
    <div className="mx-auto max-w-lg px-4 py-8 text-center">
      <div
        className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: "var(--store-primary)", opacity: 0.1 }}
      >
        <CheckCircle2
          className="h-10 w-10"
          style={{ color: "var(--store-primary)" }}
        />
      </div>
      <h1 className="mb-2 text-xl font-bold text-gray-900 sm:text-2xl">
        Pedido confirmado!
      </h1>
      <p className="mb-8 text-gray-500">
        Tu pedido <span className="font-mono font-medium">{order.orderId}</span>{" "}
        ha sido procesado exitosamente.
      </p>

      <div className="rounded-xl border bg-white p-4 sm:p-6 text-left">
        <h2 className="mb-4 text-lg font-bold text-gray-900">
          Detalle del pedido
        </h2>
        <div className="divide-y text-sm">
          {order.lineItems.map((item, i) => (
            <div key={i} className="flex justify-between py-2">
              <span className="text-gray-600">
                {item.title} x{item.quantity}
              </span>
              <span className="font-medium">
                {formatPrice(item.totalPrice, order.currency)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-1 border-t pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span>{formatPrice(order.totals.subtotal, order.currency)}</span>
          </div>
          {order.totals.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>
                Descuento{order.couponCode ? ` (${order.couponCode})` : ""}
              </span>
              <span>-{formatPrice(order.totals.discount, order.currency)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">IVA</span>
            <span>{formatPrice(order.totals.tax, order.currency)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>{formatPrice(order.totals.total, order.currency)}</span>
          </div>
        </div>

        {order.buyer && (
          <div className="mt-6 border-t pt-4">
            <h3 className="mb-2 font-medium text-gray-900">Comprador</h3>
            <p className="text-sm text-gray-600">{order.buyer.name}</p>
            <p className="text-sm text-gray-600">{order.buyer.email}</p>
          </div>
        )}

        {order.fulfillment?.address && (
          <div className="mt-4 border-t pt-4">
            <h3 className="mb-2 font-medium text-gray-900">Envio</h3>
            <p className="text-sm text-gray-600">
              {order.fulfillment.address.street}
            </p>
            <p className="text-sm text-gray-600">
              {order.fulfillment.address.comuna},{" "}
              {order.fulfillment.address.region}
            </p>
          </div>
        )}
      </div>

      <Link
        href="/"
        className="mt-8 inline-block rounded-lg px-6 py-3 text-sm font-medium text-white"
        style={{ backgroundColor: "var(--store-primary)" }}
      >
        Volver a la tienda
      </Link>
    </div>
  );
}
