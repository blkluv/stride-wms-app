import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolvePlatformEmailDefaults } from "../_shared/platformEmail.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(payload: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function extractFirstEmail(value: string | null): string | null {
  if (!value) return null;
  const match = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0].toLowerCase() : null;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  const bytes = new Uint8Array(sig);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeNowIso(): string {
  try {
    return new Date().toISOString();
  } catch {
    return "";
  }
}

async function sendViaResend(params: {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  to: string;
  subject: string;
  html: string;
  replyTo?: string | null;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${params.fromName} <${params.fromEmail}>`,
      to: [params.to],
      subject: params.subject,
      html: params.html,
      ...(params.replyTo ? { reply_to: params.replyTo } : {}),
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    return { ok: false, error: text || `Resend failed (${response.status})` };
  }

  const data = await response.json().catch(() => null);
  return { ok: true, id: data?.id };
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ ok: false, error: "Method not allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
  const MAILGUN_SIGNING_KEY =
    Deno.env.get("MAILGUN_WEBHOOK_SIGNING_KEY") ??
    Deno.env.get("MAILGUN_API_KEY") ??
    "";

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ ok: false, error: "Supabase env vars are not configured" }, 500);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Load platform inbound config (reply domain + enabled)
  const { data: platformRow } = await supabase
    .from("platform_inbound_email_settings")
    .select("provider, reply_domain, is_active")
    .eq("id", 1)
    .maybeSingle();

  const platformActive = platformRow?.is_active === true;
  const replyDomain = toNonEmptyString(platformRow?.reply_domain);

  // If the platform hasn't enabled inbound routing yet, acknowledge and exit (no retries).
  if (!platformActive || !replyDomain) {
    return jsonResponse({ ok: true, status: "ignored", reason: "platform_inbound_inactive" }, 200);
  }

  // Mailgun sends application/x-www-form-urlencoded or multipart/form-data.
  const form = await req.formData();

  // --------------------------------------------------------------------------
  // Verify Mailgun webhook signature
  // --------------------------------------------------------------------------
  const timestamp = toNonEmptyString(form.get("timestamp"));
  const token = toNonEmptyString(form.get("token"));
  const signature = toNonEmptyString(form.get("signature"))?.toLowerCase();

  if (!timestamp || !token || !signature) {
    return jsonResponse({ ok: false, error: "Missing Mailgun signature fields" }, 401);
  }
  if (!MAILGUN_SIGNING_KEY) {
    return jsonResponse({ ok: false, error: "MAILGUN_WEBHOOK_SIGNING_KEY not configured" }, 500);
  }

  // Basic replay protection (10 minutes)
  const tsMs = Number.parseInt(timestamp, 10) * 1000;
  if (!Number.isFinite(tsMs) || Math.abs(Date.now() - tsMs) > 10 * 60 * 1000) {
    return jsonResponse({ ok: false, error: "Stale timestamp" }, 401);
  }

  const expectedSig = await hmacSha256Hex(MAILGUN_SIGNING_KEY, `${timestamp}${token}`);
  if (expectedSig !== signature) {
    return jsonResponse({ ok: false, error: "Invalid signature" }, 401);
  }

  // --------------------------------------------------------------------------
  // Parse inbound message
  // --------------------------------------------------------------------------
  const recipientRaw =
    toNonEmptyString(form.get("recipient")) ||
    toNonEmptyString(form.get("To")) ||
    "";
  const toAddress = extractFirstEmail(recipientRaw) || recipientRaw.toLowerCase();
  const fromAddress = extractFirstEmail(toNonEmptyString(form.get("sender"))) ||
    extractFirstEmail(toNonEmptyString(form.get("From"))) ||
    null;
  const subject = toNonEmptyString(form.get("subject")) || "(no subject)";

  const strippedText =
    toNonEmptyString(form.get("stripped-text")) ||
    toNonEmptyString(form.get("body-plain")) ||
    "";

  if (!toAddress.includes("@")) {
    return jsonResponse({ ok: true, status: "ignored", reason: "invalid_to_address" }, 200);
  }

  const [localPart, domainPart] = toAddress.split("@");
  const domain = (domainPart || "").trim().toLowerCase();
  const expectedDomain = replyDomain.trim().toLowerCase();

  if (domain !== expectedDomain) {
    // Not for this routing domain
    return jsonResponse({ ok: true, status: "ignored", reason: "domain_mismatch" }, 200);
  }

  const tenantId = (localPart || "").trim();
  if (!isUuid(tenantId)) {
    return jsonResponse({ ok: true, status: "ignored", reason: "invalid_tenant_id" }, 200);
  }

  // --------------------------------------------------------------------------
  // Resolve tenant forwarding destination
  // --------------------------------------------------------------------------
  const { data: tenantSettings } = await supabase
    .from("tenant_inbound_email_settings")
    .select("forward_to_email, is_enabled")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  const forwardEnabled = tenantSettings?.is_enabled === true;
  const forwardTo = toNonEmptyString(tenantSettings?.forward_to_email);

  if (!forwardEnabled || !forwardTo) {
    // Log and ignore
    try {
      await supabase.from("tenant_inbound_email_events").insert({
        tenant_id: tenantId,
        provider: "mailgun",
        to_address: toAddress,
        from_address: fromAddress,
        subject,
        forwarded_to: forwardTo,
        forward_status: "ignored",
        error_message: !forwardEnabled ? "Forwarding disabled" : "No forward_to_email configured",
        metadata: { received_at: safeNowIso() },
      });
    } catch {
      // ignore logging failures
    }
    return jsonResponse({ ok: true, status: "ignored", reason: "tenant_forwarding_not_configured" }, 200);
  }

  if (!RESEND_API_KEY) {
    return jsonResponse({ ok: false, error: "RESEND_API_KEY not configured" }, 500);
  }

  const platformDefaults = await resolvePlatformEmailDefaults(supabase);

  const { data: companyRow } = await supabase
    .from("tenant_company_settings")
    .select("company_name")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  const tenantName = toNonEmptyString(companyRow?.company_name) || "Stride WMS Tenant";

  const forwardedSubject = `Reply received: ${subject}`;
  const forwardedHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; padding: 20px; color: #111827;">
      <h2 style="margin: 0 0 12px;">Inbound reply forwarded</h2>
      <p style="margin: 0 0 16px; color: #374151;">
        This message was sent to <strong>${escapeHtml(toAddress)}</strong> and forwarded to <strong>${escapeHtml(forwardTo)}</strong>.
      </p>
      <table style="width: 100%; border-collapse: collapse; margin: 12px 0;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; width: 120px; font-weight: 600;">From</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(fromAddress || "(unknown)")}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">To</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(toAddress)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Subject</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(subject)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: 600;">Received</td>
          <td style="padding: 8px;">${escapeHtml(safeNowIso())}</td>
        </tr>
      </table>

      <div style="margin-top: 16px; padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
        <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">Message</div>
        <pre style="white-space: pre-wrap; margin: 0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px; color: #111827;">${escapeHtml(strippedText || "(no text body)")}</pre>
      </div>
    </div>
  `.trim();

  const sendResult = await sendViaResend({
    apiKey: RESEND_API_KEY,
    fromEmail: platformDefaults.fromEmail,
    fromName: `${tenantName} (via Stride WMS)`,
    to: forwardTo,
    subject: forwardedSubject,
    html: forwardedHtml,
    // Let tenant hit "reply" to reply to the original sender directly.
    replyTo: fromAddress,
  });

  try {
    await supabase.from("tenant_inbound_email_events").insert({
      tenant_id: tenantId,
      provider: "mailgun",
      to_address: toAddress,
      from_address: fromAddress,
      subject,
      forwarded_to: forwardTo,
      forward_status: sendResult.ok ? "forwarded" : "failed",
      error_message: sendResult.ok ? null : sendResult.error,
      metadata: {
        resend_id: sendResult.id || null,
        reply_domain: replyDomain,
      },
    });
  } catch {
    // ignore logging failures
  }

  if (!sendResult.ok) {
    return jsonResponse({ ok: true, status: "failed", error: sendResult.error }, 200);
  }

  return jsonResponse({ ok: true, status: "forwarded", resend_id: sendResult.id }, 200);
});

