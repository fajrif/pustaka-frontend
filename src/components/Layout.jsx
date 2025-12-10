import React from 'react';
import logoGatra from '@/assets/logo-pustaka-icon.png';
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
} from 'lucide-react';
import { Button } from './ui/button';
import { getAssetUrl } from '@/helpers/AssetHelper';

const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    roles: ['admin', 'user']
  },
  {
    title: "Data User",
    url: "/users",
    icon: UserCog,
    roles: ['admin']
  },
  {
    title: "Daftar Buku",
    url: "/books",
    icon: BookText,
    roles: ['admin']
  },
  {
    title: "Sales Buku",
    url: "/sales-associates",
    icon: UserStar,
    roles: ['admin']
  },
  {
    title: "Penerbit",
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
  {
    title: "Transaksi Penjualan",
    url: "/sales-transactions",
    icon: ShoppingCart,
    roles: ['admin', 'user']
  },
];

const navigationMasters = [
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
];

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const filteredNavItems = navigationItems.filter(item =>
    !item.roles || item.roles.includes(user?.role)
  );

  const filteredNavMasters = navigationMasters.filter(item =>
    !item.roles || item.roles.includes(user?.role)
  );

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
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <img src={logoGatra} className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-lg">PustakaDB</h2>
                <p className="text-xs text-slate-500">Manajemen Buku</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 overflow-y-auto">
            <div className="space-y-1">
              {filteredNavItems.map((item) => {
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
            <div className="space-y-1">
              {filteredNavMasters.map((item) => {
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
            <h1 className="text-lg font-semibold text-slate-900">PustakaDB</h1>
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
