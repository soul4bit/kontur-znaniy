export type AuthMode = "sign-in" | "sign-up" | "reset";

export type PendingAction = "sign-in" | "sign-up" | "reset" | "resend" | null;

export type GuardAction = "sign-in" | "sign-up" | "reset" | "resend";

export type GuardState = {
  startedAt: number;
  website: string;
};
