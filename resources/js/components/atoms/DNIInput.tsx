import React, { forwardRef } from 'react';
import { IdCard } from 'lucide-react';
import { FormInput } from './form-input';
import { cn } from '@/lib/utils';

interface DNIInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'maxLength' | 'onChange' | 'onKeyDown' | 'onPaste'> {
    value: string;
    onChange: (value: string) => void;
    error?: string;
}

const DNIInput = forwardRef<HTMLInputElement, DNIInputProps>(
    ({ className, value, onChange, error, ...props }, ref) => {
        const handleChange = (inputValue: string) => {
            // Solo permitir números y máximo 8 dígitos
            const numericValue = inputValue.replace(/\D/g, '').slice(0, 8);
            onChange(numericValue);
        };

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            // Permitir teclas de control (backspace, delete, tab, escape, enter, etc.)
            if (
                e.key === 'Backspace' ||
                e.key === 'Delete' ||
                e.key === 'Tab' ||
                e.key === 'Escape' ||
                e.key === 'Enter' ||
                e.key === 'ArrowLeft' ||
                e.key === 'ArrowRight' ||
                e.key === 'ArrowUp' ||
                e.key === 'ArrowDown' ||
                (e.key === 'a' && e.ctrlKey) || // Ctrl+A
                (e.key === 'c' && e.ctrlKey) || // Ctrl+C
                (e.key === 'v' && e.ctrlKey) || // Ctrl+V
                (e.key === 'x' && e.ctrlKey)    // Ctrl+X
            ) {
                return;
            }

            // Prevenir entrada si ya tiene 8 dígitos
            if (value.length >= 8 && /\d/.test(e.key)) {
                e.preventDefault();
                return;
            }

            // Solo permitir números
            if (!/\d/.test(e.key)) {
                e.preventDefault();
            }
        };

        const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
            e.preventDefault();
            const pastedText = e.clipboardData.getData('text');
            const numericValue = pastedText.replace(/\D/g, '').slice(0, 8);
            onChange(numericValue);
        };

        // Contador de dígitos
        const counterElement = (
            <span className={cn(
                "text-xs font-medium tabular-nums transition-colors px-1.5 py-0.5 rounded-sm",
                value.length === 8
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground",
                error && "text-destructive"
            )}>
                {value.length}/8
            </span>
        );

        return (
            <FormInput
                ref={ref}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                icon={IdCard}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                rightElement={counterElement}
                error={error}
                className={className}
                {...props}
            />
        );
    }
);

DNIInput.displayName = 'DNIInput';

export { DNIInput };
