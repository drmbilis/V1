import React from 'react'; // React importu eklemek iyidir
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  LayoutDashboard, 
  Target, 
  Lightbulb, 
  CheckCircle, 
  FileText,
  LogOut,
  Settings
} from 'lucide-react';

// Şimdilik Store hatası almamak için user'ı manuel tanımlıyoruz
// İleride auth sistemini bağladığında burayı tekrar store'a çekersin

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Campaigns', href: '/campaigns', icon: Target },
    { name: 'Recommendations', href: '/recommendations', icon: Lightbulb },
    { name: 'Apply History', href: '/apply-history', icon: CheckCircle },
    { name: 'Audit Log', href: '/audit', icon: FileText },
    { name: 'Safety Net', href: '/safety-net', icon: CheckCircle }, // Bunu da ekledim!
  ];

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    router.push('/');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar - Sabit Genişlik */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg z-10">
        <div className="flex flex-col h-full">
          <div className="flex items-center h-16 px-6 border-b bg-white">
            <h1 className="text-xl font-bold text-blue-600">
              Google Ads AI
            </h1>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = router.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t bg-white">
            <div className="space-y-1">
              <Link
                href="/settings"
                className="flex items-center px-4 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <Settings className="w-4 h-4 mr-3" />
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content - Sidebar kadar boşluk bırakıyoruz */}
      <div className="flex-1 ml-64">
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
