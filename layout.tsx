import { Link, useLocation } from "wouter";
import { Calculator, LayoutDashboard, Receipt, Store } from "lucide-react";
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from "@/components/ui/sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  return (
    <SidebarProvider>
      <div className="flex min-h-[100dvh] w-full bg-background font-sans no-print">
        <Sidebar className="border-r border-border bg-sidebar">
          <SidebarHeader className="p-4 flex items-center gap-2 border-b border-border">
            <Store className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg text-sidebar-foreground">Rice and Oil Shop</span>
          </SidebarHeader>
          <SidebarContent className="py-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/"}>
                  <Link href="/">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Setup</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/billing"}>
                  <Link href="/billing">
                    <Calculator className="h-4 w-4" />
                    <span>Billing Counter</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/bills"}>
                  <Link href="/bills">
                    <Receipt className="h-4 w-4" />
                    <span>Saved Bills</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <main className="flex-1 flex flex-col h-[100dvh] overflow-hidden relative">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
