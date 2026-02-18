import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePlatformEmailAdmin } from "@/hooks/usePlatformEmailAdmin";

function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export default function EmailOps() {
  const { toast } = useToast();
  const { settings, loading, saving, saveSettings, refetch } = usePlatformEmailAdmin();

  const [defaultFromEmail, setDefaultFromEmail] = useState("");
  const [defaultFromName, setDefaultFromName] = useState("");
  const [defaultReplyToEmail, setDefaultReplyToEmail] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [testToEmail, setTestToEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setDefaultFromEmail(settings.default_from_email || "");
    setDefaultFromName(settings.default_from_name || "");
    setDefaultReplyToEmail(settings.default_reply_to_email || "");
    setIsActive(settings.is_active);
  }, [settings]);

  const hasUnsavedChanges = useMemo(() => {
    const s = settings;
    if (!s) {
      return (
        defaultFromEmail.trim().length > 0 ||
        defaultFromName.trim().length > 0 ||
        defaultReplyToEmail.trim().length > 0 ||
        isActive !== true
      );
    }
    return (
      defaultFromEmail.trim() !== (s.default_from_email || "").trim() ||
      defaultFromName.trim() !== (s.default_from_name || "").trim() ||
      defaultReplyToEmail.trim() !== (s.default_reply_to_email || "").trim() ||
      isActive !== s.is_active
    );
  }, [defaultFromEmail, defaultFromName, defaultReplyToEmail, isActive, settings]);

  const handleSave = async () => {
    if (!defaultFromEmail.trim()) {
      toast({ variant: "destructive", title: "From email required", description: "Enter a platform From email." });
      return;
    }
    if (!isValidEmail(defaultFromEmail)) {
      toast({ variant: "destructive", title: "Invalid From email", description: "Enter a valid email address." });
      return;
    }
    if (defaultReplyToEmail.trim() && !isValidEmail(defaultReplyToEmail)) {
      toast({ variant: "destructive", title: "Invalid Reply-To", description: "Enter a valid reply-to email (or leave blank)." });
      return;
    }

    try {
      await saveSettings({
        defaultFromEmail: defaultFromEmail.trim(),
        defaultFromName: defaultFromName.trim() || null,
        defaultReplyToEmail: defaultReplyToEmail.trim() || null,
        isActive,
      });
      toast({
        title: "Platform sender saved",
        description: "Default email sender will be used for tenants on the default sender path.",
      });
      await refetch();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to save platform email settings.";
      toast({ variant: "destructive", title: "Save failed", description: message });
    }
  };

  const handleSendTest = async () => {
    if (!testToEmail.trim()) {
      toast({ variant: "destructive", title: "Recipient required", description: "Enter an email address to receive the test." });
      return;
    }
    if (!isValidEmail(testToEmail)) {
      toast({ variant: "destructive", title: "Invalid recipient", description: "Enter a valid recipient email." });
      return;
    }

    setSendingTest(true);
    try {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
          <h2 style="margin: 0 0 12px;">✅ Platform Email Sender Test</h2>
          <p style="margin: 0 0 8px;">If you received this, Stride's platform email sender is working.</p>
          <p style="margin: 0; color: #6b7280; font-size: 13px;">Sent at: ${new Date().toISOString()}</p>
        </div>
      `.trim();

      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          to: testToEmail.trim(),
          subject: "[Test] Stride platform sender",
          html,
        },
      });

      if (error) throw error;
      if (!data?.ok) {
        throw new Error(data?.error || "Send failed");
      }

      toast({
        title: "Test email sent",
        description: `Sent to ${testToEmail.trim()} (Resend id: ${data?.id || "n/a"})`,
      });
    } catch (error: any) {
      const message =
        error?.context?.body?.error ||
        error?.message ||
        "Failed to send test email.";
      toast({ variant: "destructive", title: "Test send failed", description: message });
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <PageHeader
            primaryText="Email"
            accentText="Ops"
            description="Admin-dev: manage the platform default Resend sender used by tenants who skip custom email setup."
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/pricing-ops">Pricing Ops</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/sms-sender-ops">SMS Sender Ops</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/billing-overrides-ops">Billing Overrides</Link>
            </Button>
          </div>
        </div>

        <Alert>
          <MaterialIcon name="info" size="sm" />
          <AlertDescription>
            This config controls the <strong>platform default sender</strong>. Tenants can still send from their
            own domain after they verify DNS via the in-app wizard. The “From” address you set here must be verified
            in Resend (and the Supabase Edge Function secret <code>RESEND_API_KEY</code> must be configured) or sends will fail.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MaterialIcon name="alternate_email" size="md" />
              Platform Default Sender
            </CardTitle>
            <CardDescription>
              Used when a tenant chooses “Use default sender” (no custom DNS setup).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MaterialIcon name="progress_activity" size="sm" className="animate-spin" />
                Loading platform email settings…
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                  <div>
                    <div className="text-sm font-medium">Enabled</div>
                    <div className="text-xs text-muted-foreground">
                      If disabled, Edge Functions fall back to their environment defaults.
                    </div>
                  </div>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="platform_from_email">Default From Email</Label>
                    <Input
                      id="platform_from_email"
                      type="email"
                      placeholder="noreply@yourdomain.com"
                      value={defaultFromEmail}
                      onChange={(e) => setDefaultFromEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="platform_from_name">Default From Name (optional)</Label>
                    <Input
                      id="platform_from_name"
                      placeholder="Stride WMS"
                      value={defaultFromName}
                      onChange={(e) => setDefaultFromName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="platform_reply_to">Default Reply-To (optional)</Label>
                    <Input
                      id="platform_reply_to"
                      type="email"
                      placeholder="support@yourdomain.com"
                      value={defaultReplyToEmail}
                      onChange={(e) => setDefaultReplyToEmail(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Replies will go here for tenant emails that use the platform sender unless overridden.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button variant="outline" onClick={refetch} disabled={saving}>
                    <MaterialIcon name="refresh" size="sm" className="mr-2" />
                    Refresh
                  </Button>
                  <Button onClick={handleSave} disabled={saving || !hasUnsavedChanges}>
                    {saving ? (
                      <MaterialIcon name="progress_activity" size="sm" className="mr-2 animate-spin" />
                    ) : (
                      <MaterialIcon name="save" size="sm" className="mr-2" />
                    )}
                    Save Sender
                  </Button>
                </div>

                {settings?.updated_at && (
                  <p className="text-xs text-muted-foreground">
                    Last updated: {new Date(settings.updated_at).toLocaleString()}
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MaterialIcon name="science" size="md" />
              Test Send (Platform Sender)
            </CardTitle>
            <CardDescription>
              Sends via the <code>send-email</code> Edge Function with no tenant context (platform default sender).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test_to_email">Send test email to</Label>
              <Input
                id="test_to_email"
                type="email"
                placeholder="you@company.com"
                value={testToEmail}
                onChange={(e) => setTestToEmail(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSendTest} disabled={sendingTest}>
                {sendingTest ? (
                  <MaterialIcon name="progress_activity" size="sm" className="mr-2 animate-spin" />
                ) : (
                  <MaterialIcon name="send" size="sm" className="mr-2" />
                )}
                Send Test
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

