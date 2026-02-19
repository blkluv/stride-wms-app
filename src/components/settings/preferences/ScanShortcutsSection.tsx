import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { HelpTip } from '@/components/ui/help-tip';

interface ScanShortcutsSectionProps {
  openContainerEnabled: boolean;
  openLocationEnabled: boolean;
  onOpenContainerEnabledChange: (enabled: boolean) => void;
  onOpenLocationEnabledChange: (enabled: boolean) => void;
}

export function ScanShortcutsSection({
  openContainerEnabled,
  openLocationEnabled,
  onOpenContainerEnabledChange,
  onOpenLocationEnabledChange,
}: ScanShortcutsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MaterialIcon name="qr_code_scanner" size="sm" />
          <HelpTip tooltip="Optional shortcuts when a user scans a container or location label in a workflow that expects item codes.">
            Scan Shortcuts
          </HelpTip>
        </CardTitle>
        <CardDescription>
          Control how the app reacts to container/location scans on item-only scan screens.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Label className="font-medium">Container scan shortcut</Label>
            <p className="text-xs text-muted-foreground">
              Prompt to open container details when a container label is scanned in an item scan flow.
            </p>
          </div>
          <Switch
            checked={openContainerEnabled}
            onCheckedChange={onOpenContainerEnabledChange}
            aria-label="Enable container scan shortcut"
          />
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Label className="font-medium">Location scan shortcut</Label>
            <p className="text-xs text-muted-foreground">
              Prompt to open location details when a location label is scanned in an item scan flow.
            </p>
          </div>
          <Switch
            checked={openLocationEnabled}
            onCheckedChange={onOpenLocationEnabledChange}
            aria-label="Enable location scan shortcut"
          />
        </div>
      </CardContent>
    </Card>
  );
}

