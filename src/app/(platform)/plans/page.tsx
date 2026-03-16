import { requireAuth } from "@/lib/auth/guards";
import { PLAN_DETAILS, PlanType } from "@/lib/config/plans";
import { formatPrice } from "@/lib/utils/currency";
import { PageHeader } from "@/components/platform/page-header";
import { UpgradeButton } from "@/components/platform/upgrade-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

export default async function PlansPage() {
  const session = await requireAuth();
  const currentPlan = (session.user.plan || "free") as PlanType;

  return (
    <div>
      <PageHeader
        title="Planes"
        description="Elige el plan que mejor se adapte a tu negocio"
        breadcrumbs={[{ label: "Planes" }]}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {(Object.entries(PLAN_DETAILS) as [PlanType, (typeof PLAN_DETAILS)[PlanType]][]).map(
          ([key, plan]) => {
            const isCurrent = key === currentPlan;
            return (
              <Card
                key={key}
                className={isCurrent ? "border-2 border-primary" : undefined}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{plan.name}</CardTitle>
                    {isCurrent && <Badge>Plan actual</Badge>}
                  </div>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">
                      {plan.price === 0
                        ? "Gratis"
                        : formatPrice(plan.price, plan.currency)}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-muted-foreground">
                        /{plan.period}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {key === "pro" && !isCurrent && <UpgradeButton />}
                </CardContent>
              </Card>
            );
          }
        )}
      </div>
    </div>
  );
}
