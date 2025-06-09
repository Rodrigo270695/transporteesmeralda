import React, { forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    value: string;
    onChange: (value: string) => void;
    icon?: LucideIcon;
    error?: string;
    rightElement?: React.ReactNode;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
    ({ className, value, onChange, icon: Icon, error, rightElement, ...inputProps }, ref) => {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            onChange(e.target.value);
        };

        // Filtramos props que podrían causar conflictos
        const {
            onKeyDown,
            onPaste,
            ...safeProps
        } = inputProps;

        return (
            <div className="relative">
                {/* Icono a la izquierda */}
                {Icon && (
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <Icon className={cn(
                            "h-4 w-4 transition-colors",
                            error ? "text-destructive" : "text-muted-foreground"
                        )} />
                    </div>
                )}

                <input
                    ref={ref}
                    className={cn(
                        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                        error && "border-destructive focus-visible:ring-destructive",
                        Icon && "pl-10",
                        rightElement && "pr-10",
                        className
                    )}
                    value={value}
                    onChange={handleChange}
                    onKeyDown={onKeyDown}
                    onPaste={onPaste}
                    {...safeProps}
                />

                {/* Elemento a la derecha */}
                {rightElement && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        {rightElement}
                    </div>
                )}
            </div>
        );
    }
);

FormInput.displayName = 'FormInput';

export { FormInput };
export type { FormInputProps };
