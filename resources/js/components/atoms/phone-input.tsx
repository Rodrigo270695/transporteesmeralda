import React, { forwardRef } from 'react';
import { Phone } from 'lucide-react';
import { FormInput } from './form-input';
import { cn } from '@/lib/utils';

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'maxLength' | 'onChange' | 'onKeyDown' | 'onPaste'> {
    value: string;
    onChange: (value: string) => void;
    error?: string;
}

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
    ({ className, value, onChange, error, ...props }, ref) => {
        const handleChange = (inputValue: string) => {
            // Solo permitir números y máximo 9 dígitos
            const numericValue = inputValue.replace(/\D/g, '').slice(0, 9);
            onChange(numericValue);
        };

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            // Permitir teclas de control
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
                (e.key === 'a' && e.ctrlKey) ||
                (e.key === 'c' && e.ctrlKey) ||
                (e.key === 'v' && e.ctrlKey) ||
                (e.key === 'x' && e.ctrlKey)
            ) {
                return;
            }

            // Prevenir entrada si ya tiene 9 dígitos
            if (value.length >= 9 && /\d/.test(e.key)) {
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
            const numericValue = pastedText.replace(/\D/g, '').slice(0, 9);
            onChange(numericValue);
        };

        // Contador de dígitos con validación
        const counterElement = (
            <span className={cn(
                "text-xs font-medium tabular-nums transition-colors px-1.5 py-0.5 rounded-sm",
                value.length === 9
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground",
                error && "text-destructive"
            )}>
                {value.length}/9
            </span>
        );

        return (
            <FormInput
                ref={ref}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                icon={Phone}
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

PhoneInput.displayName = 'PhoneInput';

export { PhoneInput };
