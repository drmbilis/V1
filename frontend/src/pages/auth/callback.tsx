import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/store';
import { authAPI } from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'react-hot-toast';

export default function AuthCallback() {
  const router = useRouter();
  const { setToken, setUser } = useAuthStore();

  useEffect(() => {
    const handleCallback = async () => {
      const { token, new_user } = router.query;

      if (token && typeof token === 'string') {
        // Save token
        setToken(token);

        // Fetch user data
        try {
          const userRes = await authAPI.getMe();
          setUser(userRes.data.data);

          // Show welcome message
          if (new_user === 'true') {
            toast.success('🎉 Welcome! Let\'s set up your account.');
          } else {
            toast.success('✅ Welcome back!');
          }

          // Redirect to dashboard
          router.push('/dashboard');
        } catch (error) {
          console.error('Failed to fetch user:', error);
          toast.error('Authentication failed');
          router.push('/login');
        }
      } else {
        // No token, redirect to login
        toast.error('Authentication failed');
        router.push('/login');
      }
    };

    if (router.isReady) {
      handleCallback();
    }
  }, [router.isReady, router.query]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <LoadingSpinner text="Completing authentication..." />
    </div>
  );
}
