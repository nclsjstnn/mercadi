import { z } from "zod";

export const inviteCollaboratorSchema = z.object({
  email: z.string().email("Email invalido").transform((v) => v.toLowerCase()),
});
