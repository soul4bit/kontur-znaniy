import { type NextRequest } from "next/server";
import {
  handleGuardedAuthRequest,
  validateSignUpPayload,
} from "@/lib/auth/guard";

export async function POST(request: NextRequest) {
  return handleGuardedAuthRequest(request, {
    action: "sign-up",
    targetPath: "/sign-up/email",
    validate: validateSignUpPayload,
  });
}
