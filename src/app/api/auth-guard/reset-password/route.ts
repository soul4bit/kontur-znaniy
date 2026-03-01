import { type NextRequest } from "next/server";
import {
  handleGuardedAuthRequest,
  validateResetPasswordPayload,
} from "@/lib/auth/guard";

export async function POST(request: NextRequest) {
  return handleGuardedAuthRequest(request, {
    action: "password-reset",
    targetPath: "/reset-password",
    validate: validateResetPasswordPayload,
  });
}
