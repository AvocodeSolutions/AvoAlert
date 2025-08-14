"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function AppHeader() {
  const pathname = usePathname()
  const NavBtn = ({ href, label }: { href: string; label: string }) => (
    <Button asChild variant={pathname === href ? "default" : "outline"} className="h-9">
      <Link href={href}>{label}</Link>
    </Button>
  )

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="h-9 px-2">
              <Link href="/">Ana sayfa</Link>
            </Button>
            <Link href="/" className="flex items-center gap-2">
              <span className="text-lg font-semibold tracking-tight">AvoAlert</span>
              <Badge variant="secondary" className="hidden sm:inline-flex">Admin</Badge>
            </Link>
          </div>
          <nav className="flex items-center gap-2">
            <NavBtn href="/customer/dashboard" label="Customer" />
            <NavBtn href="/admin/monitoring" label="Monitoring" />
            <NavBtn href="/admin/test-panel" label="Webhook" />
            <NavBtn href="/admin/alerts" label="Alerts & Scripts" />
          </nav>
        </div>
      </div>
    </header>
  )
}


