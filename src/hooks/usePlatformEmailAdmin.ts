import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PlatformEmailSettings {
  default_from_email: string;
  default_from_name: string | null;
  default_reply_to_email: string | null;
  is_active: boolean;
  updated_at: string | null;
}

interface SavePlatformEmailSettingsInput {
  defaultFromEmail: string;
  defaultFromName?: string | null;
  defaultReplyToEmail?: string | null;
  isActive?: boolean;
}

function toNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function toBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeRow(row: Record<string, unknown>): PlatformEmailSettings {
  return {
    default_from_email: String(row.default_from_email ?? ""),
    default_from_name: toNullableString(row.default_from_name),
    default_reply_to_email: toNullableString(row.default_reply_to_email),
    is_active: toBoolean(row.is_active, true),
    updated_at: toNullableString(row.updated_at),
  };
}

function firstRow(data: unknown): Record<string, unknown> | null {
  if (!data) return null;
  if (Array.isArray(data)) {
    const first = data[0];
    return first && typeof first === "object" ? (first as Record<string, unknown>) : null;
  }
  return typeof data === "object" ? (data as Record<string, unknown>) : null;
}

export function usePlatformEmailAdmin() {
  const [settings, setSettings] = useState<PlatformEmailSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any).rpc("rpc_admin_get_platform_email_settings");
      if (error) throw new Error(error.message || "Failed to load platform email settings");
      const row = firstRow(data);
      setSettings(row ? normalizeRow(row) : null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const saveSettings = useCallback(async (input: SavePlatformEmailSettingsInput) => {
    setSaving(true);
    try {
      const { data, error } = await (supabase as any).rpc("rpc_admin_set_platform_email_settings", {
        p_default_from_email: input.defaultFromEmail,
        p_default_from_name: input.defaultFromName ?? null,
        p_default_reply_to_email: input.defaultReplyToEmail ?? null,
        p_is_active: input.isActive ?? true,
      });
      if (error) throw new Error(error.message || "Failed to save platform email settings");
      const row = firstRow(data);
      const normalized = row ? normalizeRow(row) : null;
      setSettings(normalized);
      return normalized;
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    settings,
    loading,
    saving,
    refetch,
    saveSettings,
  };
}

