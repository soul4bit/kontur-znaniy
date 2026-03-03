import { extractAuthErrorMessage } from "@/lib/auth/messages";

type AuthSuccessResponse = {
  status?: string;
  message?: string;
};

export async function postAuth(path: string, payload: Record<string, unknown>) {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const rawText = await response.text();
  let result: unknown = null;

  if (rawText) {
    try {
      result = JSON.parse(rawText);
    } catch {
      result = { message: rawText };
    }
  }

  if (!response.ok) {
    throw new Error(extractAuthErrorMessage(result) ?? `HTTP_${response.status}`);
  }

  return (result ?? {}) as AuthSuccessResponse;
}

export function getAbsoluteUrl(path: string) {
  if (typeof window === "undefined") {
    return path;
  }

  return new URL(path, window.location.origin).toString();
}

export function createGuardState() {
  return {
    startedAt: Date.now(),
    website: "",
  };
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isStrongPassword(password: string) {
  return (
    password.length >= 10 &&
    password.length <= 128 &&
    /\p{L}/u.test(password) &&
    /\d/.test(password)
  );
}
