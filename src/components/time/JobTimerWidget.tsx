import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useJobTimer, type JobType } from '@/hooks/useJobTimer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { cn } from '@/lib/utils';
import { formatMinutesShort } from '@/lib/time/serviceTimeEstimate';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type TimerState = ReturnType<typeof useJobTimer>;

function getJobTypeLabel(jobType: string): string {
  const lower = (jobType || '').toLowerCase();
  if (lower === 'task') return 'task';
  if (lower === 'shipment') return 'shipment';
  if (lower === 'stocktake') return 'stocktake';
  return 'job';
}

export function JobTimerWidget(props: {
  jobType: JobType;
  jobId: string | undefined;
  variant?: 'inline' | 'card';
  showControls?: boolean;
  showTime?: boolean;
  showStatus?: boolean;
  className?: string;
}) {
  const timer = useJobTimer(props.jobType, props.jobId);
  return (
    <JobTimerWidgetFromState
      timer={timer}
      jobType={props.jobType}
      jobId={props.jobId}
      variant={props.variant}
      showControls={props.showControls}
      showTime={props.showTime}
      showStatus={props.showStatus}
      className={props.className}
    />
  );
}

export function JobTimerWidgetFromState(props: {
  timer: TimerState;
  jobType: JobType;
  jobId: string | undefined;
  variant?: 'inline' | 'card';
  showControls?: boolean;
  showTime?: boolean;
  showStatus?: boolean;
  className?: string;
}) {
  const { toast } = useToast();

  const variant = props.variant ?? 'inline';
  const showControls = props.showControls ?? false;
  const showTime = props.showTime ?? true;
  const showStatus = props.showStatus ?? true;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [activeJobTypeLabel, setActiveJobTypeLabel] = useState<string | null>(null);

  // If job changes, close confirm dialog
  useEffect(() => {
    setConfirmOpen(false);
    setConfirmLoading(false);
    setActiveJobTypeLabel(null);
  }, [props.jobType, props.jobId]);

  const timeLabel = useMemo(() => formatMinutesShort(props.timer.laborMinutes), [props.timer.laborMinutes]);

  const statusBadge = !showStatus ? null : props.timer.isActiveForMe ? (
    <Badge variant="secondary" className="text-xs">
      <span className="inline-flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        Active
      </span>
    </Badge>
  ) : props.timer.isPausedForMe ? (
    <Badge variant="outline" className="text-xs">
      Paused
    </Badge>
  ) : null;

  const handlePause = async () => {
    const res = await props.timer.pause();
    if (!res.ok) {
      toast({ variant: 'destructive', title: 'Pause failed', description: res.error_message || 'Unable to pause timer' });
      return;
    }
    toast({ title: 'Paused', description: 'Timer paused. Resume when ready.' });
  };

  const handleResume = async (pauseExisting: boolean) => {
    const res = await props.timer.startOrResume({ pauseExisting });
    if (!res.ok) {
      if (res.error_code === 'ACTIVE_TIMER_EXISTS' && !pauseExisting) {
        setActiveJobTypeLabel(res.active_job_type ? getJobTypeLabel(res.active_job_type) : 'job');
        setConfirmOpen(true);
        return;
      }
      toast({ variant: 'destructive', title: 'Resume failed', description: res.error_message || 'Unable to resume timer' });
      return;
    }
    toast({ title: 'Resumed', description: pauseExisting ? 'Paused your other job and resumed this one.' : 'Timer resumed.' });
  };

  const content = (
    <div className={cn('flex items-center gap-2 flex-wrap', props.className)}>
      {showTime && (
        <Badge variant="secondary" className="text-xs tabular-nums whitespace-nowrap">
          Time: {timeLabel}
        </Badge>
      )}
      {statusBadge}

      {showControls && (
        <div className="flex items-center gap-2">
          {props.timer.isActiveForMe ? (
            <Button size="sm" variant="outline" onClick={handlePause} disabled={props.timer.loading}>
              <MaterialIcon name="pause" size="sm" className="mr-1.5" />
              Pause
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => handleResume(false)} disabled={props.timer.loading}>
              <MaterialIcon name="play_arrow" size="sm" className="mr-1.5" />
              Resume
            </Button>
          )}
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pause current {activeJobTypeLabel || 'job'}?</AlertDialogTitle>
            <AlertDialogDescription>
              You already have a job in progress. Do you want to pause it and resume this timer?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirmLoading} onClick={() => setActiveJobTypeLabel(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={confirmLoading}
              onClick={async (e) => {
                e.preventDefault();
                setConfirmLoading(true);
                try {
                  await handleResume(true);
                  setConfirmOpen(false);
                  setActiveJobTypeLabel(null);
                } finally {
                  setConfirmLoading(false);
                }
              }}
            >
              Pause & Resume
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  if (variant === 'card') {
    return (
      <div className={cn('border rounded-lg p-3 bg-card', props.className)}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MaterialIcon name="timer" size="sm" className="text-muted-foreground" />
            <span className="text-sm font-medium">Timer</span>
          </div>
          {content}
        </div>
        {props.timer.error && (
          <div className="text-xs text-muted-foreground mt-2">
            Timer unavailable: {props.timer.error}
          </div>
        )}
      </div>
    );
  }

  return content;
}

