/**
 * DocumentThumbnail Component
 * Displays first-page preview of a document with delete button
 */

import { useState, useEffect } from 'react';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { getDocumentSignedUrl } from '@/lib/scanner/uploadService';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface DocumentThumbnailProps {
  documentId: string;
  storageKey: string;
  fileName: string;
  label?: string | null;
  mimeType?: string;
  onRemove?: () => void;
  className?: string;
}

export function DocumentThumbnail({
  documentId,
  storageKey,
  fileName,
  label,
  mimeType,
  onRemove,
  className,
}: DocumentThumbnailProps) {
  const { toast } = useToast();
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [opening, setOpening] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadThumbnail = async () => {
      try {
        setLoading(true);
        setError(false);

        // For images, we can display directly
        if (mimeType?.startsWith('image/')) {
          const url = await getDocumentSignedUrl(storageKey);
          if (mounted) {
            setThumbnailUrl(url);
          }
        } else {
          // For PDFs and other documents, show file icon
          // In the future, we could generate thumbnails server-side
          if (mounted) {
            setThumbnailUrl(null);
          }
        }
      } catch (err) {
        console.error('Failed to load thumbnail:', err);
        if (mounted) {
          setError(true);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadThumbnail();

    return () => {
      mounted = false;
    };
  }, [storageKey, mimeType]);

  const displayName = label || fileName;
  const truncatedName = displayName.length > 12 
    ? displayName.substring(0, 10) + '...' 
    : displayName;

  const handleView = async () => {
    // Open a blank window immediately (popup blockers)
    const newWindow = window.open('about:blank', '_blank');
    setOpening(true);
    try {
      const url = await getDocumentSignedUrl(storageKey);
      if (newWindow) {
        newWindow.location.href = url;
      } else {
        window.location.href = url;
      }
    } catch (err) {
      if (newWindow) newWindow.close();
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to open document',
      });
    } finally {
      setOpening(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const url = await getDocumentSignedUrl(storageKey);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to download document',
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className={cn("relative group", className)}>
      <button
        type="button"
        onClick={handleView}
        className="aspect-square w-full rounded-lg border overflow-hidden bg-muted flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary/40"
        aria-label={`Open ${displayName}`}
        disabled={opening}
      >
        {loading ? (
          <MaterialIcon name="progress_activity" size="lg" className="animate-spin text-muted-foreground" />
        ) : thumbnailUrl && !error ? (
          <img
            src={thumbnailUrl}
            alt={displayName}
            className="w-full h-full object-cover"
            onError={() => setError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-2">
            <MaterialIcon name="description" className="text-muted-foreground" style={{ fontSize: '32px' }} />
          </div>
        )}
      </button>
      
      {/* Remove button */}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
        >
          <MaterialIcon name="close" style={{ fontSize: '12px' }} />
        </button>
      )}

      {/* Download button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          void handleDownload();
        }}
        className="absolute top-1 left-1 p-1 bg-background/80 text-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label={`Download ${displayName}`}
        disabled={downloading}
      >
        <MaterialIcon
          name={downloading ? 'progress_activity' : 'download'}
          style={{ fontSize: '12px' }}
          className={downloading ? 'animate-spin' : undefined}
        />
      </button>
      
      {/* File name */}
      <p className="mt-1 text-xs text-muted-foreground text-center truncate" title={displayName}>
        {truncatedName}
      </p>
    </div>
  );
}
