"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

export type RightDrawerPanel = {
  id?: string
  title: string
  description?: string
  content: ReactNode
  footer?: ReactNode
}

type RightDrawerContextValue = {
  hasContent: boolean
  isOpen: boolean
  closeDrawer: () => void
  openDrawer: () => void
  setDrawerPanel: (panel: RightDrawerPanel) => void
  clearDrawerPanel: (panelId?: string) => void
}

const RightDrawerContext = createContext<RightDrawerContextValue | null>(null)

export function RightDrawerProvider({ children }: { children: ReactNode }) {
  const [panel, setPanel] = useState<RightDrawerPanel | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const setDrawerPanel = useCallback((nextPanel: RightDrawerPanel) => {
    setPanel(nextPanel)
    setIsOpen(true)
  }, [])

  const clearDrawerPanel = useCallback((panelId?: string) => {
    if (panelId && panel?.id !== panelId) {
      return
    }

    setPanel(null)
    setIsOpen(false)
  }, [panel?.id])

  const value = useMemo<RightDrawerContextValue>(
    () => ({
      hasContent: Boolean(panel),
      isOpen,
      closeDrawer: () => setIsOpen(false),
      openDrawer: () => setIsOpen(true),
      setDrawerPanel,
      clearDrawerPanel,
    }),
    [clearDrawerPanel, isOpen, panel, setDrawerPanel]
  )

  return (
    <RightDrawerContext.Provider value={value}>
      {children}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="right"
          className="w-[92vw] overflow-hidden p-0 sm:max-w-xl lg:max-w-2xl"
        >
          <SheetHeader className="border-b pr-12">
            <SheetTitle>{panel?.title ?? "Drawer"}</SheetTitle>
            <SheetDescription>
              {panel?.description ?? "No active details yet."}
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-auto px-4 pb-4">
            {panel?.content ?? (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Transaction details and diagnostics will appear here when they are available.
              </div>
            )}
          </div>
          {panel?.footer ? (
            <SheetFooter className="border-t">{panel.footer}</SheetFooter>
          ) : null}
        </SheetContent>
      </Sheet>
    </RightDrawerContext.Provider>
  )
}

export function useRightDrawer() {
  const context = useContext(RightDrawerContext)

  if (!context) {
    throw new Error("useRightDrawer must be used within a RightDrawerProvider.")
  }

  return context
}
