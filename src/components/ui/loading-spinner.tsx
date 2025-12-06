import { ComponentProps } from "react"
import { cn } from "@/lib/utils"

export const LoadingSpinner = ({ className, ...props }: ComponentProps<"div">) => {
    return (
        <div className={cn("flex items-center justify-center min-h-screen", className)} {...props}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    )
}
