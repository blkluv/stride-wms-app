import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { MaterialIcon } from '@/components/ui/MaterialIcon';

interface ClientGroupedItemSplitSectionProps {
  enabled: boolean;
  onEnabledChange: (next: boolean) => void;
}

export function ClientGroupedItemSplitSection({
  enabled,
  onEnabledChange,
}: ClientGroupedItemSplitSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MaterialIcon name="call_split" size="sm" />
          Client Partial Requests (Grouped Items)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Allow client partial-quantity requests</Label>
            <p className="text-sm text-muted-foreground">
              When enabled, client portal users can request a partial quantity from a grouped item (qty &gt; 1). This
              automatically creates a high-priority <span className="font-medium">Split</span> task for the warehouse and
              blocks the job until the split is completed.
            </p>
            {!enabled && (
              <p className="text-sm text-muted-foreground">
                When disabled, the request is accepted but marked <span className="font-medium">Pending review</span> (no
                automated split task is created).
              </p>
            )}
          </div>
          <Switch checked={enabled} onCheckedChange={onEnabledChange} />
        </div>
      </CardContent>
    </Card>
  );
}

