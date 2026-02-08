import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { customersAPI, authAPI } from '@/lib/api';
import { useAuthStore, useAppStore } from '@/store';
import { toast } from 'react-hot-toast';
import {
  User,
  Building2,
  RefreshCw,
  Check,
  Settings as SettingsIcon,
  Bell,
  Shield
} from 'lucide-react';

export default function Settings() {
  const { user } = useAuthStore();
  const { selectedCustomerId, setSelectedCustomerId, customers, setCustomers } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    emailAlerts: true,
    smsAlerts: false,
    weeklyReport: true,
    recommendationAlerts: true,
    budgetAlerts: true
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // Load customers
      const customersRes = await customersAPI.list();
      setCustomers(customersRes.data.data);

      // Load saved notification settings
      const saved = localStorage.getItem('notificationSettings');
      if (saved) {
        setNotificationSettings(JSON.parse(saved));
      }
    } catch (error: any) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCustomer = async (customerId: string) => {
    try {
      await customersAPI.select(customerId);
      setSelectedCustomerId(customerId);
      toast.success('✅ Customer selected!');
    } catch (error: any) {
      toast.error('Failed to select customer');
    }
  };

  const handleRefreshCustomers = async () => {
    setRefreshing(true);
    try {
      await customersAPI.refresh();
      toast.success('Refreshing customer list...');
      
      setTimeout(async () => {
        const res = await customersAPI.list();
        setCustomers(res.data.data);
        toast.success('✅ Customers refreshed!');
        setRefreshing(false);
      }, 3000);
    } catch (error: any) {
      toast.error('Failed to refresh customers');
      setRefreshing(false);
    }
  };

  const handleSaveNotifications = () => {
    localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
    toast.success('✅ Notification settings saved!');
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner text="Loading settings..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your account, customers, and preferences
          </p>
        </div>

        {/* Profile */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="bg-primary-100 p-4 rounded-full">
                <User className="w-8 h-8 text-primary-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">{user?.name}</div>
                <div className="text-sm text-gray-600">{user?.email}</div>
              </div>
            </div>

            {user?.tenantMemberships && user.tenantMemberships.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Workspace Memberships
                </div>
                {user.tenantMemberships.map((membership: any) => (
                  <div
                    key={membership.id}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="text-sm text-gray-900">
                      {membership.tenant?.name || 'Workspace'}
                    </span>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      {membership.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Google Ads Customers */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Google Ads Customers
              </h2>
            </div>
            <button
              onClick={handleRefreshCustomers}
              disabled={refreshing}
              className="btn btn-secondary flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {customers.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No Google Ads customers found</p>
              <button onClick={handleRefreshCustomers} className="btn btn-primary">
                Refresh Customers
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {customers.map((customer: any) => (
                <button
                  key={customer.id}
                  onClick={() => handleSelectCustomer(customer.customerId)}
                  className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                    selectedCustomerId === customer.customerId
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      selectedCustomerId === customer.customerId
                        ? 'bg-primary-100'
                        : 'bg-gray-100'
                    }`}>
                      <Building2 className={`w-5 h-5 ${
                        selectedCustomerId === customer.customerId
                          ? 'text-primary-600'
                          : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">
                        {customer.descriptiveName}
                      </div>
                      <div className="text-sm text-gray-600">
                        ID: {customer.customerId} • {customer.currency}
                      </div>
                    </div>
                  </div>
                  {selectedCustomerId === customer.customerId && (
                    <Check className="w-5 h-5 text-primary-600" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notification Settings */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Notification Preferences
            </h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <div className="font-medium text-gray-900">Email Alerts</div>
                <div className="text-sm text-gray-600">
                  Receive email notifications for important events
                </div>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.emailAlerts}
                onChange={(e) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    emailAlerts: e.target.checked,
                  })
                }
                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </label>

            <label className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <div className="font-medium text-gray-900">Budget Alerts</div>
                <div className="text-sm text-gray-600">
                  Get notified when spending approaches limits
                </div>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.budgetAlerts}
                onChange={(e) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    budgetAlerts: e.target.checked,
                  })
                }
                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </label>

            <label className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <div className="font-medium text-gray-900">AI Recommendation Alerts</div>
                <div className="text-sm text-gray-600">
                  Notify when new AI recommendations are available
                </div>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.recommendationAlerts}
                onChange={(e) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    recommendationAlerts: e.target.checked,
                  })
                }
                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </label>

            <label className="flex items-center justify-between py-3">
              <div>
                <div className="font-medium text-gray-900">Weekly Report</div>
                <div className="text-sm text-gray-600">
                  Receive a weekly summary of campaign performance
                </div>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.weeklyReport}
                onChange={(e) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    weeklyReport: e.target.checked,
                  })
                }
                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </label>
          </div>

          <button
            onClick={handleSaveNotifications}
            className="btn btn-primary mt-4 w-full"
          >
            Save Notification Settings
          </button>
        </div>

        {/* Security */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Security</h2>
          </div>

          <div className="space-y-3 text-sm text-gray-600">
            <p>🔒 Your Google Ads refresh token is encrypted with AES-256</p>
            <p>🔐 All API communications use HTTPS/TLS</p>
            <p>📝 Full audit trail of all changes</p>
            <p>🚨 Budget protection prevents unauthorized spend</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
