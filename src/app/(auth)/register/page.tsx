import { isInvitationsEnabled } from "@/lib/invitations";
import { RegisterForm } from "./register-form";

type Props = { searchParams: Promise<{ invite?: string }> };

export default async function RegisterPage({ searchParams }: Props) {
  const { invite } = await searchParams;
  const invitationsEnabled = isInvitationsEnabled();

  return <RegisterForm inviteCode={invite} invitationsEnabled={invitationsEnabled} />;
}
