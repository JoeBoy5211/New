import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
    className?: string;
    size?: number;
    fullPage?: boolean;
    text?: string;
}

export function LoadingSpinner({
    className,
    size = 32,
    fullPage = false,
    text = "Loading...",
}: LoadingSpinnerProps) {
    const spinner = (
        <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
            <Loader2
                className="animate-spin text-primary"
                size={size}
            />
            {text && <p className="text-sm font-medium text-muted-foreground">{text}</p>}
        </div>
    );

    if (fullPage) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                {spinner}
            </div>
        );
    }

    return spinner;
}
