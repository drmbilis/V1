import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/store';
import { authAPI } from '@/lib/api';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { token, setUser, setToken } = useAuthStore();

  useEffect(() => {
    // Check if user is logged in on app load
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      
      if (storedToken) {
        setToken(storedToken);
        
        try {
          const res = await authAPI.getMe();
          setUser(res.data.data);
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          
          // Redirect to login if not on public pages
          if (router.pathname !== '/login' && !router.pathname.startsWith('/auth/')) {
            router.push('/login');
          }
        }
      } else if (router.pathname !== '/login' && !router.pathname.startsWith('/auth/')) {
        // No token and not on public page, redirect to login
        router.push('/login');
      }
    };

    checkAuth();
  }, []);

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
