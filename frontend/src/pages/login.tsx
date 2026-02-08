import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/store';
import { Sparkles, Shield, TrendingUp, Zap } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function Login() {
  const router = useRouter();
  const { setToken, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    }
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const res = await authAPI.getOAuthUrl();
      window.location.href = res.data.data.authUrl;
    } catch (error) {
      console.error('Login failed:', error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary-600 p-3 rounded-xl">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              Google Ads AI
            </h1>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900">
            AI-Powered Campaign Management
          </h2>
          
          <p className="text-lg text-gray-600">
            Optimize your Google Ads campaigns with artificial intelligence. 
            Save money, improve performance, stay in control.
          </p>

          <div className="space-y-4 pt-4">
            <div className="flex items-start gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Proven Results</h3>
                <p className="text-sm text-gray-600">
                  Average 28% CPA reduction, 35% ROAS improvement
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Budget Protection</h3>
                <p className="text-sm text-gray-600">
                  Auto-pause and alerts when spending limits are reached
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Human-in-the-Loop</h3>
                <p className="text-sm text-gray-600">
                  Edit AI suggestions before applying. You stay in control.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Get Started
            </h3>
            <p className="text-gray-600">
              Connect your Google Ads account to begin
            </p>
          </div>

          {loading ? (
            <LoadingSpinner text="Redirecting to Google..." />
          ) : (
            <>
              <button
                onClick={handleGoogleLogin}
                className="w-full bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-3 transition-all hover:shadow-md"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <div className="mt-6 text-center text-sm text-gray-500">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="text-xs text-gray-500 text-center space-y-2">
                  <p>🔒 Secure OAuth 2.0 authentication</p>
                  <p>🔐 Encrypted token storage</p>
                  <p>🚀 5-minute setup</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
