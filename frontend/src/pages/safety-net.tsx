import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Shield, AlertTriangle, DollarSign, Mail, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SafetyNet() {
  const [settings, setSettings] = useState({
    dailyLimit: 100,
    monthlyLimit: 3000,
    autoP

ause: true,
    sendEmail: true,
    sendSMS: false,
    email: '',
    phone: ''
  });

  const handleSave = () => {
    localStorage.setItem('safetySettings', JSON.stringify(settings));
    toast.success('✅ Budget protection settings saved!');
  };

  useEffect(() => {
    const saved = localStorage.getItem('safetySettings');
    if (saved) setSettings(JSON.parse(saved));
  }, []);

  return (
    <Layout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Budget Safety Net</h1>
          <p className="text-gray-600 mt-1">Emergency brake to protect your ad spend</p>
        </div>

        <div className="card border-2 border-red-200 bg-red-50">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-red-900">How it works</h3>
              <p className="text-sm text-red-700 mt-1">
                If your daily or monthly spend exceeds the limits you set, AI will automatically pause all campaigns
                and send you an alert. You stay in control.
              </p>
            </div>
          </div>
        </div>

        <div className="card space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Daily Spend Limit
            </label>
            <input
              type="number"
              value={settings.dailyLimit}
              onChange={(e) => setSettings({...settings, dailyLimit: parseFloat(e.target.value)})}
              className="w-full border rounded-lg px-4 py-2"
              step="10"
            />
            <p className="text-xs text-gray-500 mt-1">
              Campaigns will pause if daily spend exceeds this amount
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monthly Spend Limit
            </label>
            <input
              type="number"
              value={settings.monthlyLimit}
              onChange={(e) => setSettings({...settings, monthlyLimit: parseFloat(e.target.value)})}
              className="w-full border rounded-lg px-4 py-2"
              step="100"
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.autoPause}
                onChange={(e) => setSettings({...settings, autoPause: e.target.checked})}
                className="rounded"
              />
              <span className="text-sm">Auto-pause campaigns when limit is reached</span>
            </label>
          </div>

          <div className="border-t pt-4 space-y-3">
            <h3 className="font-medium">Alert Preferences</h3>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.sendEmail}
                onChange={(e) => setSettings({...settings, sendEmail: e.target.checked})}
                className="rounded"
              />
              <Mail className="w-4 h-4" />
              <span className="text-sm">Send email alert</span>
            </label>
            {settings.sendEmail && (
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({...settings, email: e.target.value})}
                placeholder="your@email.com"
                className="w-full border rounded px-3 py-2 text-sm ml-6"
              />
            )}

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.sendSMS}
                onChange={(e) => setSettings({...settings, sendSMS: e.target.checked})}
                className="rounded"
              />
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm">Send SMS alert</span>
            </label>
            {settings.sendSMS && (
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) => setSettings({...settings, phone: e.target.value})}
                placeholder="+1 234 567 8900"
                className="w-full border rounded px-3 py-2 text-sm ml-6"
              />
            )}
          </div>
        </div>

        <button onClick={handleSave} className="btn btn-primary w-full">
          <Shield className="w-4 h-4 mr-2" />
          Save Protection Settings
        </button>
      </div>
    </Layout>
  );
}
