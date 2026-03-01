import { type NextRequest } from "next/server";
import {
  handleGuardedAuthRequest,
  validateVerificationResendPayload,
} from "@/lib/auth/guard";

export async function POST(request: NextRequest) {
  return handleGuardedAuthRequest(request, {
    action: "verification-resend",
    targetPath: "/send-verification-email",
    validate: validateVerificationResendPayload,
  });
}
