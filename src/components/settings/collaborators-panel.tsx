"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  inviteCollaborator,
  revokeCollaborator,
  cancelInvite,
} from "@/actions/collaborators";
import { Copy, Check, Trash2, X, Sparkles, Loader2 } from "lucide-react";

interface Collaborator {
  _id: string;
  name: string;
  email: string;
}

interface PendingInvite {
  _id: string;
  invitedEmail: string;
  token: string;
  expiresAt: string;
}

interface CollaboratorsPanelProps {
  collaborators: Collaborator[];
  pendingInvites: PendingInvite[];
  isPro: boolean;
  maxCollaborators: number;
}

export function CollaboratorsPanel({
  collaborators,
  pendingInvites,
  isPro,
  maxCollaborators,
}: CollaboratorsPanelProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInviteLink("");
    setLoading(true);
    try {
      const result = await inviteCollaborator(email);
      if (result.error) {
        setError(result.error);
      } else if (result.inviteLink) {
        setInviteLink(result.inviteLink);
        setEmail("");
      }
    } catch {
      setError("Error al enviar la invitacion");
    }
    setLoading(false);
  }

  async function handleRevoke(userId: string) {
    await revokeCollaborator(userId);
  }

  async function handleCancelInvite(inviteId: string) {
    await cancelInvite(inviteId);
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  if (!isPro) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center">
        <Sparkles className="h-8 w-8 text-muted-foreground" />
        <div>
          <p className="font-medium">Colaboradores no disponible</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Upgrade a Pro para invitar hasta 5 colaboradores a tu negocio.
          </p>
        </div>
        <a href="/plans">
          <Button variant="outline">Upgrade a Pro</Button>
        </a>
      </div>
    );
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const totalUsed = collaborators.length + pendingInvites.length;

  return (
    <div className="space-y-6">
      {/* Invite form */}
      <div>
        <h4 className="mb-3 text-sm font-medium">
          Invitar colaborador ({totalUsed}/{maxCollaborators})
        </h4>
        <form onSubmit={handleInvite} className="flex gap-2">
          <Input
            type="email"
            placeholder="email@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || totalUsed >= maxCollaborators}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={loading || !email || totalUsed >= maxCollaborators}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Invitar"}
          </Button>
        </form>
        {error && (
          <p className="mt-2 text-sm text-destructive">{error}</p>
        )}
        {inviteLink && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
            <code className="flex-1 truncate text-xs">{inviteLink}</code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(inviteLink, "new")}
            >
              {copied === "new" ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Current collaborators */}
      {collaborators.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-medium">Colaboradores activos</h4>
          <div className="space-y-2">
            {collaborators.map((collab) => (
              <div
                key={collab._id}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{collab.name}</p>
                  <p className="text-xs text-muted-foreground">{collab.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRevoke(collab._id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Revocar
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-medium">Invitaciones pendientes</h4>
          <div className="space-y-2">
            {pendingInvites.map((invite) => (
              <div
                key={invite._id}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{invite.invitedEmail}</p>
                  <p className="text-xs text-muted-foreground">
                    Expira: {new Date(invite.expiresAt).toLocaleDateString("es-CL")}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        `${baseUrl}/invite/${invite.token}`,
                        invite._id
                      )
                    }
                  >
                    {copied === invite._id ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancelInvite(invite._id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {collaborators.length === 0 && pendingInvites.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Aun no tienes colaboradores. Invita a alguien usando el formulario de arriba.
        </p>
      )}
    </div>
  );
}
