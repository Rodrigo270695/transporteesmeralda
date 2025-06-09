import { Icon } from '@/components/atoms/icon';
import {
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface NavMenuItemProps {
    item: NavItem;
}

export function NavMenuItem({ item }: NavMenuItemProps) {
    const page = usePage();
    const [isOpen, setIsOpen] = useState(false);

    // Si el item tiene submenús
    if (item.items && item.items.length > 0) {
        return (
            <Collapsible asChild open={isOpen} onOpenChange={setIsOpen}>
                <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                            tooltip={{ children: item.title }}
                            className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                        >
                            {item.icon && <Icon iconNode={item.icon} />}
                            <span>{item.title}</span>
                            {item.badge && (
                                <span className="ml-auto inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                                    {item.badge}
                                </span>
                            )}
                            <ChevronRight className="ml-auto transition-transform group-data-[state=open]:rotate-90" />
                        </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <SidebarMenuSub>
                            {item.items.map((subItem) => (
                                <SidebarMenuSubItem key={subItem.title}>
                                    <SidebarMenuSubButton
                                        asChild
                                        isActive={subItem.href === page.url}
                                        className="cursor-pointer"
                                    >
                                        <Link href={subItem.href!} prefetch>
                                            {subItem.icon && <Icon iconNode={subItem.icon} />}
                                            <span>{subItem.title}</span>
                                            {subItem.badge && (
                                                <span className="ml-auto inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                                                    {subItem.badge}
                                                </span>
                                            )}
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                            ))}
                        </SidebarMenuSub>
                    </CollapsibleContent>
                </SidebarMenuItem>
            </Collapsible>
        );
    }

    // Si es un item simple sin submenús
    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                asChild
                isActive={item.href === page.url}
                tooltip={{ children: item.title }}
                className="cursor-pointer"
            >
                <Link href={item.href!} prefetch>
                    {item.icon && <Icon iconNode={item.icon} />}
                    <span>{item.title}</span>
                    {item.badge && (
                        <span className="ml-auto inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                            {item.badge}
                        </span>
                    )}
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}
