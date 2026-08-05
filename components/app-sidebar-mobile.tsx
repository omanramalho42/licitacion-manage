"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  FileText,
  ScrollText,
  Settings,
  Gavel,
  FilePlus,
  FilePenLine,
  LogOut,
  LogIn,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

const publicNavItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Licitacoes", href: "/licitacoes", icon: Search },
  { title: "Contratos", href: "/contratos", icon: FileText },
  { title: "Atas", href: "/atas", icon: ScrollText },
];

const adminNavItems = [
  { title: "Documentos", href: "/documentos", icon: FilePlus },
  // { title: "Criar Contrato", href: "/criar-contrato", icon: FilePenLine },
];

const settingsItem = { title: "Configuracoes", href: "/configuracoes", icon: Settings };

export function AppSidebarMobile({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, isAdmin, signOut, loading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    onClose();
    router.push("/auth/login");
  };

  const navItems = [...publicNavItems, ...(isAdmin ? adminNavItems : []), settingsItem];

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Gavel className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold text-foreground">LicitaBR</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href} onClick={onClose}>
              <div
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4 space-y-3">
        {loading ? (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              <div className="h-3 w-16 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ) : user && profile ? (
          <>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {profile.full_name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {profile.full_name || "Usuario"}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {profile.role === "admin" ? "Administrador" : "Visitante"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Visitante</p>
                <p className="text-xs text-muted-foreground">Nao autenticado</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                onClose();
                router.push("/auth/login");
              }}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Entrar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
