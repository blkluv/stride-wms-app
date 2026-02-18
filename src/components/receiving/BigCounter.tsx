import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MaterialIcon } from '@/components/ui/MaterialIcon';

interface BigCounterProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  step?: number;
  label?: string;
  id?: string;
  disabled?: boolean;
}

/**
 * Touch-friendly counter for numeric input on dock-intake screens.
 * Large display (text-5xl), 48px+ touch targets for +/- buttons.
 * Tap the number to switch to inline numeric editing.
 */
export function BigCounter({
  value,
  onChange,
  min = 0,
  step = 1,
  label,
  id,
  disabled = false,
}: BigCounterProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync editValue when value changes externally
  useEffect(() => {
    if (!editing) {
      setEditValue(String(value));
    }
  }, [value, editing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const decrement = () => {
    if (disabled) return;
    const next = Math.max(min, value - step);
    onChange(next);
  };

  const increment = () => {
    if (disabled) return;
    onChange(value + step);
  };

  const handleEditStart = () => {
    if (disabled) return;
    setEditValue(String(value));
    setEditing(true);
  };

  const commitEdit = () => {
    const parsed = parseInt(editValue, 10);
    if (!isNaN(parsed) && parsed >= min) {
      onChange(parsed);
    }
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      commitEdit();
    } else if (e.key === 'Escape') {
      setEditing(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {label && (
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      )}
      <div className="flex items-center gap-3">
        {/* Minus button — 48px min touch target */}
        <Button
          variant="outline"
          size="icon"
          className="min-h-12 min-w-12 rounded-full text-lg"
          onClick={decrement}
          disabled={disabled || value <= min}
          aria-label="Decrease"
        >
          <MaterialIcon name="remove" size="md" />
        </Button>

        {/* Number display / inline edit */}
        {editing ? (
          <Input
            ref={inputRef}
            id={id}
            type="number"
            min={min}
            step={step}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="w-24 text-center text-3xl font-bold h-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        ) : (
          <button
            type="button"
            onClick={handleEditStart}
            disabled={disabled}
            className="min-w-20 text-center text-5xl font-bold tabular-nums cursor-pointer hover:text-primary transition-colors select-none disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Tap to edit value"
          >
            {value}
          </button>
        )}

        {/* Plus button — 48px min touch target */}
        <Button
          variant="outline"
          size="icon"
          className="min-h-12 min-w-12 rounded-full text-lg"
          onClick={increment}
          disabled={disabled}
          aria-label="Increase"
        >
          <MaterialIcon name="add" size="md" />
        </Button>
      </div>
    </div>
  );
}
