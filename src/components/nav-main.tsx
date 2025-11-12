"use client"

import { usePathname, useRouter } from "next/navigation"
import { ChevronRight, type LucideIcon } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url?: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
      icon?: LucideIcon
    }[]
  }[]
}) {
  const router = useRouter()
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  const hasActiveChild = (item: { items?: { url: string }[] }) => {
    if (!item.items) return false
    return item.items.some((subItem) => isActive(subItem.url))
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const Icon = item.icon
          
          // If item has submenu items, render as collapsible
          if (item.items && item.items.length > 0) {
            const hasActive = hasActiveChild(item)
            const defaultOpen = hasActive || item.isActive

            return (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={defaultOpen}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton 
                      tooltip={item.title} 
                      isActive={hasActive}
                      className="cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-sm"
                    >
                      {Icon && <Icon className="transition-transform duration-200 group-hover/collapsible:scale-110" />}
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => {
                        const SubIcon = subItem.icon
                        const subActive = isActive(subItem.url)

                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              isActive={subActive}
                              onClick={() => router.push(subItem.url)}
                              className="cursor-pointer transition-all duration-200 hover:translate-x-1 hover:scale-[1.02]"
                            >
                              {SubIcon && <SubIcon className="transition-transform duration-200 group-hover/menu-sub-item:scale-110" />}
                              <span>{subItem.title}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            )
          }

          // Regular menu item without submenu
          const active = item.url ? isActive(item.url) : false

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                onClick={() => item.url && router.push(item.url)}
                isActive={active}
                className="cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-sm"
              >
                {Icon && <Icon className="transition-transform duration-200 group-hover/menu-item:scale-110" />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

