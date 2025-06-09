import React, { forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimpleInputProps {
    id?: string;
    type?: string;
    value: string;
    onChange: (value: string) => void;
    icon?: LucideIcon;
    placeholder?: string;
    required?: boolean;
    maxLength?: number;
    pattern?: string;
    inputMode?: 'text' | 'numeric' | 'tel' | 'email';
    className?: string;
    rightElement?: React.ReactNode;
    error?: string;
}

const SimpleInput = forwardRef<HTMLInputElement, SimpleInputProps>(
    ({
        id,
        type = 'text',
        value,
        onChange,
        icon: Icon,
        placeholder,
        required,
        maxLength,
        pattern,
        inputMode,
        className,
        rightElement,
        error,
        ...rest
    }, ref) => {

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            onChange(e.target.value);
        };

        return (
            <div className="relative">
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
                    id={id}
                    type={type}
                    inputMode={inputMode}
                    pattern={pattern}
                    className={cn(
                        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                        error && "border-destructive focus-visible:ring-destructive",
                        Icon && "pl-10",
                        rightElement && "pr-10",
                        className
                    )}
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    required={required}
                    maxLength={maxLength}
                />

                {rightElement && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        {rightElement}
                    </div>
                )}
            </div>
        );
    }
);

SimpleInput.displayName = 'SimpleInput';

export { SimpleInput };
