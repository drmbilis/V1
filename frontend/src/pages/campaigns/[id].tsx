import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import MetricsChart from '@/components/MetricsChart';
import StatusBadge from '@/components/StatusBadge';
import LoadingSpinner from '@/components/LoadingSpinner';
import { campaignsAPI, recommendationsAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  MousePointerClick,
  Target,
  Sparkles,
  Calendar
} from 'lucide-react';

export default function CampaignDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [campaign, setCampaign] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [range, setRange] = useState(30);

  useEffect(() => {
    if (id) {
      loadCampaign();
      loadMetrics();
    }
  }, [id, range]);

  const loadCampaign = async () => {
    try {
      const res = await campaignsAPI.get(id as string);
      setCampaign(res.data.data);
    } catch (error: any) {
      toast.error('Failed to load campaign');
      router.push('/campaigns');
    }
  };

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const res = await campaignsAPI.getMetrics(id as string, range);
      setMetrics(res.data.data);
    } catch (error) {
      console.error('Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRecommendations = async () => {
    setGenerating(true);
    try {
      await recommendationsAPI.generate({
        campaignId: id,
        types: ['keyword', 'budget', 'adcopy'],
        goal: 'conversions'
      });
      toast.success('✨ AI recommendations generated!');
      router.push('/recommendations');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to generate recommendations');
    } finally {
      setGenerating(false);
    }
  };

  if (loading || !campaign) {
    return (
      <Layout>
        <LoadingSpinner text="Loading campaign..." />
      </Layout>
    );
  }

  const summary = metrics?.summary || {};

  return (
    <Layout>
      <div className="space-y-6">
        {/* Back button */}
        <button
          onClick={() => router.push('/campaigns')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Campaigns
        </button>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
              <StatusBadge status={campaign.status} />
            </div>
            <p className="text-gray-600">
              {campaign.channelType} Campaign • ID: {campaign.campaignId}
            </p>
          </div>
          <button
            onClick={handleGenerateRecommendations}
            disabled={generating}
            className="btn btn-primary flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {generating ? 'Generating...' : 'AI Optimize'}
          </button>
        </div>

        {/* Campaign Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="text-sm text-gray-600 mb-1">Daily Budget</div>
            <div className="text-2xl font-bold text-gray-900">
              ${parseFloat(campaign.budget || 0).toFixed(2)}
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600 mb-1">Bidding Strategy</div>
            <div className="text-lg font-semibold text-gray-900">
              {campaign.biddingStrategy?.replace(/_/g, ' ') || 'N/A'}
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <Calendar className="w-4 h-4" />
              Start Date
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {campaign.startDate || 'N/A'}
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <Calendar className="w-4 h-4" />
              End Date
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {campaign.endDate || 'Ongoing'}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Spend</div>
                <div className="text-2xl font-bold text-gray-900">
                  ${summary.totalCost?.toFixed(2) || '0.00'}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="bg-green-50 p-3 rounded-lg">
                <MousePointerClick className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Clicks</div>
                <div className="text-2xl font-bold text-gray-900">
                  {summary.totalClicks?.toLocaleString() || '0'}
                </div>
                <div className="text-xs text-gray-500">
                  {summary.avgCtr?.toFixed(2)}% CTR
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="bg-purple-50 p-3 rounded-lg">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Conversions</div>
                <div className="text-2xl font-bold text-gray-900">
                  {summary.totalConversions?.toFixed(0) || '0'}
                </div>
                <div className="text-xs text-gray-500">
                  {summary.conversionRate?.toFixed(2)}% rate
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-50 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">ROAS</div>
                <div className="text-2xl font-bold text-gray-900">
                  {summary.roas?.toFixed(2) || '0.00'}x
                </div>
                <div className="text-xs text-gray-500">
                  ${summary.avgCpc?.toFixed(2)} CPC
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Performance Trends</h2>
            <div className="flex gap-2">
              {[7, 14, 30, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => setRange(days)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    range === days
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>

          {metrics?.daily && (
            <MetricsChart
              data={metrics.daily}
              metrics={['cost', 'conversions', 'clicks']}
              height={350}
            />
          )}
        </div>

        {/* Daily Breakdown Table */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Daily Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Impressions</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Clicks</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">CTR</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Cost</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Conversions</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Conv. Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {metrics?.daily?.slice(0, 10).map((day: any) => (
                  <tr key={day.date} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{day.date}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      {day.impressions?.toLocaleString() || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      {day.clicks?.toLocaleString() || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      {(day.ctr * 100)?.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      ${day.cost?.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      {day.conversions || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      {day.clicks > 0 ? ((day.conversions / day.clicks) * 100).toFixed(2) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
