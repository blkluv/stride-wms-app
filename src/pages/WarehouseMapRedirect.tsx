import { useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSelectedWarehouse } from '@/contexts/WarehouseContext';

/**
 * Convenience route so nav can point to a static href.
 * Redirects to `/warehouses/:warehouseId/map` using the currently-selected warehouse.
 */
export default function WarehouseMapRedirect() {
  const navigate = useNavigate();
  const { warehouses, selectedWarehouseId, setSelectedWarehouseId, loading } = useSelectedWarehouse();

  const selectedWarehouse = useMemo(
    () => warehouses.find((w) => w.id === selectedWarehouseId) || null,
    [warehouses, selectedWarehouseId]
  );

  if (selectedWarehouseId) {
    return <Navigate to={`/warehouses/${selectedWarehouseId}/map`} replace />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-20">
        <div className="flex items-start justify-between gap-3">
          <PageHeader
            primaryText="Map"
            accentText="Builder"
            description="Select a warehouse to open the builder."
          />
        </div>

        <Card>
          <CardContent className="py-8">
            {loading ? (
              <div className="flex items-center justify-center text-muted-foreground">
                <MaterialIcon name="progress_activity" className="animate-spin mr-2" />
                Loading warehouses…
              </div>
            ) : warehouses.length === 0 ? (
              <div className="text-center text-muted-foreground">
                No warehouses found.
              </div>
            ) : (
              <div className="mx-auto max-w-md space-y-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Warehouse</div>
                  <Select
                    value={selectedWarehouseId ?? ''}
                    onValueChange={(v) => {
                      setSelectedWarehouseId(v || null);
                      if (v) {
                        navigate(`/warehouses/${v}/map`);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((wh) => (
                        <SelectItem key={wh.id} value={wh.id}>
                          {wh.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full"
                  disabled={!selectedWarehouse}
                  onClick={() => {
                    if (selectedWarehouse) {
                      navigate(`/warehouses/${selectedWarehouse.id}/map`);
                    }
                  }}
                >
                  Open Map Builder
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

