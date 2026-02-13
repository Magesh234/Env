"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, ChevronRight, type LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface SubMenuItem {
  name: string
  href: string
}

interface NavItemWithDropdownProps {
  name: string
  href: string
  icon: LucideIcon
  subItems?: SubMenuItem[]
  badge?: number
  onItemClick?: () => void
}

export function NavItemWithDropdown({
  name,
  href,
  icon: Icon,
  subItems,
  badge,
  onItemClick,
}: NavItemWithDropdownProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(pathname.startsWith(href))
  const isActive = pathname === href || (subItems && subItems.some((item) => pathname === item.href))

  const hasSubItems = subItems && subItems.length > 0

  const handleToggle = () => {
    if (hasSubItems) {
      setIsOpen(!isOpen)
    }
  }

  return (
    <div>
      <div className="flex items-center">
        <Link
          href={href}
          onClick={onItemClick}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all text-sm font-medium flex-1 ${
            isActive
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          }`}
        >
          <Icon className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1">{name}</span>
          {badge && (
            <Badge variant="destructive" className="ml-auto h-5 px-1.5 text-xs">
              {badge}
            </Badge>
          )}
        </Link>
        {hasSubItems && (
          <button onClick={handleToggle} className="p-2 hover:bg-sidebar-accent rounded-md transition-colors ml-1">
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        )}
      </div>

      {hasSubItems && isOpen && (
        <div className="ml-7 mt-1 space-y-0.5 border-l-2 border-sidebar-border pl-3">
          {subItems.map((subItem) => {
            const isSubActive = pathname === subItem.href
            return (
              <Link
                key={subItem.href}
                href={subItem.href}
                onClick={onItemClick}
                className={`block px-3 py-2 rounded-md text-sm transition-all ${
                  isSubActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                }`}
              >
                {subItem.name}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
