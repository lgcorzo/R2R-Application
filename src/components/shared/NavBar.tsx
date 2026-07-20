import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/router';
import { forwardRef, useEffect, useState, ReactNode } from 'react';

import { Logo } from '@/components/shared/Logo';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { brandingConfig } from '@/config/brandingConfig';
import { useUserContext } from '@/context/UserContext';
import { NavbarProps, NavItemsProps } from '@/types';

interface NavItemProps {
  href: string;
  children: ReactNode;
  isActive: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ href, children, isActive }) => (
  <Link
    href={href}
    className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-300 ${
      isActive
        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-lg shadow-indigo-500/10'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
    }`}
  >
    {children}
  </Link>
);

const NavItems: React.FC<NavItemsProps> = ({
  isAuthenticated,
  role,
  pathname,
}) => {
  const homeItem = {
    path: '/',
    label: 'Home',
    show: brandingConfig.navbar.menuItems.home,
  };

  const commonItems = [
    {
      path: '/manage',
      label: 'Manage',
      show: true,
    },
    {
      path: '/explorer',
      label: 'Explorer',
      show: true,
    },
    {
      path: '/documents-detail',
      label: 'Documents Detail',
      show: true,
    },
    {
      path: '/documents',
      label: 'Documents',
      show: brandingConfig.navbar.menuItems.documents,
    },
    {
      path: '/collections',
      label: 'Collections',
      show: brandingConfig.navbar.menuItems.collections,
    },
    {
      path: '/chat',
      label: 'Chat',
      show: brandingConfig.navbar.menuItems.chat,
    },
    {
      path: '/search',
      label: 'Search',
      show: brandingConfig.navbar.menuItems.search,
    },
  ];

  const adminItems = [
    {
      path: '/users',
      label: 'Users',
      show: brandingConfig.navbar.menuItems.users,
    },
    {
      path: '/analytics',
      label: 'Analytics',
      show: brandingConfig.navbar.menuItems.analytics,
    },
    {
      path: '/settings',
      label: 'Settings',
      show: brandingConfig.navbar.menuItems.settings,
    },
  ];

  const items =
    role === 'admin'
      ? [homeItem, ...commonItems, ...adminItems]
      : [...commonItems];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav>
      <div className="flex items-center space-x-2">
        {items
          .filter((item) => item.show)
          .map((item) => (
            <NavItem
              key={item.path}
              href={item.path}
              isActive={pathname === item.path}
            >
              {item.label}
            </NavItem>
          ))}
      </div>
    </nav>
  );
};

export const Navbar = forwardRef<React.ElementRef<'nav'>, NavbarProps>(
  function Header({ className }, ref) {
    const pathname = usePathname();
    const {
      logout,
      isAuthenticated,
      authState,
      viewMode,
      setViewMode,
      isSuperUser,
    } = useUserContext();
    const router = useRouter();
    const [isSignedIn, setIsSignedIn] = useState(false);

    useEffect(() => {
      const savedAuth = localStorage.getItem('authState');
      if (savedAuth && !isAuthenticated) {
        const authData = JSON.parse(savedAuth);
      }
      setIsSignedIn(isAuthenticated);
    }, [isAuthenticated]);

    const role = viewMode === 'user' ? 'user' : authState.userRole || 'user';

    const handleLogout = async () => {
      await logout();
      router.push('/auth/login');
    };

    return (
      <nav
        ref={ref}
        className="glass-panel border-b border-white/[0.06] z-50 w-full sticky top-0"
        style={{
          background: 'rgba(8, 12, 24, 0.82)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        }}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 items-center">
            <div className="flex items-center space-x-4">
              <Link
                href={isSuperUser() ? '/' : '/documents'}
                className="flex-shrink-0 flex items-center group"
              >
                <Logo
                  className="h-12 w-auto transition-transform duration-300 group-hover:scale-105"
                  disableLink={true}
                />
                <span className="ml-2 text-xl font-bold accent-gradient-text">
                  {brandingConfig.navbar.appName}
                </span>
              </Link>
              {isSignedIn && (
                <>
                  <span className="text-white/20 text-lg">|</span>
                  <NavItems
                    isAuthenticated={isAuthenticated}
                    role={role}
                    pathname={pathname}
                  />
                </>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              {brandingConfig.navbar.showDocsButton && (
                <Button
                  variant="outline"
                  className="rounded-full border-white/10 hover:border-indigo-500/30 hover:bg-indigo-500/10 text-sm"
                  onClick={() =>
                    window.open('https://r2r-docs.sciphi.ai', '_blank')
                  }
                >
                  Docs
                </Button>
              )}

              {isSignedIn && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="cursor-pointer ring-2 ring-white/10 hover:ring-indigo-500/30 transition-all duration-300">
                      <AvatarImage src="/images/default_profile.svg" />
                      <AvatarFallback></AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="glass-panel border-white/10 rounded-xl mt-2">
                    <DropdownMenuItem
                      className="cursor-pointer rounded-lg hover:bg-indigo-500/10 focus:bg-indigo-500/10"
                      onClick={() => router.push('/account')}
                    >
                      Account
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem
                      className="cursor-pointer rounded-lg hover:bg-red-500/10 focus:bg-red-500/10 text-red-400"
                      onClick={handleLogout}
                    >
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </nav>
    );
  }
);

Navbar.displayName = 'Navbar';
