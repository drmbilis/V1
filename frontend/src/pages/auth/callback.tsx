import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const { token } = router.query;
    if (token) {
      localStorage.setItem('auth_token', token as string);
      router.push('/dashboard');
    }
  }, [router.query]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Hesabınıza bağlanılıyor...</p>
      </div>
    </div>
  );
}