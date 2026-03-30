import crypto from "crypto";

/** Feature flag — set INVITATIONS_ENABLED=true in env to require invites */
export function isInvitationsEnabled(): boolean {
  return process.env.INVITATIONS_ENABLED === "true";
}

/** Generate a cryptographically random invite code */
export function generateInviteCode(): string {
  return crypto.randomBytes(24).toString("hex");
}

/** Invite links expire after 7 days */
export function inviteExpiresAt(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d;
}

export function isInviteExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}
