import { createCoupon } from "@/actions/coupons";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CouponForm from "@/components/coupons/coupon-form";

export default function NewCouponPage() {
  async function handleCreate(formData: FormData) {
    "use server";
    await createCoupon(formData);
    redirect("/dashboard/coupons");
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Nuevo Cupón</h1>
      <Card>
        <CardHeader>
          <CardTitle>Crear cupón de descuento</CardTitle>
        </CardHeader>
        <CardContent>
          <CouponForm action={handleCreate} submitLabel="Crear Cupón" />
        </CardContent>
      </Card>
    </div>
  );
}
