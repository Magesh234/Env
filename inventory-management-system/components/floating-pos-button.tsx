"use client"

import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter, usePathname } from "next/navigation"
import { useStore } from "@/lib/store-context"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function FloatingPosButton() {
  const router = useRouter()
  const pathname = usePathname()
  const { selectedStore, storeName } = useStore()

  // Hide on POS page itself
  if (pathname?.includes('/pos')) {
    return null
  }

  // Don't show if no store is selected
  if (!selectedStore) {
    return null
  }

  const handleClick = () => {
    router.push(`/dashboard/stores/${selectedStore}/pos`)
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleClick}
            size="lg"
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50 p-0 bg-primary hover:bg-primary/90"
          >
            <ShoppingCart className="h-6 w-6" />
            <span className="sr-only">Open Point of Sale</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs">
          <p className="font-semibold">Point of Sale</p>
          {storeName && <p className="text-xs text-muted-foreground">{storeName}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}