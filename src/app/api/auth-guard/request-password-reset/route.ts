import { type NextRequest } from "next/server";
import {
  handleGuardedAuthRequest,
  validatePasswordResetRequestPayload,
} from "@/lib/auth/guard";

export async function POST(request: NextRequest) {
  return handleGuardedAuthRequest(request, {
    action: "password-reset-request",
    targetPath: "/request-password-reset",
    validate: validatePasswordResetRequestPayload,
  });
}
