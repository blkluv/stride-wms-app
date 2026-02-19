import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { format } from 'date-fns';
import { formatMinutesShort } from '@/lib/time/serviceTimeEstimate';

type JobTypeFilter = 'all' | 'task' | 'shipment' | 'stocktake';
type SortField = 'completed_at' | 'job_type' | 'estimated' | 'actual' | 'variance';
type SortDirection = 'asc' | 'desc';

type ServiceTimeMeta = {
  estimated_minutes?: number;
  estimated_snapshot_at?: string;
  actual_labor_minutes?: number;
  actual_cycle_minutes?: number;
  actual_snapshot_at?: string;
};

type ServiceTimeRow = {
  jobType: 'task' | 'shipment' | 'stocktake';
  jobId: string;
  label: string;
  completedAt: string | null;
  estimatedMinutes: number | null;
  actualMinutes: number | null;
  varianceMinutes: number | null;
  url: string;
};

function safeNumber(value: unknown): number | null {
  if (typeof value !== 'number') return null;
  if (!Number.isFinite(value)) return null;
  return value;
}

function safeString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const s = value.trim();
  return s ? s : null;
}

function normalizeMetaServiceTime(metadata: any): ServiceTimeMeta | null {
  const st = metadata?.service_time;
  if (!st || typeof st !== 'object') return null;
  return st as ServiceTimeMeta;
}

function formatDateTimeShort(iso: string) {
  try {
    return format(new Date(iso), 'MMM d, yyyy h:mm a');
  } catch {
    return iso;
  }
}

export function ServiceTimeTab() {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [jobType, setJobType] = useState<JobTypeFilter>('all');

  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return format(d, 'yyyy-MM-dd');
  });
  const [dateTo, setDateTo] = useState(() => format(new Date(), 'yyyy-MM-dd'));

  const [sortField, setSortField] = useState<SortField>('completed_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const [rows, setRows] = useState<ServiceTimeRow[]>([]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <MaterialIcon name="swap_vert" size="sm" className="opacity-50" />;
    return sortDirection === 'asc'
      ? <MaterialIcon name="arrow_upward" size="sm" />
      : <MaterialIcon name="arrow_downward" size="sm" />;
  };

  const fetchData = async () => {
    if (!profile?.tenant_id) return;
    setLoading(true);
    try {
      const startIso = `${dateFrom}T00:00:00`;
      const endIso = `${dateTo}T23:59:59`;

      const wantsTasks = jobType === 'all' || jobType === 'task';
      const wantsShipments = jobType === 'all' || jobType === 'shipment';
      const wantsStocktakes = jobType === 'all' || jobType === 'stocktake';

      const tasksPromise = wantsTasks
        ? (supabase.from('tasks') as any)
            .select('id, title, task_type, completed_at, duration_minutes, metadata')
            .eq('tenant_id', profile.tenant_id)
            .is('deleted_at', null)
            .gte('completed_at', startIso)
            .lte('completed_at', endIso)
        : Promise.resolve({ data: [] as any[], error: null as any });

      const shipmentsPromise = wantsShipments
        ? (supabase.from('shipments') as any)
            .select('id, shipment_number, shipment_type, status, completed_at, received_at, metadata')
            .eq('tenant_id', profile.tenant_id)
            .is('deleted_at', null)
            // inbound uses received_at, outbound uses completed_at
            .or(`and(completed_at.gte.${startIso},completed_at.lte.${endIso}),and(received_at.gte.${startIso},received_at.lte.${endIso})`)
        : Promise.resolve({ data: [] as any[], error: null as any });

      const stocktakesPromise = wantsStocktakes
        ? (supabase.from('stocktakes') as any)
            .select('id, stocktake_number, name, status, closed_at, duration_minutes, metadata')
            .eq('tenant_id', profile.tenant_id)
            .is('deleted_at', null)
            .gte('closed_at', startIso)
            .lte('closed_at', endIso)
        : Promise.resolve({ data: [] as any[], error: null as any });

      const [tasksRes, shipmentsRes, stocktakesRes] = await Promise.all([
        tasksPromise,
        shipmentsPromise,
        stocktakesPromise,
      ]);

      if (tasksRes.error) throw tasksRes.error;
      if (shipmentsRes.error) throw shipmentsRes.error;
      if (stocktakesRes.error) throw stocktakesRes.error;

      const next: ServiceTimeRow[] = [];

      for (const t of tasksRes.data || []) {
        const meta = normalizeMetaServiceTime(t.metadata);
        const est = safeNumber(meta?.estimated_minutes) ?? null;
        const actualFromMeta = safeNumber(meta?.actual_labor_minutes);
        const actualFromCol = safeNumber(t.duration_minutes);
        const actual = actualFromMeta ?? actualFromCol ?? null;
        const variance = est != null && actual != null ? Math.round(actual - est) : null;
        next.push({
          jobType: 'task',
          jobId: String(t.id),
          label: t.title || (t.task_type ? `${t.task_type} task` : 'Task'),
          completedAt: safeString(t.completed_at),
          estimatedMinutes: est != null ? Math.round(est) : null,
          actualMinutes: actual != null ? Math.round(actual) : null,
          varianceMinutes: variance,
          url: `/tasks/${t.id}`,
        });
      }

      for (const s of shipmentsRes.data || []) {
        const meta = normalizeMetaServiceTime(s.metadata);
        const est = safeNumber(meta?.estimated_minutes) ?? null;
        const actual = safeNumber(meta?.actual_labor_minutes) ?? null;

        // Prefer snapshot timestamps, then completed_at/received_at
        const completedAt =
          safeString(meta?.actual_snapshot_at)
          ?? safeString(s.completed_at)
          ?? safeString(s.received_at);

        const variance = est != null && actual != null ? Math.round(actual - est) : null;
        next.push({
          jobType: 'shipment',
          jobId: String(s.id),
          label: s.shipment_number ? `Shipment ${s.shipment_number}` : 'Shipment',
          completedAt,
          estimatedMinutes: est != null ? Math.round(est) : null,
          actualMinutes: actual != null ? Math.round(actual) : null,
          varianceMinutes: variance,
          url: `/shipments/${s.id}`,
        });
      }

      for (const st of stocktakesRes.data || []) {
        const meta = normalizeMetaServiceTime(st.metadata);
        const est = safeNumber(meta?.estimated_minutes) ?? null;
        const actualFromMeta = safeNumber(meta?.actual_labor_minutes);
        const actualFromCol = safeNumber(st.duration_minutes);
        const actual = actualFromMeta ?? actualFromCol ?? null;
        const completedAt =
          safeString(meta?.actual_snapshot_at)
          ?? safeString(st.closed_at);
        const variance = est != null && actual != null ? Math.round(actual - est) : null;
        next.push({
          jobType: 'stocktake',
          jobId: String(st.id),
          label: st.name || (st.stocktake_number ? `Stocktake ${st.stocktake_number}` : 'Stocktake'),
          completedAt,
          estimatedMinutes: est != null ? Math.round(est) : null,
          actualMinutes: actual != null ? Math.round(actual) : null,
          varianceMinutes: variance,
          url: `/stocktakes/${st.id}/report`,
        });
      }

      setRows(next);
    } catch (err: any) {
      console.error('[ServiceTimeTab] fetch error:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err?.message || 'Failed to load service time report',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.tenant_id, jobType, dateFrom, dateTo]);

  const computed = useMemo(() => {
    const filtered = rows.filter((r) => {
      if (jobType === 'all') return true;
      return r.jobType === jobType;
    });

    const sorted = [...filtered].sort((a, b) => {
      const dir = sortDirection === 'asc' ? 1 : -1;
      const getComparable = (row: ServiceTimeRow) => {
        switch (sortField) {
          case 'completed_at':
            return row.completedAt ? new Date(row.completedAt).getTime() : 0;
          case 'job_type':
            return row.jobType;
          case 'estimated':
            return row.estimatedMinutes ?? -1;
          case 'actual':
            return row.actualMinutes ?? -1;
          case 'variance':
            return row.varianceMinutes ?? -999999;
        }
      };

      const av = getComparable(a) as any;
      const bv = getComparable(b) as any;

      if (typeof av === 'number' && typeof bv === 'number') return dir * (av - bv);
      return dir * String(av).localeCompare(String(bv));
    });

    const totalEstimated = sorted.reduce((sum, r) => sum + (r.estimatedMinutes ?? 0), 0);
    const totalActual = sorted.reduce((sum, r) => sum + (r.actualMinutes ?? 0), 0);
    const withEstimate = sorted.filter(r => (r.estimatedMinutes ?? 0) > 0).length;
    const withActual = sorted.filter(r => (r.actualMinutes ?? 0) > 0).length;

    return {
      rows: sorted,
      total: sorted.length,
      totalEstimated,
      totalActual,
      withEstimate,
      withActual,
      delta: totalEstimated > 0 && totalActual > 0 ? Math.round(totalActual - totalEstimated) : null,
    };
  }, [rows, jobType, sortDirection, sortField]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MaterialIcon name="schedule" size="sm" />
            Service Time Report
          </CardTitle>
          <CardDescription>
            Estimated vs actual service time across Tasks, Shipments, and Stocktakes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1.5">
              <Label>Date from</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Date to</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Job type</Label>
              <Select value={jobType} onValueChange={(v) => setJobType(v as JobTypeFilter)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="task">Tasks</SelectItem>
                  <SelectItem value="shipment">Shipments</SelectItem>
                  <SelectItem value="stocktake">Stocktakes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" onClick={fetchData} disabled={loading}>
                <MaterialIcon name="refresh" size="sm" className={loading ? 'animate-spin mr-2' : 'mr-2'} />
                Refresh
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="tabular-nums">
              Jobs: {computed.total}
            </Badge>
            <Badge variant="secondary" className="tabular-nums">
              Est Total: {formatMinutesShort(computed.totalEstimated)}
            </Badge>
            <Badge variant="secondary" className="tabular-nums">
              Actual Total: {formatMinutesShort(computed.totalActual)}
            </Badge>
            {computed.delta != null && (
              <Badge variant="outline" className="tabular-nums">
                Delta: {computed.delta >= 0 ? '+' : ''}{formatMinutesShort(Math.abs(computed.delta))}
              </Badge>
            )}
            <Badge variant="outline" className="tabular-nums">
              With Est: {computed.withEstimate}
            </Badge>
            <Badge variant="outline" className="tabular-nums">
              With Actual: {computed.withActual}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead role="button" onClick={() => handleSort('job_type')} className="whitespace-nowrap">
                  Type <SortIcon field="job_type" />
                </TableHead>
                <TableHead>Job</TableHead>
                <TableHead role="button" onClick={() => handleSort('completed_at')} className="whitespace-nowrap">
                  Completed <SortIcon field="completed_at" />
                </TableHead>
                <TableHead role="button" onClick={() => handleSort('estimated')} className="whitespace-nowrap">
                  Est <SortIcon field="estimated" />
                </TableHead>
                <TableHead role="button" onClick={() => handleSort('actual')} className="whitespace-nowrap">
                  Actual <SortIcon field="actual" />
                </TableHead>
                <TableHead role="button" onClick={() => handleSort('variance')} className="whitespace-nowrap">
                  Variance <SortIcon field="variance" />
                </TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {computed.rows.map((r) => (
                <TableRow key={`${r.jobType}:${r.jobId}`} className="hover:bg-muted/40">
                  <TableCell className="capitalize">{r.jobType}</TableCell>
                  <TableCell className="min-w-0">
                    <div className="truncate font-medium">{r.label}</div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {r.completedAt ? formatDateTimeShort(r.completedAt) : '-'}
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {r.estimatedMinutes != null && r.estimatedMinutes > 0 ? formatMinutesShort(r.estimatedMinutes) : '-'}
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {r.actualMinutes != null && r.actualMinutes > 0 ? formatMinutesShort(r.actualMinutes) : '-'}
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {r.varianceMinutes != null ? (
                      <span className={r.varianceMinutes > 0 ? 'text-red-500' : r.varianceMinutes < 0 ? 'text-green-500' : ''}>
                        {r.varianceMinutes > 0 ? '+' : ''}{formatMinutesShort(Math.abs(r.varianceMinutes))}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => window.location.assign(r.url)}>
                      Open
                      <MaterialIcon name="chevron_right" size="sm" className="ml-1" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {computed.rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                    {loading ? 'Loading…' : 'No jobs found for this date range.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

