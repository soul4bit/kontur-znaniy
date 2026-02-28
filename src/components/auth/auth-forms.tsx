"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, KeyRound, LoaderCircle, Mail, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  extractAuthErrorMessage,
  getAuthErrorMessage,
  getQueryAuthFeedback,
  type AuthFeedback,
} from "@/lib/auth/messages";

type AuthMode = "sign-in" | "sign-up" | "reset";
type PendingAction = "sign-in" | "sign-up" | "reset" | "resend" | null;

async function postAuth(path: string, payload: Record<string, unknown>) {
  const response = await fetch(`/api/auth${path}`, {
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

  return result;
}

function getAbsoluteUrl(path: string) {
  if (typeof window === "undefined") {
    return path;
  }

  return new URL(path, window.location.origin).toString();
}

function FeedbackBanner({ feedback }: { feedback: AuthFeedback }) {
  const toneClass =
    feedback.tone === "error"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : feedback.tone === "success"
        ? "border-slate-200 bg-[#edf3ef] text-teal-700"
        : "border-sky-200 bg-sky-50 text-sky-700";

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${toneClass}`}>
      {feedback.text}
    </div>
  );
}

export function AuthForms() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryFeedback = useMemo(() => getQueryAuthFeedback(searchParams), [searchParams]);
  const requestedMode = searchParams.get("mode");

  const [mode, setMode] = useState<AuthMode>(
    requestedMode === "sign-up" || requestedMode === "reset" ? requestedMode : "sign-in"
  );
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [feedback, setFeedback] = useState<AuthFeedback | null>(null);
  const [lastEmail, setLastEmail] = useState("");
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [signInForm, setSignInForm] = useState({ email: "", password: "" });
  const [signUpForm, setSignUpForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [resetEmail, setResetEmail] = useState("");

  const activeFeedback = feedback ?? queryFeedback;
  const resendEmail = lastEmail || signInForm.email || signUpForm.email || resetEmail;
  const title =
    mode === "sign-in"
      ? "Войти"
      : mode === "sign-up"
        ? "Регистрация"
        : "Сброс пароля";
  const description =
    mode === "sign-in"
      ? "Введите email и пароль, чтобы открыть свои заметки."
      : mode === "sign-up"
        ? "Создайте аккаунт и подтвердите email из письма."
        : "Отправим ссылку для сброса пароля на вашу почту.";

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const email = signInForm.email.trim();
    const password = signInForm.password;

    if (!email || !password) {
      setFeedback({ tone: "error", text: "Введите email и пароль." });
      return;
    }

    setPendingAction("sign-in");
    setFeedback(null);

    try {
      await postAuth("/sign-in/email", { email, password });
      router.replace("/app");
      router.refresh();
    } catch (error) {
      const message = extractAuthErrorMessage(error);

      if (message === "Email not verified") {
        setAwaitingVerification(true);
        setLastEmail(email);
        setFeedback({
          tone: "info",
          text: "Email еще не подтвержден. Отправьте письмо повторно и активируйте аккаунт.",
        });
      } else {
        setFeedback({ tone: "error", text: getAuthErrorMessage(message) });
      }
    } finally {
      setPendingAction(null);
    }
  }

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = signUpForm.name.trim();
    const email = signUpForm.email.trim();
    const password = signUpForm.password;
    const confirmPassword = signUpForm.confirmPassword;

    if (!name || !email || !password || !confirmPassword) {
      setFeedback({ tone: "error", text: "Заполните имя, email и пароль." });
      return;
    }

    if (password !== confirmPassword) {
      setFeedback({ tone: "error", text: "Пароли не совпадают." });
      return;
    }

    if (password.length < 8) {
      setFeedback({ tone: "error", text: "Пароль должен быть не короче 8 символов." });
      return;
    }

    setPendingAction("sign-up");
    setFeedback(null);

    try {
      await postAuth("/sign-up/email", {
        name,
        email,
        password,
        callbackURL: getAbsoluteUrl("/app"),
      });

      setAwaitingVerification(true);
      setLastEmail(email);
      setMode("sign-in");
      setSignInForm({ email, password: "" });
      setSignUpForm({ name: "", email: "", password: "", confirmPassword: "" });
      setFeedback({
        tone: "success",
        text: `Аккаунт создан. Мы отправили письмо на ${email}. Подтвердите адрес и затем войдите.`,
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        text: getAuthErrorMessage(extractAuthErrorMessage(error)),
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const email = resetEmail.trim();

    if (!email) {
      setFeedback({ tone: "error", text: "Введите email, на который отправить ссылку." });
      return;
    }

    setPendingAction("reset");
    setFeedback(null);

    try {
      await postAuth("/request-password-reset", {
        email,
        redirectTo: getAbsoluteUrl("/auth/reset-password"),
      });
      setLastEmail(email);
      setFeedback({
        tone: "info",
        text: `Если адрес ${email} существует в системе, мы отправили письмо со ссылкой для сброса пароля.`,
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        text: getAuthErrorMessage(extractAuthErrorMessage(error)),
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function handleResendVerification() {
    const email = resendEmail.trim();

    if (!email) {
      setFeedback({
        tone: "error",
        text: "Сначала укажите email, на который нужно отправить письмо.",
      });
      return;
    }

    setPendingAction("resend");
    setFeedback(null);

    try {
      await postAuth("/send-verification-email", {
        email,
        callbackURL: getAbsoluteUrl("/app"),
      });
      setAwaitingVerification(true);
      setLastEmail(email);
      setFeedback({ tone: "success", text: `Новое письмо отправлено на ${email}.` });
    } catch (error) {
      setFeedback({
        tone: "error",
        text: getAuthErrorMessage(extractAuthErrorMessage(error)),
      });
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <Card className="overflow-hidden rounded-[32px] border-slate-200 bg-white/92 shadow-[0_30px_80px_rgba(39,70,63,0.1)] backdrop-blur">
      <CardHeader className="gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-3">
          <div className="inline-flex rounded-full border border-slate-200 bg-[#edf3ef] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">
            {mode === "sign-in" ? "sign in" : mode === "sign-up" ? "sign up" : "reset access"}
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl text-slate-900">{title}</CardTitle>
            <CardDescription className="max-w-md text-sm leading-6 text-slate-600">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-6">
        {activeFeedback ? <FeedbackBanner feedback={activeFeedback} /> : null}

        {awaitingVerification ? (
          <div className="rounded-[24px] border border-slate-200 bg-[#edf3ef] p-4 text-sm leading-6 text-slate-700">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-10 items-center justify-center rounded-2xl bg-white text-teal-700 shadow-sm">
                <Mail className="size-4" />
              </div>
              <div className="space-y-3">
                <p>
                  Подтвердите email <strong>{resendEmail || "вашего аккаунта"}</strong>, чтобы закончить регистрацию.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl border-slate-200 bg-white text-slate-900 hover:bg-[#f5f8f5]"
                  onClick={handleResendVerification}
                  disabled={pendingAction === "resend"}
                >
                  {pendingAction === "resend" ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />
                      Отправляем письмо...
                    </>
                  ) : (
                    <>
                      <Mail className="size-4" />
                      Отправить письмо еще раз
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {mode === "sign-in" ? (
          <>
            <form className="space-y-4" onSubmit={handleSignIn}>
              <div className="space-y-1.5">
                <label htmlFor="signin-email" className="text-sm font-medium text-slate-900">
                  Email
                </label>
                <Input
                  id="signin-email"
                  name="email"
                  type="email"
                  value={signInForm.email}
                  onChange={(event) =>
                    setSignInForm((current) => ({ ...current, email: event.target.value }))
                  }
                  placeholder="you@wiki-soul4bit.ru"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="signin-password" className="text-sm font-medium text-slate-900">
                    Пароль
                  </label>
                  <button
                    type="button"
                    className="text-xs font-medium text-teal-700 hover:text-slate-900"
                    onClick={() => {
                      setMode("reset");
                      setFeedback(null);
                      setResetEmail(signInForm.email);
                    }}
                  >
                    Забыли пароль?
                  </button>
                </div>
                <Input
                  id="signin-password"
                  name="password"
                  type="password"
                  value={signInForm.password}
                  onChange={(event) =>
                    setSignInForm((current) => ({ ...current, password: event.target.value }))
                  }
                  placeholder="Введите пароль"
                  autoComplete="current-password"
                  required
                />
              </div>

              <Button
                type="submit"
                className="h-11 w-full rounded-2xl"
                disabled={pendingAction === "sign-in"}
              >
                {pendingAction === "sign-in" ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Входим...
                  </>
                ) : (
                  <>
                    <KeyRound className="size-4" />
                    Войти
                  </>
                )}
              </Button>
            </form>

            <div className="rounded-[24px] border border-slate-200 bg-[#f4f7f4] p-4">
              <p className="text-sm font-medium text-slate-900">Нет аккаунта?</p>
              <Button
                type="button"
                variant="outline"
                className="mt-4 w-full rounded-2xl border-slate-200 bg-white text-slate-900 hover:bg-[#f5f8f5]"
                onClick={() => {
                  setMode("sign-up");
                  setFeedback(null);
                  setSignUpForm((current) => ({
                    ...current,
                    email: signInForm.email || current.email,
                  }));
                }}
              >
                <UserPlus className="size-4" />
                Зарегистрироваться
              </Button>
            </div>
          </>
        ) : null}

        {mode === "sign-up" ? (
          <>
            <form className="space-y-4" onSubmit={handleSignUp}>
              <div className="space-y-1.5">
                <label htmlFor="signup-name" className="text-sm font-medium text-slate-900">
                  Имя
                </label>
                <Input
                  id="signup-name"
                  name="name"
                  value={signUpForm.name}
                  onChange={(event) =>
                    setSignUpForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Как к вам обращаться"
                  autoComplete="name"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="signup-email" className="text-sm font-medium text-slate-900">
                  Email
                </label>
                <Input
                  id="signup-email"
                  name="email"
                  type="email"
                  value={signUpForm.email}
                  onChange={(event) =>
                    setSignUpForm((current) => ({ ...current, email: event.target.value }))
                  }
                  placeholder="you@wiki-soul4bit.ru"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="signup-password" className="text-sm font-medium text-slate-900">
                    Пароль
                  </label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    value={signUpForm.password}
                    onChange={(event) =>
                      setSignUpForm((current) => ({ ...current, password: event.target.value }))
                    }
                    placeholder="Минимум 8 символов"
                    autoComplete="new-password"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="signup-password-repeat"
                    className="text-sm font-medium text-slate-900"
                  >
                    Повторите пароль
                  </label>
                  <Input
                    id="signup-password-repeat"
                    name="confirmPassword"
                    type="password"
                    value={signUpForm.confirmPassword}
                    onChange={(event) =>
                      setSignUpForm((current) => ({
                        ...current,
                        confirmPassword: event.target.value,
                      }))
                    }
                    placeholder="Повторите пароль"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="h-11 w-full rounded-2xl"
                disabled={pendingAction === "sign-up"}
              >
                {pendingAction === "sign-up" ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Создаем аккаунт...
                  </>
                ) : (
                  <>
                    <UserPlus className="size-4" />
                    Создать аккаунт
                  </>
                )}
              </Button>
            </form>

            <Button
              type="button"
              variant="ghost"
              className="w-full rounded-2xl text-slate-700 hover:bg-[#edf3ef]"
              onClick={() => {
                setMode("sign-in");
                setFeedback(null);
                setSignInForm((current) => ({
                  ...current,
                  email: signUpForm.email || current.email,
                }));
              }}
            >
              <ArrowLeft className="size-4" />
              Уже есть аккаунт? Вернуться ко входу
            </Button>
          </>
        ) : null}

        {mode === "reset" ? (
          <>
            <form className="space-y-4" onSubmit={handleReset}>
              <div className="space-y-1.5">
                <label htmlFor="reset-email" className="text-sm font-medium text-slate-900">
                  Email для восстановления
                </label>
                <Input
                  id="reset-email"
                  name="email"
                  type="email"
                  value={resetEmail}
                  onChange={(event) => setResetEmail(event.target.value)}
                  placeholder="you@wiki-soul4bit.ru"
                  autoComplete="email"
                  required
                />
              </div>
              <Button
                type="submit"
                className="h-11 w-full rounded-2xl"
                disabled={pendingAction === "reset"}
              >
                {pendingAction === "reset" ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Отправляем ссылку...
                  </>
                ) : (
                  <>
                    <Mail className="size-4" />
                    Отправить ссылку
                  </>
                )}
              </Button>
            </form>

            <Button
              type="button"
              variant="ghost"
              className="w-full rounded-2xl text-slate-700 hover:bg-[#edf3ef]"
              onClick={() => {
                setMode("sign-in");
                setFeedback(null);
                setSignInForm((current) => ({
                  ...current,
                  email: resetEmail || current.email,
                }));
              }}
            >
              <ArrowLeft className="size-4" />
              Вернуться ко входу
            </Button>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}


