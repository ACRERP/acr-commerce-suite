import { ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ActionSidebarProps {
    children: ReactNode;
    title?: string;
}

export function ActionSidebar({ children, title = "Ações Rápidas" }: ActionSidebarProps) {
    return (
        <aside className="w-[220px] flex-shrink-0 flex flex-col gap-4">
            <div className="bg-white dark:bg-neutral-900 border border-border shadow-sm rounded-lg overflow-hidden sticky top-24">
                <div className="p-3 border-b border-border bg-gray-50/50 dark:bg-neutral-900/50">
                    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                </div>
                <div className="p-3 space-y-2">
                    {children}
                </div>
            </div>

            {/* Space for future widgets (e.g. Help, Recent Activity) */}
        </aside>
    );
}
