"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  CreditCard,
  Settings,
  Building2,
  Receipt,
  ChevronsUpDown,
  LogOut,
  Store,
  Ticket,
  User as UserIcon,
  MessageCircle,
  Bot,
  Globe,
  BookOpen,
  LifeBuoy,
  Users,
} from "lucide-react";
import { TenantSwitcher } from "./tenant-switcher";
import type { LucideIcon } from "lucide-react";

const tenantMainNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/products", label: "Productos", icon: Package },
  { href: "/dashboard/coupons", label: "Cupones", icon: Ticket },
  { href: "/dashboard/orders", label: "Pedidos", icon: ShoppingCart },
  { href: "/dashboard/payments", label: "Pagos", icon: CreditCard },
];

const tenantChannelNav = [
  { href: "/dashboard/store", label: "Tienda", icon: Store },
  { href: "/dashboard/channels/ucp", label: "UCP / Gemini", icon: Globe },
  { href: "/dashboard/channels/whatsapp", label: "WhatsApp", icon: MessageCircle },
  { href: "/dashboard/channels/acp", label: "ChatGPT / ACP", icon: Bot },
];

const tenantSettingsNav = [
  { href: "/dashboard/settings", label: "Configuracion", icon: Settings },
  { href: "/docs", label: "Documentacion", icon: BookOpen },
  { href: "/support", label: "Soporte", icon: LifeBuoy },
];

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/tenants", label: "Negocios", icon: Building2 },
  { href: "/admin/orders", label: "Pedidos", icon: ShoppingCart },
  { href: "/admin/commissions", label: "Comisiones", icon: Receipt },
  { href: "/admin/waitlist", label: "Lista de Espera", icon: Users },
  { href: "/admin/settings", label: "Configuracion", icon: Settings },
];

interface TenantInfo {
  _id: string;
  name: string;
  slug: string;
  isOwner: boolean;
  status?: string;
}

interface AppSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
  tenants?: TenantInfo[];
  activeTenantId?: string;
  canCreateMore?: boolean;
  plan?: string;
}

export function AppSidebar({
  user,
  tenants = [],
  activeTenantId = "",
  canCreateMore = false,
  plan = "free",
}: AppSidebarProps) {
  const pathname = usePathname();
  const isAdmin = user.role === "admin" || pathname.startsWith("/admin");
  const initials = (user.name || user.email || "U")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function isActive(href: string) {
    const base = href.split("?")[0];
    return (
      base === pathname ||
      (base !== "/dashboard" && base !== "/admin" && pathname.startsWith(base))
    );
  }

  return (
    <Sidebar>
      {/* ── Header ─────────────────────────────────────────── */}
      <SidebarHeader className="border-b px-5 py-4">
        <Link href="/" className="flex items-center">
          <Image src="/mercadi.png" alt="Mercadi" width={130} height={34} priority />
        </Link>
        {!isAdmin && !pathname.startsWith("/admin") && tenants.length > 0 && (
          <div className="mt-3">
            <TenantSwitcher
              tenants={tenants}
              activeTenantId={activeTenantId}
              canCreateMore={canCreateMore}
              plan={plan}
            />
          </div>
        )}
      </SidebarHeader>

      {/* ── Content ────────────────────────────────────────── */}
      <SidebarContent>
        {isAdmin ? (
          <NavGroup label="Administración" items={adminNav} isActive={isActive} />
        ) : (
          <>
            <NavGroup label="Mi Negocio" items={tenantMainNav} isActive={isActive} />
            <SidebarSeparator className="mx-4" />
            <NavGroup label="Canales" items={tenantChannelNav} isActive={isActive} />
            <SidebarSeparator className="mx-4" />
            <NavGroup items={tenantSettingsNav} isActive={isActive} />
          </>
        )}
      </SidebarContent>

      {/* ── Footer ─────────────────────────────────────────── */}
      <SidebarFooter className="border-t px-3 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-sidebar-accent focus-visible:outline-none">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium leading-tight">
                {user.name || "Usuario"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56 mb-1">
            <div className="px-3 py-2">
              <p className="text-sm font-medium">{user.name || "Usuario"}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              <Badge variant="secondary" className="mt-1.5 text-xs capitalize">
                {user.role === "admin" ? "Administrador" : "Negocio"}
              </Badge>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/profile" />}>
              <UserIcon className="mr-2 h-4 w-4" />
              Mi Perfil
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

// ─── NavGroup ─────────────────────────────────────────────────────────────────

function NavGroup({
  label,
  items,
  isActive,
}: {
  label?: string;
  items: { href: string; label: string; icon: LucideIcon }[];
  isActive: (href: string) => boolean;
}) {
  return (
    <SidebarGroup className="px-3 py-2">
      {label && (
        <SidebarGroupLabel className="px-1 mb-1 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = isActive(item.href);
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={active}
                  render={<Link href={item.href} />}
                  className="h-9 gap-3 rounded-lg px-3"
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="font-medium">{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
