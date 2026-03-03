"use client";

import { type FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle, KeyRound, LoaderCircle } from "lucide-react";
import { FeedbackBanner } from "@/components/auth/forms/feedback-banner";
import { BotTrap, PasswordField } from "@/components/auth/forms/form-fields";
import { isStrongPassword, postAuth } from "@/components/auth/forms/helpers";
import { Button } from "@/components/ui/button";
import { extractAuthErrorMessage, getAuthErrorMessage, type AuthFeedback } from "@/lib/auth/messages";

type ResetPasswordFormProps = {
  token: string | null;
  error: string | null;
};

export function ResetPasswordForm({ token, error }: ResetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [feedback, setFeedback] = useState<AuthFeedback | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [website, setWebsite] = useState("");

  const invalidLink = !token || error === "INVALID_TOKEN";

  const passwordChecks = useMemo(() => {
    const hasLetters = /\p{L}/u.test(password);
    const hasDigit = /\d/.test(password);

    return [
      {
        id: "length",
        text: "10-128 символов",
        passed: password.length >= 10 && password.length <= 128,
      },
      {
        id: "letters",
        text: "Есть буквы",
        passed: hasLetters,
      },
      {
        id: "digits",
        text: "Есть цифры",
        passed: hasDigit,
      },
      {
        id: "match",
        text: "Пароли совпадают",
        passed: confirmPassword.length > 0 && password === confirmPassword,
      },
    ];
  }, [confirmPassword, password]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setFeedback({ tone: "error", text: "Ссылка для сброса недействительна." });
      return;
    }

    if (!password || !confirmPassword) {
      setFeedback({
        tone: "error",
        text: "Введите новый пароль и повторите его.",
      });
      return;
    }

    if (password !== confirmPassword) {
      setFeedback({
        tone: "error",
        text: "Пароли не совпадают.",
      });
      return;
    }

    if (!isStrongPassword(password)) {
      setFeedback({
        tone: "error",
        text: "Пароль должен быть от 10 до 128 символов и содержать буквы и цифры.",
      });
      return;
    }

    setIsPending(true);
    setFeedback(null);

    try {
      await postAuth("/api/auth-guard/reset-password", {
        token,
        newPassword: password,
        startedAt,
        website,
      });

      router.replace("/auth?mode=sign-in&reset=success");
      router.refresh();
    } catch (submitError) {
      setFeedback({
        tone: "error",
        text: getAuthErrorMessage(extractAuthErrorMessage(submitError)),
      });
    } finally {
      setIsPending(false);
      setStartedAt(Date.now());
      setWebsite("");
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <span className="nook-kicker">безопасная смена пароля</span>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Новый пароль</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Установите новый пароль для аккаунта и вернитесь к обычному входу.
        </p>
      </div>

      {feedback ? <FeedbackBanner feedback={feedback} /> : null}

      {invalidLink ? (
        <div className="space-y-4">
          <FeedbackBanner
            feedback={{
              tone: "error",
              text: "Ссылка уже недействительна. Запросите новое письмо для сброса пароля.",
            }}
          />
          <Button asChild variant="outline" className="w-full">
            <Link href="/auth?mode=reset">Вернуться к форме сброса</Link>
          </Button>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <BotTrap value={website} onChange={(event) => setWebsite(event.target.value)} />

          <PasswordField
            id="reset-password"
            label="Новый пароль"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Минимум 10 символов"
            autoComplete="new-password"
            required
          />

          <PasswordField
            id="reset-password-confirm"
            label="Повторите пароль"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Повторите пароль"
            autoComplete="new-password"
            required
          />

          <div className="nook-panel-soft rounded-xl p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Проверка пароля
            </p>
            <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {passwordChecks.map((check) => (
                <div key={check.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                  {check.passed ? (
                    <CheckCircle2 className="size-4 text-emerald-400" />
                  ) : (
                    <Circle className="size-4 text-muted-foreground/75" />
                  )}
                  <span className={check.passed ? "text-foreground" : ""}>{check.text}</span>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" className="h-11 w-full" disabled={isPending}>
            {isPending ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Сохраняем пароль...
              </>
            ) : (
              <>
                <KeyRound className="size-4" />
                Сохранить новый пароль
              </>
            )}
          </Button>

          <Button asChild type="button" variant="ghost" className="w-full">
            <Link href="/auth">
              <ArrowLeft className="size-4" />
              Назад ко входу
            </Link>
          </Button>
        </form>
      )}
    </div>
  );
}
