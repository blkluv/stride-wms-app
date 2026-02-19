import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { cn } from '@/lib/utils';
import { useWarehouseMaps } from '@/hooks/useWarehouseMaps';
import { useWarehouseMapZoneCapacity } from '@/hooks/useWarehouseMapZoneCapacity';
import { usePermissions } from '@/hooks/usePermissions';

function getHeatFill(utilizationPct: number | null): string {
  if (utilizationPct === null || !Number.isFinite(utilizationPct)) return '#e5e7eb';
  if (utilizationPct > 100) return '#7f1d1d';
  if (utilizationPct >= 80) return '#ef4444';
  if (utilizationPct >= 50) return '#f59e0b';
  return '#22c55e';
}

function formatTime(dt: Date | null): string {
  if (!dt) return '—';
  return dt.toLocaleString();
}

export function HeatMapHeroTile({ warehouseId, className }: { warehouseId: string; className?: string }) {
  const navigate = useNavigate();
  const { hasRole } = usePermissions();
  const canView = hasRole('admin') || hasRole('tenant_admin') || hasRole('manager') || hasRole('warehouse') || hasRole('warehouse_staff');

  const { getDefaultMap } = useWarehouseMaps(warehouseId);
  const defaultMap = getDefaultMap();

  const {
    rows,
    loading,
    lastRefreshedAt,
    refetch,
  } = useWarehouseMapZoneCapacity(defaultMap?.id);

  const stats = useMemo(() => {
    const warning = rows.filter((r) => r.state === 'WARNING').length;
    const critical = rows.filter((r) => r.state === 'CRITICAL').length;
    const tracked = rows.filter((r) => r.utilization_pct != null);
    const avg =
      tracked.length > 0
        ? tracked.reduce((sum, r) => sum + Number(r.utilization_pct || 0), 0) / tracked.length
        : null;

    return { warning, critical, avg };
  }, [rows]);

  // Hide the tile entirely if the warehouse has no default map configured.
  if (!canView || !defaultMap) {
    return null;
  }

  const mapWidth = defaultMap.width ?? 2000;
  const mapHeight = defaultMap.height ?? 1200;

  return (
    <Card
      className={cn(
        'relative overflow-hidden cursor-pointer hover:shadow-lg transition-shadow',
        className
      )}
      onClick={() => navigate(`/warehouses/${warehouseId}/heatmap`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/warehouses/${warehouseId}/heatmap`);
        }
      }}
      data-testid="dashboard-heatmap-hero"
    >
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
        <div>
          <CardTitle className="text-[11px] font-semibold tracking-wide text-muted-foreground">
            HEAT MAP (PREVIEW)
          </CardTitle>
          <CardDescription className="text-xs">
            Last refreshed: {formatTime(lastRefreshedAt)}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {stats.warning > 0 && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              Warning: {stats.warning}
            </Badge>
          )}
          {stats.critical > 0 && (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              Critical: {stats.critical}
            </Badge>
          )}
          {stats.avg != null && (
            <Badge variant="outline" className="text-xs">
              Avg: {stats.avg.toFixed(0)}%
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              refetch();
            }}
            disabled={loading}
            title="Refresh"
          >
            <MaterialIcon name="refresh" size="sm" className={cn(loading && 'animate-spin')} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="h-[420px] w-full bg-background">
          <svg viewBox={`0 0 ${mapWidth} ${mapHeight}`} className="h-full w-full">
            {rows.map((r) => {
              const fill = getHeatFill(r.utilization_pct);
              return (
                <rect
                  key={r.node_id}
                  x={r.x}
                  y={r.y}
                  width={r.width}
                  height={r.height}
                  fill={fill}
                  fillOpacity={0.85}
                  stroke="rgba(100,116,139,0.7)"
                  strokeWidth={1}
                />
              );
            })}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}

