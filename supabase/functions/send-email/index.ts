import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";

// Platform default sender. In production this must be a verified Resend domain.
// Falls back to Resend's onboarding sender for easier dev/test usage.
const DEFAULT_FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "onboarding@resend.dev";
const DEFAULT_FROM_NAME = Deno.env.get("FROM_NAME") || "Stride WMS";

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

function isValidEmail(value: string | null | undefined): value is string {
  if (!value) return false;
  const trimmed = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

async function authenticateRequest(req: Request): Promise<{ userId: string; authHeader: string }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("UNAUTHORIZED");
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("SUPABASE_ENV_MISSING");
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) {
    throw new Error("UNAUTHORIZED");
  }

  return { userId: data.claims.sub as string, authHeader };
}

async function resolveSenderForTenant(
  tenantId: string,
  userId: string
): Promise<{ fromEmail: string; fromName: string; replyTo?: string }> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_ENV_MISSING");
  }

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Verify user belongs to the tenant they are trying to send as
  const { data: userRow, error: userError } = await serviceClient
    .from("users")
    .select("tenant_id")
    .eq("id", userId)
    .maybeSingle();

  if (userError || !userRow?.tenant_id) {
    throw new Error("FORBIDDEN");
  }
  if (String(userRow.tenant_id) !== String(tenantId)) {
    throw new Error("FORBIDDEN");
  }

  const [{ data: brandSettings }, { data: companySettings }] = await Promise.all([
    serviceClient
      .from("communication_brand_settings")
      .select("use_default_email, email_domain_verified, from_email, from_name, custom_email_domain, brand_support_email")
      .eq("tenant_id", tenantId)
      .maybeSingle(),
    serviceClient
      .from("tenant_company_settings")
      .select("company_name, company_email")
      .eq("tenant_id", tenantId)
      .maybeSingle(),
  ]);

  const fromName =
    String(brandSettings?.from_name || "").trim() ||
    String(companySettings?.company_name || "").trim() ||
    DEFAULT_FROM_NAME;

  // Default sender unless tenant explicitly chose + verified a custom domain.
  let fromEmail = DEFAULT_FROM_EMAIL;
  const wantsCustom = brandSettings?.use_default_email === false;
  const isVerified = brandSettings?.email_domain_verified === true;
  if (wantsCustom && isVerified) {
    fromEmail = String(
      brandSettings?.from_email ||
        brandSettings?.custom_email_domain ||
        DEFAULT_FROM_EMAIL
    );
  }

  // Prefer configured support email as reply-to, fall back to company_email.
  const replyToCandidate = isValidEmail(brandSettings?.brand_support_email)
    ? brandSettings!.brand_support_email
    : isValidEmail(companySettings?.company_email)
      ? companySettings!.company_email
      : undefined;

  return replyToCandidate
    ? { fromEmail, fromName, replyTo: replyToCandidate }
    : { fromEmail, fromName };
}

async function sendResend(params: {
  fromEmail: string;
  fromName: string;
  to: string[];
  subject: string;
  html: string;
  replyTo?: string;
}) {
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${params.fromName} <${params.fromEmail}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
      ...(params.replyTo ? { reply_to: params.replyTo } : {}),
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend API error: ${errorText}`);
  }
  
  return await response.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Authenticate the request
    const { userId } = await authenticateRequest(req);

    const { to, subject, html, tenant_id } = await req.json();
    
    if (!to || !subject || !html) {
      return jsonResponse({ ok: false, error: "Missing required fields: to, subject, html" }, 400);
    }
    
    const toList = Array.isArray(to) ? to : [to];
    const cleanedTo = toList
      .map((v) => (typeof v === "string" ? v.trim() : ""))
      .filter((v) => v.length > 0);

    if (cleanedTo.length === 0) {
      return jsonResponse({ ok: false, error: "Invalid to field" }, 400);
    }

    const sender =
      tenant_id && typeof tenant_id === "string" && tenant_id.trim().length > 0
        ? await resolveSenderForTenant(tenant_id, userId)
        : { fromEmail: DEFAULT_FROM_EMAIL, fromName: DEFAULT_FROM_NAME };

    console.log(`Sending email to: ${cleanedTo.join(", ")}, subject: ${subject}`);
    
    const result = await sendResend({
      ...sender,
      to: cleanedTo,
      subject,
      html,
    });
    
    console.log("Email sent successfully:", result);
    
    return jsonResponse({ ok: true, id: result?.id }, 200);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    
    if (message === "UNAUTHORIZED") {
      return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
    }
    if (message === "FORBIDDEN") {
      return jsonResponse({ ok: false, error: "Forbidden" }, 403);
    }
    if (message === "SUPABASE_ENV_MISSING") {
      return jsonResponse({ ok: false, error: "Supabase env vars are not configured" }, 500);
    }

    console.error("send-email error:", message);
    
    return jsonResponse({ ok: false, error: message }, 500);
  }
});
