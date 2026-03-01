import { type NextRequest } from "next/server";
import {
  handleGuardedAuthRequest,
  validateSignInPayload,
} from "@/lib/auth/guard";

export async function POST(request: NextRequest) {
  return handleGuardedAuthRequest(request, {
    action: "sign-in",
    targetPath: "/sign-in/email",
    validate: validateSignInPayload,
  });
}
