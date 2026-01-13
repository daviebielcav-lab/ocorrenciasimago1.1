import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  FileText, 
  Columns3, 
  BarChart3, 
  Settings, 
  User,
  LogOut,
  ChevronDown,
  SlidersHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import imagoLogo from "@/assets/imago-logo-transparent.png";

export function TopNav() {
  const location = useLocation();
  const { profile, tenant, isAdmin, signOut } = useAuth();
  
  // Get user initials
  const userInitials = profile?.full_name
    ?.split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  // Filter nav links based on role (Configurações is only in the dropdown)
  const navLinks = [
    { href: "/", label: "Início", icon: Home, adminOnly: false },
    { href: "/ocorrencias", label: "Ocorrências", icon: FileText, adminOnly: false },
    { href: "/kanbans", label: "Kanbans", icon: Columns3, adminOnly: false },
    { href: "/analise", label: "Análise", icon: SlidersHorizontal, adminOnly: true },
    { href: "/relatorios", label: "Dashboard", icon: BarChart3, adminOnly: true },
  ].filter(link => !link.adminOnly || isAdmin);

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <header className="relative">
      {/* Top colored line */}
      <div className="h-1 bg-gradient-to-r from-[#3b5998] via-[#5b7fc3] to-[#8b5cf6]" />
      
      {/* Main header container */}
      <div className="bg-white border border-border/40 rounded-b-2xl shadow-sm mb-2">
        <div className="flex h-[76px] items-center justify-between px-10">
          {/* Left: Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="flex items-center">
              <img 
                src={imagoLogo} 
                alt="IMAGO Diagnóstico por Imagem" 
                className="h-10 w-auto object-contain scale-[1.8] origin-left ml-2"
              />
            </Link>
          </div>

          {/* Center: Navigation Links - shifted right */}
          <nav className="hidden lg:flex items-center gap-1 ml-24">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#dbeafe] text-[#2563eb]"
                      : "text-[#64748b] hover:bg-gray-100 hover:text-[#475569]"
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: User Avatar with Dropdown */}
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name} />
                  <AvatarFallback className="bg-[#1e3a5f] text-white text-sm font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="h-4 w-4 text-[#64748b]" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name} />
                    <AvatarFallback className="bg-[#1e3a5f] text-white text-sm font-semibold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{profile?.full_name}</span>
                    <span className="text-xs text-muted-foreground">{tenant?.name}</span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/perfil" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    Meu Perfil
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/configuracoes" className="flex items-center gap-2 cursor-pointer">
                      <Settings className="h-4 w-4" />
                      Configurações
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-destructive cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex lg:hidden items-center gap-1 px-4 pb-3 overflow-x-auto">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[#dbeafe] text-[#2563eb]"
                    : "text-[#64748b] hover:bg-gray-100 hover:text-[#475569]"
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
