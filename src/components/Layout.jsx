import React from 'react';
import logoGatra from '@/assets/logo-atma.png';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard,
  FolderKanban,
  Receipt,
  Settings,
  LogOut,
  Menu,
  Calculator,
  UserCog,
  UserStar,
  Landmark,
  Truck,
  BookText,
  ShoppingCart,
  ChevronDown,
  Database,
  FileBarChart,
  Package,
  CreditCard,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import { Button } from './ui/button';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './ui/collapsible';
import { getAssetUrl } from '@/helpers/AssetHelper';
import { useSidebarMenuState } from '@/hooks/useSidebarMenuState';

const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    roles: ['admin', 'user']
  },
  {
    title: "Daftar Buku",
    url: "/books",
    icon: BookText,
    roles: ['admin']
  },
  {
    title: "Transaksi Penjualan",
    url: "/sales-transactions",
    icon: ShoppingCart,
    roles: ['admin', 'user']
  },
  {
    title: "Transaksi Pembelian",
    url: "/purchase-transactions",
    icon: ShoppingBag,
    roles: ['admin', 'user']
  },
  {
    title: "Data User",
    url: "/users",
    icon: UserCog,
    roles: ['admin']
  },
  {
    title: "Sales Buku",
    url: "/sales-associates",
    icon: UserStar,
    roles: ['admin']
  },
  {
    title: "Penerbit / Supplier",
    url: "/publishers",
    icon: Landmark,
    roles: ['admin', 'user']
  },
  {
    title: "Ekspedisi",
    url: "/expeditions",
    icon: Truck,
    roles: ['admin', 'user']
  },
];

const navigationMastersGroup = {
  title: "Data Masters",
  icon: Database,
  key: "dataMasters",
  roles: ['admin'],
  children: [
    {
      title: "Master Merk Buku",
      url: "/master-merk-buku",
      icon: Settings,
      roles: ['admin']
    },
    {
      title: "Master Jenis Buku",
      url: "/master-jenis-buku",
      icon: Settings,
      roles: ['admin']
    },
    {
      title: "Master Jenjang Studi",
      url: "/master-jenjang-studi",
      icon: Settings,
      roles: ['admin']
    },
    {
      title: "Master Bidang Studi",
      url: "/master-bidang-studi",
      icon: Settings,
      roles: ['admin']
    },
    {
      title: "Master Kelas",
      url: "/master-kelas",
      icon: Settings,
      roles: ['admin']
    },
    {
      title: "Master Kota",
      url: "/master-cities",
      icon: Settings,
      roles: ['admin']
    },
    {
      title: "Master Biller",
      url: "/master-billers",
      icon: Settings,
      roles: ['admin']
    },
    {
      title: "Master Kurikulum",
      url: "/master-kurikulum",
      icon: Settings,
      roles: ['admin']
    },
  ]
};

const navigationReportsGroup = {
  title: "Laporan",
  icon: FileBarChart,
  key: "laporan",
  roles: ['admin', 'user'],
  children: [
    {
      title: "Laporan Stok Buku",
      url: "/reports/books-stock",
      icon: Package,
      roles: ['admin', 'user']
    },
    {
      title: "Laporan Piutang",
      url: "/reports/credits",
      icon: CreditCard,
      roles: ['admin', 'user']
    },
    {
      title: "Laporan Pembelian",
      url: "/reports/purchases",
      icon: ShoppingBag,
      roles: ['admin', 'user']
    },
    {
      title: "Laporan Penjualan",
      url: "/reports/sales",
      icon: TrendingUp,
      roles: ['admin', 'user']
    },
  ]
};

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { isMenuOpen, toggleMenu } = useSidebarMenuState({ dataMasters: true, laporan: true });

  const filteredNavItems = navigationItems.filter(item =>
    !item.roles || item.roles.includes(user?.role)
  );

  const filteredMasterChildren = navigationMastersGroup.children.filter(item =>
    !item.roles || item.roles.includes(user?.role)
  );

  const canSeeMastersGroup = navigationMastersGroup.roles.includes(user?.role)
    && filteredMasterChildren.length > 0;

  const filteredReportChildren = navigationReportsGroup.children.filter(item =>
    !item.roles || item.roles.includes(user?.role)
  );

  const canSeeReportsGroup = navigationReportsGroup.roles.includes(user?.role)
    && filteredReportChildren.length > 0;

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="border-b border-slate-200 p-6">
            <img src={logoGatra} className="w-[70%] mx-auto" alt="ATMA MITRA PRESTASI" />
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 overflow-y-auto">
            {/* Dashboard Link */}
            {filteredNavItems.filter(item => item.url === '/dashboard').map((item) => {
              const isActive = location.pathname === item.url;
              return (
                <Link
                  key={item.title}
                  to={item.url}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200
                    ${isActive
                      ? 'bg-blue-50 text-blue-900 font-medium shadow-sm'
                      : 'hover:bg-blue-50 hover:text-blue-700'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.title}</span>
                </Link>
              );
            })}

            {/* Collapsible Reports Group - Right below Dashboard */}
            {canSeeReportsGroup && (
              <Collapsible
                open={isMenuOpen('laporan')}
                onOpenChange={() => toggleMenu('laporan')}
              >
                <CollapsibleTrigger asChild>
                  <button
                    className={`
                      flex w-full items-center gap-3 px-3 py-2.5 text-sm rounded-lg
                      transition-all duration-200 hover:bg-slate-100
                      ${filteredReportChildren.some(item => location.pathname === item.url)
                        ? 'text-blue-900 font-medium'
                        : 'text-slate-700'
                      }
                    `}
                  >
                    <FileBarChart className="w-5 h-5" />
                    <span className="flex-1 text-left">{navigationReportsGroup.title}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${isMenuOpen('laporan') ? 'rotate-180' : ''
                        }`}
                    />
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="ml-4 pl-4 border-l border-slate-200 space-y-1 mt-1">
                    {filteredReportChildren.map((item) => {
                      const isActive = location.pathname === item.url;
                      return (
                        <Link
                          key={item.title}
                          to={item.url}
                          onClick={() => setSidebarOpen(false)}
                          className={`
                            flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-200
                            ${isActive
                              ? 'bg-blue-50 text-blue-900 font-medium'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }
                          `}
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Other Navigation Items (excluding Dashboard) */}
            <div className="space-y-1">
              {filteredNavItems.filter(item => item.url !== '/dashboard').map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <Link
                    key={item.title}
                    to={item.url}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200
                      ${isActive
                        ? 'bg-blue-50 text-blue-900 font-medium shadow-sm'
                        : 'hover:bg-blue-50 hover:text-blue-700'
                      }
                    `}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </div>
            <div className="h-px bg-slate-200 my-2"></div>

            {/* Collapsible Masters Group */}
            {canSeeMastersGroup && (
              <Collapsible
                open={isMenuOpen('dataMasters')}
                onOpenChange={() => toggleMenu('dataMasters')}
              >
                <CollapsibleTrigger asChild>
                  <button
                    className={`
                      flex w-full items-center gap-3 px-3 py-2.5 text-sm rounded-lg
                      transition-all duration-200 hover:bg-slate-100
                      ${filteredMasterChildren.some(item => location.pathname === item.url)
                        ? 'text-blue-900 font-medium'
                        : 'text-slate-700'
                      }
                    `}
                  >
                    <Database className="w-5 h-5" />
                    <span className="flex-1 text-left">{navigationMastersGroup.title}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${isMenuOpen('dataMasters') ? 'rotate-180' : ''
                        }`}
                    />
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="ml-4 pl-4 border-l border-slate-200 space-y-1 mt-1">
                    {filteredMasterChildren.map((item) => {
                      const isActive = location.pathname === item.url;
                      return (
                        <Link
                          key={item.title}
                          to={item.url}
                          onClick={() => setSidebarOpen(false)}
                          className={`
                            flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-200
                            ${isActive
                              ? 'bg-blue-50 text-blue-900 font-medium'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }
                          `}
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </nav>

          {/* Footer */}
          <div className="border-t border-slate-200 p-4">
            <div className="space-y-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigate('/profile');
                }}
                className="w-full justify-start items-center gap-3 px-2 py-6 text-slate-600 hover:text-blue-600 hover:border-blue-200"
              >
                {user.photo_url ? (
                  <img
                    src={getAssetUrl(user.photo_url)}
                    alt="Profile Photo"
                    className="w-10 h-10 rounded-full object-cover border-2 border-slate-200"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center"
                  style={{ display: user.photo_url ? 'none' : 'flex' }}
                >
                  <span className="text-white font-semibold text-sm">
                    {user.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium text-slate-900 text-sm truncate">
                    {user?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {user?.role === 'admin' ? 'Administrator' : 'User'}
                  </p>
                </div>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="w-full justify-start gap-2 text-slate-600 hover:text-red-600 hover:border-red-200"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 lg:hidden sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-slate-900">ATMA MITRA PRESTASI</h1>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
