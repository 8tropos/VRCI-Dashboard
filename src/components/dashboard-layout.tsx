"use client"

import { usePathname } from "next/navigation"
import { PanelRightOpen } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { AccountMappingAlert } from "@/components/account-mapping-alert"
import { RightDrawerProvider, useRightDrawer } from "@/components/right-drawer"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type BreadcrumbItem = {
  label: string
  href: string
  isPage?: boolean
}

function getBreadcrumbFromPath(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  
  if (segments.length === 0) {
    return [{ label: 'Dashboard', href: '/' }]
  }

  const breadcrumbs: BreadcrumbItem[] = [{ label: 'Dashboard', href: '/' }]
  
  const routeLabels: Record<string, string> = {
    oracle: 'Oracle',
    registry: 'Registry',
    token: 'Token',
    portfolio: 'Portfolio',
    staking: 'Staking',
    dex: 'DEX',
    check: 'System Checks',
    development: 'Development',
    production: 'Production',
    analytics: 'Analytics',
    admin: 'Admin',
  }

  let currentPath = ''
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`
    const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
    if (index === segments.length - 1) {
      breadcrumbs.push({ label, href: currentPath, isPage: true })
    } else {
      breadcrumbs.push({ label, href: currentPath })
    }
  })

  return breadcrumbs
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RightDrawerProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </RightDrawerProvider>
  )
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const breadcrumbs = getBreadcrumbFromPath(pathname)
  const { openDrawer } = useRightDrawer()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => (
                  <div key={crumb.href} className="flex items-center">
                    {index > 0 && <BreadcrumbSeparator className="mx-2" />}
                    <BreadcrumbItem className={index === 0 ? "hidden md:block" : ""}>
                      {crumb.isPage ? (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={crumb.href}>
                          {crumb.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto flex items-center gap-2 px-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Open drawer"
                    onClick={openDrawer}
                  >
                    <PanelRightOpen className="size-4" />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">Open drawer</TooltipContent>
            </Tooltip>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <AccountMappingAlert />
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
