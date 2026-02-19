import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { MaterialIcon } from '@/components/ui/MaterialIcon';

export function TimeTrackingSection(props: {
  allowConcurrentTasks: boolean;
  allowConcurrentShipments: boolean;
  allowConcurrentStocktakes: boolean;
  onAllowConcurrentTasksChange: (value: boolean) => void;
  onAllowConcurrentShipmentsChange: (value: boolean) => void;
  onAllowConcurrentStocktakesChange: (value: boolean) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MaterialIcon name="schedule" size="sm" />
          Time Tracking
        </CardTitle>
        <CardDescription className="text-xs">
          Configure collaborate mode (multiple users timing the same job).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-3 py-1">
          <div className="flex items-center gap-2 min-w-0">
            <MaterialIcon name="task_alt" size="sm" className="text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <Label className="text-sm">Allow concurrent task timers</Label>
              <p className="text-xs text-muted-foreground truncate">
                Multiple users can time the same Task
              </p>
            </div>
          </div>
          <Switch
            checked={props.allowConcurrentTasks}
            onCheckedChange={props.onAllowConcurrentTasksChange}
          />
        </div>

        <div className="flex items-center justify-between gap-3 py-1">
          <div className="flex items-center gap-2 min-w-0">
            <MaterialIcon name="local_shipping" size="sm" className="text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <Label className="text-sm">Allow concurrent shipment timers</Label>
              <p className="text-xs text-muted-foreground truncate">
                Multiple users can time the same Shipment step
              </p>
            </div>
          </div>
          <Switch
            checked={props.allowConcurrentShipments}
            onCheckedChange={props.onAllowConcurrentShipmentsChange}
          />
        </div>

        <div className="flex items-center justify-between gap-3 py-1">
          <div className="flex items-center gap-2 min-w-0">
            <MaterialIcon name="fact_check" size="sm" className="text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <Label className="text-sm">Allow concurrent stocktake timers</Label>
              <p className="text-xs text-muted-foreground truncate">
                Multiple users can count the same Stocktake together
              </p>
            </div>
          </div>
          <Switch
            checked={props.allowConcurrentStocktakes}
            onCheckedChange={props.onAllowConcurrentStocktakesChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}

