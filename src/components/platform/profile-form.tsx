"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateProfile } from "@/actions/update-profile";

interface ProfileFormProps {
  name: string;
  email: string;
  role: string;
  plan: string;
  createdAt: string;
}

export function ProfileForm({
  name: initialName,
  email: initialEmail,
  role,
  plan,
  createdAt,
}: ProfileFormProps) {
  const { update: updateSession } = useSession();
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [saving, setSaving] = useState(false);

  const hasChanges = name !== initialName || email !== initialEmail;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const result = await updateProfile({ name, email });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Perfil actualizado");
        await updateSession();
      }
    } catch {
      toast.error("Error al actualizar el perfil");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Rol</Label>
          <Input
            value={role === "admin" ? "Administrador" : "Dueño de negocio"}
            disabled
          />
        </div>
        <div className="space-y-2">
          <Label>Plan</Label>
          <Input value={plan.toUpperCase()} disabled />
        </div>
        <div className="space-y-2">
          <Label>Miembro desde</Label>
          <Input value={createdAt} disabled />
        </div>
      </div>
      {hasChanges && (
        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      )}
    </form>
  );
}
