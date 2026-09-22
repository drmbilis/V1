import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore, useAppStore } from '@/store';
import { authAPI, customersAPI } from '@/lib/api';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();
  const { setCustomers, setSelectedCustomerId } = useAppStore();

  useEffect(() => {
    if (!router.isReady) return;

    let cancelled = false;

    const hydrateCustomers = async () => {
      try {
        const res = await customersAPI.list();
        const customers = Array.isArray(res.data?.data) ? res.data.data : [];

        if (cancelled) return null;

        setCustomers(customers);
        const preferred =
          customers.find((customer: any) => customer.isSelected || customer.selected || customer.isActive) ||
          customers[0];

        const customerId = preferred?.customerId || preferred?.id || null;
        setSelectedCustomerId(customerId);
        return customerId;
      } catch (error) {
        console.error('Customer context initialization failed:', error);
        if (!cancelled) {
          setCustomers([]);
          setSelectedCustomerId(null);
        }
        return null;
      }
    };

    const checkAuth = async () => {
      const isPublic =
        router.pathname === '/' ||
        router.pathname === '/login' ||
        router.pathname.startsWith('/auth/');

      const storedToken = localStorage.getItem('token');

      if (!storedToken) {
        setToken(null);
        setUser(null);

        if (router.pathname === '/') {
          router.replace('/login');
        } else if (!isPublic) {
          router.replace('/login');
        }
        return;
      }

      setToken(storedToken);

      try {
        const res = await authAPI.getMe();
        if (cancelled) return;

        setUser(res.data.data);
        const customerId = await hydrateCustomers();

        if (cancelled) return;

        if (!customerId && router.pathname !== '/settings' && !router.pathname.startsWith('/auth/')) {
          router.replace('/settings');
          return;
        }

        if ((router.pathname === '/' || router.pathname === '/login') && customerId) {
          router.replace('/dashboard');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');

        if (!cancelled) {
          setToken(null);
          setUser(null);
          setCustomers([]);
          setSelectedCustomerId(null);

          if (!router.pathname.startsWith('/auth/')) {
            router.replace('/login');
          }
        }
      }
    };

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, [router.isReady, router.pathname]);

  return (
    <>
      <Component {...pageProps} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#363636',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}
