import crypto from "crypto";
import { NextRequest } from "next/server";
import { auth, pool } from "@/lib/auth/server";
import { getAuthEnv } from "@/lib/auth/env";

type RegistrationDecision = "approve" | "reject";
type RegistrationStatus = "pending" | "approved" | "rejected";

type PendingRegistrationRow = {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  callback_url: string;
  status: RegistrationStatus;
  request_ip: string;
  user_agent: string;
  approve_token_hash: string;
  reject_token_hash: string;
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_note: string | null;
  created_user_id: string | null;
  telegram_chat_id: string | null;
  telegram_message_id: string | null;
};

export class RegistrationApprovalError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = "registration_approval_error") {
    super(message);
    this.name = "RegistrationApprovalError";
    this.status = status;
    this.code = code;
  }
}

const REGISTRATION_APPROVAL_SCHEMA_SQL = `
  create table if not exists registration_requests (
    id text primary key,
    email text not null,
    name text not null,
    password_hash text not null,
    callback_url text not null default '',
    status text not null default 'pending',
    request_ip text not null default 'unknown',
    user_agent text not null default 'unknown',
    approve_token_hash text not null unique,
    reject_token_hash text not null unique,
    requested_at timestamptz not null default now(),
    reviewed_at timestamptz,
    reviewed_by text,
    review_note text,
    created_user_id text references "user"(id) on delete set null,
    telegram_chat_id text,
    telegram_message_id text
  );

  create unique index if not exists registration_requests_pending_email_idx
    on registration_requests(email)
    where status = 'pending';

  create index if not exists registration_requests_status_requested_idx
    on registration_requests(status, requested_at desc);
`;

let registrationApprovalSchemaPromise: Promise<void> | null = null;

function getRegistrationApprovalEnv() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  const { baseUrl } = getAuthEnv();

  if (!botToken || !adminChatId) {
    throw new RegistrationApprovalError(
      "Регистрация через Telegram пока не настроена на сервере.",
      500,
      "telegram_not_configured"
    );
  }

  return {
    botToken,
    adminChatId,
    baseUrl,
  };
}

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    const [firstIp] = forwardedFor.split(",");

    if (firstIp?.trim()) {
      return firstIp.trim();
    }
  }

  const realIp = request.headers.get("x-real-ip");
  return realIp?.trim() || "unknown";
}

function getUserAgent(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") ?? "unknown";
  return userAgent.length > 240 ? `${userAgent.slice(0, 240)}...` : userAgent;
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function createModerationToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function ensureRegistrationApprovalSchema() {
  if (!registrationApprovalSchemaPromise) {
    registrationApprovalSchemaPromise = pool
      .query(REGISTRATION_APPROVAL_SCHEMA_SQL)
      .then(() => undefined);
  }

  try {
    await registrationApprovalSchemaPromise;
  } catch (error) {
    registrationApprovalSchemaPromise = null;
    throw error;
  }
}

async function sendTelegramRegistrationModerationMessage({
  botToken,
  adminChatId,
  name,
  email,
  requestIp,
  requestedAt,
  approveUrl,
  rejectUrl,
}: {
  botToken: string;
  adminChatId: string;
  name: string;
  email: string;
  requestIp: string;
  requestedAt: Date;
  approveUrl: string;
  rejectUrl: string;
}) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: adminChatId,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      text: [
        "<b>Новая заявка на регистрацию</b>",
        "",
        `Имя: <b>${escapeHtml(name)}</b>`,
        `Email: <code>${escapeHtml(email)}</code>`,
        `IP: <code>${escapeHtml(requestIp)}</code>`,
        `Время: <code>${requestedAt.toISOString()}</code>`,
      ].join("\n"),
      reply_markup: {
        inline_keyboard: [
          [
            { text: "✅ Одобрить", url: approveUrl },
            { text: "❌ Отклонить", url: rejectUrl },
          ],
        ],
      },
    }),
  });

  const result = (await response.json()) as {
    ok: boolean;
    description?: string;
    result?: { message_id?: number };
  };

  if (!response.ok || !result.ok) {
    throw new RegistrationApprovalError(
      `Не удалось отправить заявку в Telegram: ${result.description ?? "unknown_error"}`,
      502,
      "telegram_send_failed"
    );
  }

  return {
    messageId:
      typeof result.result?.message_id === "number"
        ? String(result.result.message_id)
        : null,
  };
}

async function findUserByEmail(email: string) {
  const ctx = await auth.$context;
  return ctx.internalAdapter.findUserByEmail(email, {
    includeAccounts: true,
  });
}

export async function createPendingRegistration({
  name,
  email,
  password,
  callbackURL,
  request,
}: {
  name: string;
  email: string;
  password: string;
  callbackURL: string;
  request: NextRequest;
}) {
  const { botToken, adminChatId, baseUrl } = getRegistrationApprovalEnv();
  await ensureRegistrationApprovalSchema();

  const normalizedEmail = email.toLowerCase();
  const existingUser = await findUserByEmail(normalizedEmail);

  if (existingUser) {
    throw new RegistrationApprovalError("Такой email уже зарегистрирован.", 409, "email_exists");
  }

  const pendingRequest = await pool.query<{ id: string }>(
    `
      select id
      from registration_requests
      where email = $1
        and status = 'pending'
      limit 1
    `,
    [normalizedEmail]
  );

  if (pendingRequest.rowCount) {
    return {
      status: "already_pending" as const,
    };
  }

  const ctx = await auth.$context;
  const passwordHash = await ctx.password.hash(password);
  const id = crypto.randomUUID();
  const approveToken = createModerationToken();
  const rejectToken = createModerationToken();
  const approveTokenHash = hashToken(approveToken);
  const rejectTokenHash = hashToken(rejectToken);
  const requestIp = getClientIp(request);
  const userAgent = getUserAgent(request);
  const requestedAt = new Date();
  const approveUrl = `${baseUrl}/api/registration-moderation/approve?token=${encodeURIComponent(approveToken)}`;
  const rejectUrl = `${baseUrl}/api/registration-moderation/reject?token=${encodeURIComponent(rejectToken)}`;

  await pool.query(
    `
      insert into registration_requests (
        id,
        email,
        name,
        password_hash,
        callback_url,
        status,
        request_ip,
        user_agent,
        approve_token_hash,
        reject_token_hash,
        requested_at
      )
      values ($1, $2, $3, $4, $5, 'pending', $6, $7, $8, $9, $10)
    `,
    [
      id,
      normalizedEmail,
      name,
      passwordHash,
      callbackURL,
      requestIp,
      userAgent,
      approveTokenHash,
      rejectTokenHash,
      requestedAt.toISOString(),
    ]
  );

  try {
    const telegramResult = await sendTelegramRegistrationModerationMessage({
      botToken,
      adminChatId,
      name,
      email: normalizedEmail,
      requestIp,
      requestedAt,
      approveUrl,
      rejectUrl,
    });

    await pool.query(
      `
        update registration_requests
        set telegram_chat_id = $2,
            telegram_message_id = $3
        where id = $1
      `,
      [id, adminChatId, telegramResult.messageId]
    );
  } catch (error) {
    await pool.query("delete from registration_requests where id = $1", [id]);
    throw error;
  }

  return {
    status: "created" as const,
  };
}

export async function reviewPendingRegistrationByToken({
  decision,
  token,
}: {
  decision: RegistrationDecision;
  token: string;
}) {
  await ensureRegistrationApprovalSchema();

  const tokenHash = hashToken(token);
  const tokenColumn = decision === "approve" ? "approve_token_hash" : "reject_token_hash";

  const requestResult = await pool.query<PendingRegistrationRow>(
    `
      select *
      from registration_requests
      where status = 'pending'
        and ${tokenColumn} = $1
      limit 1
    `,
    [tokenHash]
  );

  if (!requestResult.rowCount) {
    return {
      status: "not_found" as const,
    };
  }

  const registration = requestResult.rows[0];

  if (decision === "reject") {
    await pool.query(
      `
        update registration_requests
        set status = 'rejected',
            reviewed_at = now(),
            reviewed_by = $2,
            review_note = 'rejected_from_telegram'
        where id = $1
      `,
      [registration.id, "telegram_moderation"]
    );

    return {
      status: "rejected" as const,
      email: registration.email,
      name: registration.name,
    };
  }

  const existingUser = await findUserByEmail(registration.email);

  if (existingUser) {
    await pool.query(
      `
        update registration_requests
        set status = 'approved',
            reviewed_at = now(),
            reviewed_by = $2,
            review_note = 'user_already_exists',
            created_user_id = $3
        where id = $1
      `,
      [registration.id, "telegram_moderation", existingUser.user.id]
    );

    return {
      status: "approved_existing" as const,
      email: registration.email,
      name: registration.name,
    };
  }

  const ctx = await auth.$context;
  const user = await ctx.internalAdapter.createUser({
    email: registration.email,
    name: registration.name,
    emailVerified: true,
    role: "user",
  });

  await ctx.internalAdapter.linkAccount({
    userId: user.id,
    providerId: "credential",
    accountId: user.id,
    password: registration.password_hash,
  });

  await pool.query(
    `
      update registration_requests
      set status = 'approved',
          reviewed_at = now(),
          reviewed_by = $2,
          review_note = 'approved_from_telegram',
          created_user_id = $3
      where id = $1
    `,
    [registration.id, "telegram_moderation", user.id]
  );

  return {
    status: "approved" as const,
    email: registration.email,
    name: registration.name,
  };
}
