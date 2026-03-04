"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BadgeCheck,
  Clock3,
  LoaderCircle,
  LogIn,
  Mail,
  RotateCcw,
  ShieldCheck,
  UserPlus2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedbackBanner } from "@/components/auth/forms/feedback-banner";
import { ResetForm } from "@/components/auth/forms/reset-form";
import { SignInForm } from "@/components/auth/forms/sign-in-form";
import { SignUpForm } from "@/components/auth/forms/sign-up-form";
import {
  createGuardState,
  getAbsoluteUrl,
  isStrongPassword,
  isValidEmail,
  postAuth,
} from "@/components/auth/forms/helpers";
import { type AuthMode, type GuardAction, type GuardState, type PendingAction } from "@/components/auth/forms/types";
import {
  extractAuthErrorMessage,
  getAuthErrorMessage,
  getQueryAuthFeedback,
  type AuthFeedback,
} from "@/lib/auth/messages";

const modeMeta = {
  "sign-in": {
    badge: "режим входа",
    title: "Войти в Контур Знаний",
    description: "Быстрый вход по email и паролю без лишних шагов.",
    label: "Вход",
    icon: LogIn,
  },
  "sign-up": {
    badge: "режим регистрации",
    title: "Запросить доступ",
    description: "Новый аккаунт проходит модерацию, после чего активируется по email.",
    label: "Регистрация",
    icon: UserPlus2,
  },
  reset: {
    badge: "режим восстановления",
    title: "Сбросить пароль",
    description: "Отправим письмо со ссылкой для безопасного восстановления доступа.",
    label: "Сброс",
    icon: RotateCcw,
  },
} as const;

const modeFlow = {
  "sign-in": [
    {
      title: "Введите учетные данные",
      text: "Email и пароль действующего аккаунта.",
      icon: BadgeCheck,
    },
    {
      title: "Проверка guard-слоя",
      text: "Rate limit и anti-bot защита перед входом.",
      icon: ShieldCheck,
    },
    {
      title: "Переход в workspace",
      text: "После проверки открывается рабочая база знаний.",
      icon: Clock3,
    },
  ],
  "sign-up": [
    {
      title: "Отправка заявки",
      text: "Заполняете форму и отправляете запрос.",
      icon: BadgeCheck,
    },
    {
      title: "Решение модератора",
      text: "Админ подтверждает заявку через модерацию.",
      icon: ShieldCheck,
    },
    {
      title: "Активация аккаунта",
      text: "Подтверждаете email и входите обычным способом.",
      icon: Clock3,
    },
  ],
  reset: [
    {
      title: "Запрос письма",
      text: "Отправляем одноразовую ссылку на email.",
      icon: BadgeCheck,
    },
    {
      title: "Проверка токена",
      text: "Ссылка ограничена по времени и безопасности.",
      icon: ShieldCheck,
    },
    {
      title: "Новый пароль",
      text: "Сохраняете пароль и входите обратно в систему.",
      icon: Clock3,
    },
  ],
} as const;

function nextModeFromQuery(rawMode: string | null): AuthMode {
  if (rawMode === "sign-up" || rawMode === "reset") {
    return rawMode;
  }

  return "sign-in";
}

export function AuthForms() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryFeedback = useMemo(() => getQueryAuthFeedback(searchParams), [searchParams]);
  const requestedMode = searchParams.get("mode");

  const [mode, setMode] = useState<AuthMode>(nextModeFromQuery(requestedMode));
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [feedback, setFeedback] = useState<AuthFeedback | null>(null);
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [lastEmail, setLastEmail] = useState("");
  const [guards, setGuards] = useState<Record<GuardAction, GuardState>>({
    "sign-in": createGuardState(),
    "sign-up": createGuardState(),
    reset: createGuardState(),
    resend: createGuardState(),
  });
  const [signInForm, setSignInForm] = useState({
    email: "",
    password: "",
  });
  const [signUpForm, setSignUpForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [resetEmail, setResetEmail] = useState("");

  useEffect(() => {
    setMode(nextModeFromQuery(requestedMode));
  }, [requestedMode]);

  const activeMeta = modeMeta[mode];
  const activeFeedback = feedback ?? queryFeedback;
  const resendEmail = lastEmail || signInForm.email || signUpForm.email || resetEmail;

  function updateGuard(action: GuardAction, patch: Partial<GuardState>) {
    setGuards((currentState) => ({
      ...currentState,
      [action]: {
        ...currentState[action],
        ...patch,
      },
    }));
  }

  function resetGuard(action: GuardAction) {
    setGuards((currentState) => ({
      ...currentState,
      [action]: createGuardState(),
    }));
  }

  function openMode(nextMode: AuthMode) {
    setMode(nextMode);
    setFeedback(null);
    setAwaitingVerification(false);
    if (nextMode === "sign-in") {
      resetGuard("sign-in");
    } else if (nextMode === "sign-up") {
      resetGuard("sign-up");
    } else {
      resetGuard("reset");
    }
  }

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
      await postAuth("/api/auth-guard/sign-in", {
        email,
        password,
        ...guards["sign-in"],
      });
      router.replace("/app");
      router.refresh();
    } catch (error) {
      const message = extractAuthErrorMessage(error);

      if (message === "Email not verified") {
        setAwaitingVerification(true);
        setLastEmail(email);
        setFeedback({
          tone: "info",
          text: "Email еще не подтвержден. Запросите письмо повторно и активируйте аккаунт.",
        });
      } else {
        setFeedback({
          tone: "error",
          text: getAuthErrorMessage(message),
        });
      }
    } finally {
      setPendingAction(null);
      resetGuard("sign-in");
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

    if (!isStrongPassword(password)) {
      setFeedback({
        tone: "error",
        text: "Пароль должен быть от 10 до 128 символов и содержать буквы и цифры.",
      });
      return;
    }

    setPendingAction("sign-up");
    setFeedback(null);
    setAwaitingVerification(false);

    try {
      const result = await postAuth("/api/auth-guard/sign-up", {
        name,
        email,
        password,
        callbackURL: getAbsoluteUrl("/app"),
        ...guards["sign-up"],
      });

      setLastEmail(email);
      setMode("sign-in");
      setSignInForm({ email, password: "" });
      setSignUpForm({ name: "", email: "", password: "", confirmPassword: "" });
      setFeedback({
        tone: "success",
        text:
          result.message ??
          "Заявка отправлена. После одобрения подтвердите email и войдите в систему.",
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        text: getAuthErrorMessage(extractAuthErrorMessage(error)),
      });
    } finally {
      setPendingAction(null);
      resetGuard("sign-up");
    }
  }

  async function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = resetEmail.trim();

    if (!email || !isValidEmail(email)) {
      setFeedback({ tone: "error", text: "Введите корректный email." });
      return;
    }

    setPendingAction("reset");
    setFeedback(null);

    try {
      await postAuth("/api/auth-guard/request-password-reset", {
        email,
        redirectTo: getAbsoluteUrl("/auth/reset-password"),
        ...guards.reset,
      });
      setLastEmail(email);
      setFeedback({
        tone: "info",
        text: `Если адрес ${email} есть в системе, мы отправили письмо для сброса пароля.`,
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        text: getAuthErrorMessage(extractAuthErrorMessage(error)),
      });
    } finally {
      setPendingAction(null);
      resetGuard("reset");
    }
  }

  async function handleResendVerification() {
    const email = resendEmail.trim();

    if (!email || !isValidEmail(email)) {
      setFeedback({
        tone: "error",
        text: "Сначала укажите корректный email, на который нужно отправить письмо.",
      });
      return;
    }

    setPendingAction("resend");
    setFeedback(null);

    try {
      await postAuth("/api/auth-guard/send-verification-email", {
        email,
        callbackURL: getAbsoluteUrl("/app"),
        ...guards.resend,
      });
      setFeedback({
        tone: "success",
        text: `Письмо подтверждения отправлено на ${email}.`,
      });
      setAwaitingVerification(false);
    } catch (error) {
      setFeedback({
        tone: "error",
        text: getAuthErrorMessage(extractAuthErrorMessage(error)),
      });
    } finally {
      setPendingAction(null);
      resetGuard("resend");
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <span className="nook-kicker">контур доступа</span>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Авторизация и регистрация</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Выберите сценарий и выполните его в одном экране без переходов по разным страницам.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {(Object.keys(modeMeta) as AuthMode[]).map((option) => {
          const Icon = modeMeta[option].icon;
          const selected = mode === option;

          return (
            <button
              key={option}
              type="button"
              className={`rounded-2xl border px-3 py-3 text-left transition ${
                selected
                  ? "border-primary/70 bg-primary/10 shadow-[0_10px_20px_rgba(29,40,34,0.1)]"
                  : "border-border bg-card/80 hover:border-primary/45"
              }`}
              onClick={() => {
                openMode(option);
                if (option === "sign-up") {
                  setSignUpForm((currentValue) => ({
                    ...currentValue,
                    email: signInForm.email || currentValue.email,
                  }));
                }
                if (option === "reset") {
                  setResetEmail(signInForm.email || resetEmail);
                }
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex size-7 items-center justify-center rounded-lg border ${
                    selected ? "border-primary/40 bg-primary/15 text-primary" : "border-border bg-muted text-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                </span>
                <span className="text-sm font-semibold text-foreground">{modeMeta[option].label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {activeFeedback ? <FeedbackBanner feedback={activeFeedback} /> : null}

      <section className="nook-panel rounded-2xl p-4 sm:p-5">
        <div className="space-y-2">
          <span className="nook-kicker">{activeMeta.badge}</span>
          <h3 className="text-xl font-semibold tracking-tight text-foreground">{activeMeta.title}</h3>
          <p className="text-sm leading-6 text-muted-foreground">{activeMeta.description}</p>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.18fr_0.82fr]">
          <div className="order-2 lg:order-1">
            {awaitingVerification ? (
              <div className="mb-4 nook-panel-soft rounded-xl p-4 text-sm leading-6 text-muted-foreground">
                <p>
                  Подтвердите email <strong className="text-foreground">{resendEmail || "вашего аккаунта"}</strong>,
                  чтобы завершить активацию.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 w-full"
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
            ) : null}

            {mode === "sign-in" ? (
              <SignInForm
                email={signInForm.email}
                password={signInForm.password}
                guardWebsite={guards["sign-in"].website}
                isPending={pendingAction === "sign-in"}
                onEmailChange={(value) => setSignInForm((currentValue) => ({ ...currentValue, email: value }))}
                onPasswordChange={(value) =>
                  setSignInForm((currentValue) => ({ ...currentValue, password: value }))
                }
                onGuardWebsiteChange={(value) => updateGuard("sign-in", { website: value })}
                onSubmit={handleSignIn}
                onForgotPassword={() => {
                  openMode("reset");
                  setResetEmail(signInForm.email);
                }}
                onOpenSignUp={() => {
                  openMode("sign-up");
                  setSignUpForm((currentValue) => ({
                    ...currentValue,
                    email: signInForm.email || currentValue.email,
                  }));
                }}
              />
            ) : null}

            {mode === "sign-up" ? (
              <SignUpForm
                name={signUpForm.name}
                email={signUpForm.email}
                password={signUpForm.password}
                confirmPassword={signUpForm.confirmPassword}
                guardWebsite={guards["sign-up"].website}
                isPending={pendingAction === "sign-up"}
                onNameChange={(value) => setSignUpForm((currentValue) => ({ ...currentValue, name: value }))}
                onEmailChange={(value) => setSignUpForm((currentValue) => ({ ...currentValue, email: value }))}
                onPasswordChange={(value) =>
                  setSignUpForm((currentValue) => ({ ...currentValue, password: value }))
                }
                onConfirmPasswordChange={(value) =>
                  setSignUpForm((currentValue) => ({ ...currentValue, confirmPassword: value }))
                }
                onGuardWebsiteChange={(value) => updateGuard("sign-up", { website: value })}
                onSubmit={handleSignUp}
                onBackToSignIn={() => {
                  openMode("sign-in");
                  setSignInForm((currentValue) => ({
                    ...currentValue,
                    email: signUpForm.email || currentValue.email,
                  }));
                }}
              />
            ) : null}

            {mode === "reset" ? (
              <ResetForm
                email={resetEmail}
                guardWebsite={guards.reset.website}
                isPending={pendingAction === "reset"}
                onEmailChange={setResetEmail}
                onGuardWebsiteChange={(value) => updateGuard("reset", { website: value })}
                onSubmit={handleReset}
                onBackToSignIn={() => {
                  openMode("sign-in");
                  setSignInForm((currentValue) => ({
                    ...currentValue,
                    email: resetEmail || currentValue.email,
                  }));
                }}
              />
            ) : null}
          </div>

          <aside className="order-1 nook-panel-soft rounded-2xl p-4 lg:order-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Как это работает</p>
            <div className="mt-3 space-y-2.5">
              {modeFlow[mode].map((step, index) => (
                <div key={step.title} className="rounded-xl border border-border bg-card/80 px-3 py-2.5">
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 inline-flex size-7 items-center justify-center rounded-lg border border-border bg-muted">
                      <step.icon className="size-3.5 text-primary" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {index + 1}. {step.title}
                      </p>
                      <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{step.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-xl border border-dashed border-border bg-card/70 px-3 py-2.5 text-xs leading-5 text-muted-foreground">
              Все заявки на регистрацию проходят модерацию, поэтому доступ остается управляемым.
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
