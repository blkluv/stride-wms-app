export interface PlatformEmailDefaults {
  fromEmail: string;
  fromName: string;
  replyTo: string | null;
}

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Resolve the platform-level default sender.
 *
 * Falls back to Edge Function env vars if the DB row doesn't exist yet or the
 * migration hasn't been applied.
 *
 * Expected DB schema:
 * - public.platform_email_settings (singleton id=1)
 */
export async function resolvePlatformEmailDefaults(serviceClient: any): Promise<PlatformEmailDefaults> {
  const fallbackFromEmail = Deno.env.get("FROM_EMAIL") || "onboarding@resend.dev";
  const fallbackFromName = Deno.env.get("FROM_NAME") || "Stride WMS";
  const fallbackReplyTo = Deno.env.get("REPLY_TO_EMAIL") || null;

  try {
    const { data, error } = await serviceClient
      .from("platform_email_settings")
      .select("default_from_email, default_from_name, default_reply_to_email, is_active")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data || data.is_active === false) {
      if (error) {
        console.warn("[platform-email] Failed to load platform_email_settings:", error.message);
      }
      return { fromEmail: fallbackFromEmail, fromName: fallbackFromName, replyTo: fallbackReplyTo };
    }

    return {
      fromEmail: toNonEmptyString(data.default_from_email) || fallbackFromEmail,
      fromName: toNonEmptyString(data.default_from_name) || fallbackFromName,
      replyTo: toNonEmptyString(data.default_reply_to_email) || fallbackReplyTo,
    };
  } catch (err) {
    console.warn("[platform-email] Unexpected error resolving platform defaults:", err);
    return { fromEmail: fallbackFromEmail, fromName: fallbackFromName, replyTo: fallbackReplyTo };
  }
}

