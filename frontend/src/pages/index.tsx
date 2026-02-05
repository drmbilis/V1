import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      {/* Hero Section */}
      <div className="max-w-3xl">
        <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
          Google Ads <span className="text-blue-600">AI Manager</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10">
          Gemini ve DeepSeek destekli yapay zeka ile reklam bütçenizi optimize edin, 
          kampanya performansınızı otomatik artırın.
        </p>

        {/* Login Button Area */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 inline-block">
          <h2 className="text-lg font-semibold text-gray-700 mb-6">Hesabınıza Giriş Yapın</h2>
          
          <button 
            onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-white border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
            Sign in with Google
          </button>
          
          <div className="mt-6 text-sm text-gray-400">
            SaaS altyapısı ve Multi-tenant desteği hazır.
          </div>
        </div>
      </div>

      {/* Feature Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-5xl">
        <div className="p-6 bg-blue-50 rounded-xl">
          <div className="text-blue-600 font-bold mb-2">🚀 AI Optimization</div>
          <p className="text-sm text-gray-600">Bütçe ve anahtar kelime önerileri saniyeler içinde hazır.</p>
        </div>
        <div className="p-6 bg-green-50 rounded-xl">
          <div className="text-green-600 font-bold mb-2">🛡️ Safety Net</div>
          <p className="text-sm text-gray-600">Bütçe sınırlarınız aşılmadan otomatik durdurma mekanizması.</p>
        </div>
        <div className="p-6 bg-purple-50 rounded-xl">
          <div className="text-purple-600 font-bold mb-2">📊 Deep Insights</div>
          <p className="text-sm text-gray-600">Gemini ile raporlarınızı anlamlı stratejilere dönüştürün.</p>
        </div>
      </div>
    </div>
  );
}