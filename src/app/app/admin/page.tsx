import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  Edit3,
  ArrowLeft,
  Ban,
  CheckCircle2,
  Clock3,
  Mail,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Trash2,
  UserCog,
  UserRound,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user/user-avatar";
import {
  listPendingRegistrationRequests,
  reviewPendingRegistrationById,
} from "@/lib/auth/registration-approval";
import {
  adminBanUser,
  adminRemoveUser,
  adminRevokeUserSessions,
  adminSetArticlesAccess,
  adminSetUserRole,
  adminUnbanUser,
  listAdminUsers,
} from "@/lib/auth/admin";
import { getCurrentSession, isAdminSession } from "@/lib/auth/session";

type NoticeTone = "success" | "error" | "info";

type AdminPageProps = {
  searchParams?: Promise<{
    notice?: string;
    tone?: string;
  }>;
};

function getNoticeTone(value: string | undefined): NoticeTone {
  if (value === "success" || value === "error" || value === "info") {
    return value;
  }

  return "info";
}

function getNoticeClassName(tone: NoticeTone) {
  if (tone === "success") {
    return "border-emerald-400/40 bg-emerald-500/10 text-emerald-200";
  }

  if (tone === "error") {
    return "border-rose-400/45 bg-rose-500/10 text-rose-200";
  }

  return "border-sky-400/40 bg-sky-500/10 text-sky-200";
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "РќРµС‚ РґР°РЅРЅС‹С…";
  }

  return new Date(value).toLocaleString("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function buildAdminHref(notice: string, tone: NoticeTone) {
  const params = new URLSearchParams({
    notice,
    tone,
  });

  return `/app/admin?${params.toString()}`;
}

function getAdminActionError(error: unknown) {
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : "unknown_error";

  if (message.includes("YOU_CANNOT_REMOVE_YOURSELF")) {
    return "РќРµР»СЊР·СЏ СѓРґР°Р»РёС‚СЊ СЃРѕР±СЃС‚РІРµРЅРЅС‹Р№ Р°РєРєР°СѓРЅС‚ Р°РґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂР°.";
  }

  if (message.includes("YOU_CANNOT_BAN_YOURSELF")) {
    return "РќРµР»СЊР·СЏ Р·Р°Р±Р»РѕРєРёСЂРѕРІР°С‚СЊ СЃР°РјРѕРіРѕ СЃРµР±СЏ.";
  }

  if (message.includes("YOU_ARE_NOT_ALLOWED")) {
    return "РќРµРґРѕСЃС‚Р°С‚РѕС‡РЅРѕ РїСЂР°РІ РґР»СЏ СЌС‚РѕРіРѕ РґРµР№СЃС‚РІРёСЏ.";
  }

  if (message.includes("User not found") || message.includes("USER_NOT_FOUND")) {
    return "РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ РЅРµ РЅР°Р№РґРµРЅ.";
  }

  return "РќРµ СѓРґР°Р»РѕСЃСЊ РІС‹РїРѕР»РЅРёС‚СЊ Р°РґРјРёРЅ-РґРµР№СЃС‚РІРёРµ. РџСЂРѕРІРµСЂСЊС‚Рµ СЃРµСЂРІРµСЂРЅС‹Рµ Р»РѕРіРё.";
}

async function reviewPendingRequestAction(formData: FormData) {
  "use server";

  const session = await getCurrentSession();

  if (!session) {
    redirect("/auth");
  }

  if (!isAdminSession(session)) {
    redirect("/app");
  }

  const rawRequestId = formData.get("requestId");
  const rawDecision = formData.get("decision");
  const requestId = typeof rawRequestId === "string" ? rawRequestId.trim() : "";
  const decision = rawDecision === "approve" || rawDecision === "reject" ? rawDecision : null;

  if (!requestId || !decision) {
    redirect(buildAdminHref("РќРµРєРѕСЂСЂРµРєС‚РЅС‹Рµ РїР°СЂР°РјРµС‚СЂС‹ Р·Р°СЏРІРєРё.", "error"));
  }

  let notice = "";
  let tone: NoticeTone = "success";

  try {
    const result = await reviewPendingRegistrationById({
      decision,
      id: requestId,
      reviewedBy: `admin:${session.user.email}`,
    });

    if (result.status === "not_found") {
      notice = "Р—Р°СЏРІРєР° СѓР¶Рµ РѕР±СЂР°Р±РѕС‚Р°РЅР° РёР»Рё РЅРµ РЅР°Р№РґРµРЅР°.";
      tone = "info";
    } else {
      const notificationPart = result.notificationSent
        ? " РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ РїРѕР»СѓС‡РёР» РїРёСЃСЊРјРѕ СЃ СЂРµС€РµРЅРёРµРј."
        : " РџРёСЃСЊРјРѕ РѕС‚РїСЂР°РІРёС‚СЊ РЅРµ СѓРґР°Р»РѕСЃСЊ, РїСЂРѕРІРµСЂСЊС‚Рµ SMTP.";
      const actionText = decision === "approve" ? "Р—Р°СЏРІРєР° РѕРґРѕР±СЂРµРЅР°." : "Р—Р°СЏРІРєР° РѕС‚РєР»РѕРЅРµРЅР°.";
      notice = `${actionText}${notificationPart}`;
      tone = "success";
    }
  } catch (error) {
    console.error("[admin:pending:review:error]", error);
    notice = "РќРµ СѓРґР°Р»РѕСЃСЊ РѕР±СЂР°Р±РѕС‚Р°С‚СЊ Р·Р°СЏРІРєСѓ.";
    tone = "error";
  }

  revalidatePath("/app/admin");
  redirect(buildAdminHref(notice, tone));
}

async function manageUserAction(formData: FormData) {
  "use server";

  const session = await getCurrentSession();

  if (!session) {
    redirect("/auth");
  }

  if (!isAdminSession(session)) {
    redirect("/app");
  }

  const rawUserId = formData.get("userId");
  const rawAction = formData.get("action");
  const userId = typeof rawUserId === "string" ? rawUserId.trim() : "";
  const action = typeof rawAction === "string" ? rawAction.trim() : "";

  if (!userId || !action) {
    redirect(buildAdminHref("РќРµРєРѕСЂСЂРµРєС‚РЅС‹Рµ РїР°СЂР°РјРµС‚СЂС‹ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ.", "error"));
  }

  if (
    userId === session.user.id &&
    (action === "delete" || action === "demote" || action === "ban")
  ) {
    redirect(buildAdminHref("Р­С‚Рѕ РґРµР№СЃС‚РІРёРµ РЅРµР»СЊР·СЏ РїСЂРёРјРµРЅСЏС‚СЊ Рє СЃРІРѕРµРјСѓ Р°РєРєР°СѓРЅС‚Сѓ.", "error"));
  }

  let notice = "";
  let tone: NoticeTone = "success";

  try {
    switch (action) {
      case "promote":
        await adminSetUserRole(userId, "admin");
        notice = "РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ РїРѕР»СѓС‡РёР» СЂРѕР»СЊ admin.";
        break;
      case "demote":
        await adminSetUserRole(userId, "user");
        notice = "РџСЂР°РІР° Р°РґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂР° СЃРЅСЏС‚С‹.";
        break;
      case "ban":
        await adminBanUser(userId, "Р—Р°Р±Р»РѕРєРёСЂРѕРІР°РЅ Р°РґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂРѕРј С‡РµСЂРµР· РїР°РЅРµР»СЊ СѓРїСЂР°РІР»РµРЅРёСЏ.");
        notice = "РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ Р·Р°Р±Р»РѕРєРёСЂРѕРІР°РЅ.";
        break;
      case "unban":
        await adminUnbanUser(userId);
        notice = "РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ СЂР°Р·Р±Р»РѕРєРёСЂРѕРІР°РЅ.";
        break;
      case "revoke_sessions":
        await adminRevokeUserSessions(userId);
        notice = "Р’СЃРµ СЃРµСЃСЃРёРё РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ Р·Р°РІРµСЂС€РµРЅС‹.";
        break;
      case "delete":
        await adminRemoveUser(userId);
        notice = "РђРєРєР°СѓРЅС‚ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ СѓРґР°Р»РµРЅ.";
        break;
      case "grant_articles":
        await adminSetArticlesAccess(userId, true, session.user.id);
        notice = "РџРѕР»СЊР·РѕРІР°С‚РµР»СЋ РІС‹РґР°РЅ РґРѕСЃС‚СѓРї Рє СЃРѕР·РґР°РЅРёСЋ Рё СЂРµРґР°РєС‚РёСЂРѕРІР°РЅРёСЋ СЃС‚Р°С‚РµР№.";
        break;
      case "revoke_articles":
        await adminSetArticlesAccess(userId, false, session.user.id);
        notice = "Р”РѕСЃС‚СѓРї Рє СЃРѕР·РґР°РЅРёСЋ Рё СЂРµРґР°РєС‚РёСЂРѕРІР°РЅРёСЋ СЃС‚Р°С‚РµР№ РѕС‚РєР»СЋС‡РµРЅ.";
        break;
      default:
        notice = "РќРµРёР·РІРµСЃС‚РЅРѕРµ РґРµР№СЃС‚РІРёРµ.";
        tone = "error";
    }
  } catch (error) {
    console.error("[admin:user:action:error]", error);
    notice = getAdminActionError(error);
    tone = "error";
  }

  revalidatePath("/app/admin");
  redirect(buildAdminHref(notice, tone));
}

export default async function AdminRegistrationPage({ searchParams }: AdminPageProps) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/auth");
  }

  if (!isAdminSession(session)) {
    redirect("/app");
  }

  const params = searchParams ? await searchParams : undefined;
  const notice = params?.notice?.trim() || null;
  const tone = getNoticeTone(params?.tone);
  const pendingRequests = await listPendingRegistrationRequests(250);
  const { users, total } = await listAdminUsers(500);

  return (
    <div className="min-h-screen bg-transparent px-3 py-4 text-slate-100 sm:px-6 lg:px-8">
      <main className="mx-auto max-w-[1520px]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8ea9bd]">
              РђРґРјРёРЅРёСЃС‚СЂРёСЂРѕРІР°РЅРёРµ
            </p>
            <h1 className="mt-3 text-[clamp(1.9rem,3vw,2.5rem)] font-semibold leading-[1.1] tracking-tight text-[#e8f0f7]">
              РЈРїСЂР°РІР»РµРЅРёРµ РґРѕСЃС‚СѓРїРѕРј Рё РїРѕР»СЊР·РѕРІР°С‚РµР»СЏРјРё
            </h1>
            <p className="mt-3 max-w-4xl text-[15px] leading-7 text-[#9fb5c6]">
              Р—РґРµСЃСЊ РјРѕР¶РЅРѕ РјРѕРґРµСЂРёСЂРѕРІР°С‚СЊ Р·Р°СЏРІРєРё РЅР° СЂРµРіРёСЃС‚СЂР°С†РёСЋ, СѓРїСЂР°РІР»СЏС‚СЊ СЂРѕР»СЏРјРё, Р±Р»РѕРєРёСЂРѕРІРєР°РјРё,
              Р°РєС‚РёРІРЅС‹РјРё СЃРµСЃСЃРёСЏРјРё Рё СѓРґР°Р»РµРЅРёРµРј Р°РєРєР°СѓРЅС‚РѕРІ.
            </p>
          </div>

          <Button
            asChild
            variant="outline"
            className="rounded-2xl border-[#3a556c] bg-[#152a3d] text-[#c9dcea] hover:bg-[#1a3247]"
          >
            <Link href="/app">
              <ArrowLeft className="size-4" />
              РќР°Р·Р°Рґ Рє СЃС‚Р°С‚СЊСЏРј
            </Link>
          </Button>
        </div>

        {notice ? (
          <div className={`mt-6 rounded-2xl border px-4 py-3 text-sm shadow-sm ${getNoticeClassName(tone)}`}>
            {notice}
          </div>
        ) : null}

        <section className="mt-6 rounded-[24px] border border-[#2f4a61] bg-[#102031] p-4 shadow-[0_12px_26px_rgba(2,8,16,0.3)] sm:p-5 lg:p-6">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#3a556c] bg-[#152a3d] px-3 py-1 text-xs text-[#a9c0d1]">
            <Clock3 className="size-3.5 text-[#7cd9f3]" />
            Р—Р°СЏРІРѕРє РІ РѕС‡РµСЂРµРґРё: {pendingRequests.length}
          </div>

          {pendingRequests.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-[#3a566f] bg-[#13283a] px-5 py-10 text-center">
              <ShieldAlert className="mx-auto size-10 text-[#7d9bb2]" />
              <h2 className="mt-4 text-xl font-semibold text-[#e5eef6]">РћС‚РєСЂС‹С‚С‹С… Р·Р°СЏРІРѕРє РЅРµС‚</h2>
              <p className="mt-2 text-sm leading-7 text-[#9ab1c3]">
                РљРѕРіРґР° РїРѕСЏРІСЏС‚СЃСЏ РЅРѕРІС‹Рµ СЂРµРіРёСЃС‚СЂР°С†РёРё, РѕРЅРё РѕС‚РѕР±СЂР°Р·СЏС‚СЃСЏ РІ СЌС‚РѕРј СЃРїРёСЃРєРµ.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <article
                  key={request.id}
                  className="rounded-[20px] border border-[#2f4a61] bg-[#13283a] p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-[1.05rem] font-semibold leading-snug text-[#e5eef6]">
                        {request.name}
                      </h2>
                      <p className="mt-1 inline-flex items-center gap-2 text-sm text-[#b7cad9]">
                        <Mail className="size-4 text-[#7cd9f3]" />
                        {request.email}
                      </p>
                    </div>
                    <p className="text-xs tabular-nums text-[#8ea9bd]">
                      {formatDateTime(request.requestedAt)}
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-xl border border-[#3a556c] bg-[#152a3d] px-3 py-2">
                      <p className="text-xs uppercase tracking-[0.12em] text-[#8ea9bd]">IP</p>
                      <p className="mt-1 text-[#b7cad9]">{request.requestIp}</p>
                    </div>
                    <div className="rounded-xl border border-[#3a556c] bg-[#152a3d] px-3 py-2">
                      <p className="text-xs uppercase tracking-[0.12em] text-[#8ea9bd]">
                        User-Agent
                      </p>
                      <p className="mt-1 break-all text-[#b7cad9]">{request.userAgent}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <form action={reviewPendingRequestAction}>
                      <input type="hidden" name="requestId" value={request.id} />
                      <input type="hidden" name="decision" value="approve" />
                      <Button
                        type="submit"
                        className="rounded-xl"
                      >
                        <CheckCircle2 className="size-4" />
                        РћРґРѕР±СЂРёС‚СЊ
                      </Button>
                    </form>

                    <form action={reviewPendingRequestAction}>
                      <input type="hidden" name="requestId" value={request.id} />
                      <input type="hidden" name="decision" value="reject" />
                      <Button type="submit" variant="destructive" className="rounded-xl">
                        <XCircle className="size-4" />
                        РћС‚РєР»РѕРЅРёС‚СЊ
                      </Button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-[24px] border border-[#2f4a61] bg-[#102031] p-4 shadow-[0_12px_26px_rgba(2,8,16,0.3)] sm:p-5 lg:p-6">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#3a556c] bg-[#152a3d] px-3 py-1 text-xs text-[#a9c0d1]">
            <UserCog className="size-3.5 text-[#7cd9f3]" />
            РџРѕР»СЊР·РѕРІР°С‚РµР»РµР№: {total}
          </div>

          <div className="space-y-4">
            {users.map((user) => {
              const isCurrentUser = user.id === session.user.id;
              const isAdmin = user.role.split(",").includes("admin");

              return (
                <article
                  key={user.id}
                  className="rounded-[20px] border border-[#2f4a61] bg-[#13283a] p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <UserAvatar
                        image={user.image}
                        name={user.name}
                        className="size-12 rounded-xl border border-[#3a556c] bg-[#152a3d]"
                        fallbackClassName="text-[#8fd4f0]"
                      />
                      <div>
                        <p className="text-[1.05rem] font-semibold leading-snug text-[#e5eef6]">
                          {user.name}
                        </p>
                        <p className="text-sm text-[#9fb5c6]">{user.email}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-full border border-[#3a556c] bg-[#152a3d] px-2.5 py-1 text-[#b7cad9]">
                            role: {user.role}
                          </span>
                          <span
                            className={`rounded-full border px-2.5 py-1 ${
                              user.canManageArticles
                                ? "border-[#3a6d84] bg-[#16364f] text-[#9edff7]"
                                : "border-[#3a556c] bg-[#152a3d] text-[#9fb5c6]"
                            }`}
                          >
                            СЃС‚Р°С‚СЊРё: {user.canManageArticles ? "СЂРµРґР°РєС‚РѕСЂ" : "С‚РѕР»СЊРєРѕ РїСЂРѕСЃРјРѕС‚СЂ"}
                          </span>
                          <span
                            className={`rounded-full border px-2.5 py-1 ${
                              user.emailVerified
                                ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                                : "border-amber-400/40 bg-amber-500/10 text-amber-200"
                            }`}
                          >
                            {user.emailVerified ? "email РїРѕРґС‚РІРµСЂР¶РґРµРЅ" : "email РЅРµ РїРѕРґС‚РІРµСЂР¶РґРµРЅ"}
                          </span>
                          {user.banned ? (
                            <span className="rounded-full border border-rose-400/45 bg-rose-500/10 px-2.5 py-1 text-rose-200">
                              Р·Р°Р±Р»РѕРєРёСЂРѕРІР°РЅ
                            </span>
                          ) : (
                            <span className="rounded-full border border-sky-400/40 bg-sky-500/10 px-2.5 py-1 text-sky-200">
                              Р°РєС‚РёРІРµРЅ
                            </span>
                          )}
                          {isCurrentUser ? (
                            <span className="rounded-full border border-sky-400/40 bg-sky-500/10 px-2.5 py-1 text-sky-200">
                              РІС‹
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-[#3a556c] bg-[#152a3d] px-3 py-2">
                      <p className="text-xs uppercase tracking-[0.12em] text-[#8ea9bd]">РЎРѕР·РґР°РЅ</p>
                      <p className="mt-1 tabular-nums text-[#b7cad9]">{formatDateTime(user.createdAt)}</p>
                    </div>
                    <div className="rounded-xl border border-[#3a556c] bg-[#152a3d] px-3 py-2">
                      <p className="text-xs uppercase tracking-[0.12em] text-[#8ea9bd]">
                        РџРѕСЃР»РµРґРЅРёР№ Р°РєС‚РёРІ
                      </p>
                      <p className="mt-1 tabular-nums text-[#b7cad9]">
                        {formatDateTime(user.lastActiveAt)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[#3a556c] bg-[#152a3d] px-3 py-2">
                      <p className="text-xs uppercase tracking-[0.12em] text-[#8ea9bd]">
                        РђРєС‚РёРІРЅС‹С… СЃРµСЃСЃРёР№
                      </p>
                      <p className="mt-1 tabular-nums text-[#b7cad9]">{user.activeSessions}</p>
                    </div>
                    <div className="rounded-xl border border-[#3a556c] bg-[#152a3d] px-3 py-2">
                      <p className="text-xs uppercase tracking-[0.12em] text-[#8ea9bd]">ID</p>
                      <p className="mt-1 break-all text-[#b7cad9]">{user.id}</p>
                    </div>
                  </div>

                  {user.banned && user.banReason ? (
                    <div className="mt-3 rounded-xl border border-rose-400/45 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                      РџСЂРёС‡РёРЅР° Р±Р»РѕРєРёСЂРѕРІРєРё: {user.banReason}
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {isAdmin ? (
                      <form action={manageUserAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="action" value="demote" />
                        <Button
                          type="submit"
                          variant="outline"
                          className="rounded-xl border-[#3a556c] bg-[#152a3d] text-[#c9dcea] hover:bg-[#1a3247]"
                          disabled={isCurrentUser}
                        >
                          <ShieldOff className="size-4" />
                          РЎРЅСЏС‚СЊ admin
                        </Button>
                      </form>
                    ) : (
                      <form action={manageUserAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="action" value="promote" />
                        <Button
                          type="submit"
                          variant="outline"
                          className="rounded-xl border-[#3a556c] bg-[#152a3d] text-[#c9dcea] hover:bg-[#1a3247]"
                        >
                          <ShieldCheck className="size-4" />
                          РЎРґРµР»Р°С‚СЊ admin
                        </Button>
                      </form>
                    )}

                    {isAdmin ? null : user.canManageArticles ? (
                      <form action={manageUserAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="action" value="revoke_articles" />
                        <Button
                          type="submit"
                          variant="outline"
                          className="rounded-xl border-[#3a556c] bg-[#152a3d] text-[#c9dcea] hover:bg-[#1a3247]"
                        >
                          <Edit3 className="size-4" />
                          Р—Р°РїСЂРµС‚РёС‚СЊ СЃС‚Р°С‚СЊРё
                        </Button>
                      </form>
                    ) : (
                      <form action={manageUserAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="action" value="grant_articles" />
                        <Button
                          type="submit"
                          variant="outline"
                          className="rounded-xl border-[#3a556c] bg-[#152a3d] text-[#c9dcea] hover:bg-[#1a3247]"
                        >
                          <Edit3 className="size-4" />
                          Р Р°Р·СЂРµС€РёС‚СЊ СЃС‚Р°С‚СЊРё
                        </Button>
                      </form>
                    )}

                    {user.banned ? (
                      <form action={manageUserAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="action" value="unban" />
                        <Button
                          type="submit"
                          variant="outline"
                          className="rounded-xl border-[#3a556c] bg-[#152a3d] text-[#c9dcea] hover:bg-[#1a3247]"
                        >
                          <CheckCircle2 className="size-4" />
                          Р Р°Р·Р±Р»РѕРєРёСЂРѕРІР°С‚СЊ
                        </Button>
                      </form>
                    ) : (
                      <form action={manageUserAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="action" value="ban" />
                        <Button
                          type="submit"
                          variant="outline"
                          className="rounded-xl border-[#3a556c] bg-[#152a3d] text-[#c9dcea] hover:bg-[#1a3247]"
                          disabled={isCurrentUser}
                        >
                          <Ban className="size-4" />
                          Р—Р°Р±Р»РѕРєРёСЂРѕРІР°С‚СЊ
                        </Button>
                      </form>
                    )}

                    <form action={manageUserAction}>
                      <input type="hidden" name="userId" value={user.id} />
                      <input type="hidden" name="action" value="revoke_sessions" />
                      <Button
                        type="submit"
                        variant="outline"
                        className="rounded-xl border-[#3a556c] bg-[#152a3d] text-[#c9dcea] hover:bg-[#1a3247]"
                      >
                        <RefreshCcw className="size-4" />
                        Р—Р°РІРµСЂС€РёС‚СЊ СЃРµСЃСЃРёРё
                      </Button>
                    </form>

                    <form action={manageUserAction}>
                      <input type="hidden" name="userId" value={user.id} />
                      <input type="hidden" name="action" value="delete" />
                      <Button
                        type="submit"
                        variant="destructive"
                        className="rounded-xl"
                        disabled={isCurrentUser}
                      >
                        <Trash2 className="size-4" />
                        РЈРґР°Р»РёС‚СЊ Р°РєРєР°СѓРЅС‚
                      </Button>
                    </form>
                  </div>
                </article>
              );
            })}

            {users.length === 0 ? (
              <div className="rounded-[20px] border border-dashed border-[#3a566f] bg-[#13283a] px-5 py-10 text-center">
                <UserRound className="mx-auto size-10 text-[#7d9bb2]" />
                <h2 className="mt-4 text-xl font-semibold text-[#e5eef6]">РџРѕР»СЊР·РѕРІР°С‚РµР»Рё РЅРµ РЅР°Р№РґРµРЅС‹</h2>
                <p className="mt-2 text-sm leading-7 text-[#9ab1c3]">
                  РџРѕРєР° РІ СЃРёСЃС‚РµРјРµ РЅРµС‚ Р·Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°РЅРЅС‹С… РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№.
                </p>
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
