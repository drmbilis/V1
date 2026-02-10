import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import CampaignCard from '@/components/CampaignCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import StatusBadge from '@/components/StatusBadge';
import { campaignsAPI, jobsAPI } from '@/lib/api';
import { useAppStore } from '@/store';
import { toast } from 'react-hot-toast';
import {
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  Sparkles
} from 'lucide-react';

export default function Campaigns() {
  const router = useRouter();
  const { selectedCustomerId } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (selectedCustomerId) {
      loadCampaigns();
    }
  }, [selectedCustomerId]);

  useEffect(() => {
    filterCampaigns();
  }, [campaigns, searchQuery, statusFilter, typeFilter]);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const res = await campaignsAPI.list({
        customerId: selectedCustomerId,
        limit: 100
      });
      setCampaigns(res.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const filterCampaigns = () => {
    let filtered = [...campaigns];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(c => c.channelType === typeFilter);
    }

    setFilteredCampaigns(filtered);
  };

  const handleSync = async () => {
    if (!selectedCustomerId) return;
    
    setSyncing(true);
    try {
      await jobsAPI.sync(selectedCustomerId, 'sync_campaigns');
      toast.success('Sync started!');
      
      setTimeout(async () => {
        await loadCampaigns();
        toast.success('✅ Campaigns synced!');
        setSyncing(false);
      }, 5000);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Sync failed');
      setSyncing(false);
    }
  };

  const getStats = () => {
    const total = filteredCampaigns.length;
    const enabled = filteredCampaigns.filter(c => c.status === 'ENABLED').length;
    const paused = filteredCampaigns.filter(c => c.status === 'PAUSED').length;
    
    const totalSpend = filteredCampaigns.reduce((sum, c) => {
      const cost = parseFloat(c.latestMetrics?.costMicros || 0) / 1000000;
      return sum + cost;
    }, 0);

    return { total, enabled, paused, totalSpend };
  };

  const stats = getStats();

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner text="Loading campaigns..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
            <p className="text-gray-600 mt-1">
              Manage and optimize your Google Ads campaigns
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="btn btn-primary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="text-sm text-gray-600">Total Campaigns</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {stats.total}
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600">Active</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {stats.enabled}
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600">Paused</div>
            <div className="text-2xl font-bold text-yellow-600 mt-1">
              {stats.paused}
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600">Total Spend</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              ${stats.totalSpend.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Statuses</option>
              <option value="ENABLED">Enabled</option>
              <option value="PAUSED">Paused</option>
              <option value="REMOVED">Removed</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Types</option>
              <option value="SEARCH">Search</option>
              <option value="DISPLAY">Display</option>
              <option value="VIDEO">Video</option>
              <option value="SHOPPING">Shopping</option>
            </select>
          </div>
        </div>

        {/* Campaigns Grid */}
        {filteredCampaigns.length === 0 ? (
          <div className="card text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No campaigns found</p>
            <button onClick={handleSync} className="btn btn-primary">
              Sync Campaigns
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onSelect={() => router.push(`/campaigns/${campaign.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
