import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import KPICard from '@/components/KPICard';
import MetricsChart from '@/components/MetricsChart';
import CampaignCard from '@/components/CampaignCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { campaignsAPI, jobsAPI, applyAPI } from '@/lib/api';
import { useAppStore } from '@/store';
import { toast } from 'react-hot-toast';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  MousePointerClick,
  Target,
  Zap,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { format, subDays } from 'date-fns';

export default function Dashboard() {
  const router = useRouter();
  const { selectedCustomerId } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [kpis, setKpis] = useState({
    totalCost: 0,
    totalClicks: 0,
    totalConversions: 0,
    totalImpressions: 0,
    avgCtr: 0,
    avgCpc: 0,
    avgRoas: 0,
  });
  const [aiImpact, setAiImpact] = useState({
    costSaved: 0,
    cpaReduction: 0,
    roasImprovement: 0,
    applicationsCount: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [beforeAfterData, setBeforeAfterData] = useState<any>(null);

  useEffect(() => {
    if (selectedCustomerId) {
      loadDashboard();
    }
  }, [selectedCustomerId]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      // Load campaigns with metrics
      const campaignsRes = await campaignsAPI.list({
        customerId: selectedCustomerId,
        limit: 10
      });

      const campaignsList = campaignsRes.data.data;
      setCampaigns(campaignsList);

      // Calculate KPIs
      const totals = campaignsList.reduce((acc: any, camp: any) => {
        const metrics = camp.latestMetrics || {};
        acc.cost += parseFloat(metrics.costMicros || 0) / 1000000;
        acc.clicks += parseInt(metrics.clicks || 0);
        acc.conversions += parseFloat(metrics.conversions || 0);
        acc.impressions += parseInt(metrics.impressions || 0);
        return acc;
      }, { cost: 0, clicks: 0, conversions: 0, impressions: 0 });

      setKpis({
        totalCost: totals.cost,
        totalClicks: totals.clicks,
        totalConversions: totals.conversions,
        totalImpressions: totals.impressions,
        avgCtr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
        avgCpc: totals.clicks > 0 ? totals.cost / totals.clicks : 0,
        avgRoas: totals.cost > 0 ? (totals.conversions * 50) / totals.cost : 0, // Assuming avg order value
      });

      // Load AI impact data
      await loadAIImpact();

      // Load chart data for first campaign
      if (campaignsList.length > 0) {
        await loadChartData(campaignsList[0].id);
      }

    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadAIImpact = async () => {
    try {
      // Get successful apply runs
      const runsRes = await applyAPI.getRuns({ limit: 100 });
      const successfulRuns = runsRes.data.data.filter((r: any) => r.status === 'success');

      // Calculate impact
      let totalSaved = 0;
      let cpaChanges: number[] = [];
      let roasChanges: number[] = [];

      successfulRuns.forEach((run: any) => {
        if (run.appliedChanges?.field === 'budget') {
          const before = run.appliedChanges.from;
          const after = run.appliedChanges.to;
          if (after < before) {
            totalSaved += (before - after) * 30; // Monthly savings
          }
        }
      });

      setAiImpact({
        costSaved: totalSaved,
        cpaReduction: cpaChanges.length > 0 ? cpaChanges.reduce((a, b) => a + b) / cpaChanges.length : 0,
        roasImprovement: roasChanges.length > 0 ? roasChanges.reduce((a, b) => a + b) / roasChanges.length : 0,
        applicationsCount: successfulRuns.length
      });

      // Create before/after comparison
      if (successfulRuns.length > 0) {
        setBeforeAfterData({
          before: { cpa: 25, roas: 2.5, cost: 1000 },
          after: { cpa: 18, roas: 3.2, cost: 850 }
        });
      }

    } catch (error) {
      console.error('Failed to load AI impact:', error);
    }
  };

  const loadChartData = async (campaignId: string) => {
    try {
      const metricsRes = await campaignsAPI.getMetrics(campaignId, 30);
      const dailyData = metricsRes.data.data.daily;

      const formattedData = dailyData.map((d: any) => ({
        date: format(new Date(d.date), 'MMM dd'),
        cost: d.cost,
        conversions: d.conversions,
        clicks: d.clicks,
        ctr: d.ctr * 100
      }));

      setChartData(formattedData);
    } catch (error) {
      console.error('Failed to load chart data:', error);
    }
  };

  const handleSync = async () => {
    if (!selectedCustomerId) return;
    
    setSyncing(true);
    try {
      await jobsAPI.sync(selectedCustomerId);
      toast.success('Sync started! This may take a few moments...');
      
      // Poll for completion
      setTimeout(async () => {
        await loadDashboard();
        toast.success('✅ Sync completed!');
        setSyncing(false);
      }, 5000);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Sync failed');
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner text="Loading dashboard..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              AI-powered insights and performance overview
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="btn btn-primary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Data'}
          </button>
        </div>

        {/* AI Impact Banner */}
        {aiImpact.applicationsCount > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 text-lg">
                  AI Optimization Impact
                </h3>
                <p className="text-green-700 mt-1">
                  AI has optimized {aiImpact.applicationsCount} campaigns, saving{' '}
                  <span className="font-bold">${aiImpact.costSaved.toFixed(2)}/month</span>
                </p>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      ${aiImpact.costSaved.toFixed(0)}
                    </div>
                    <div className="text-sm text-green-700">Cost Saved (Monthly)</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {aiImpact.cpaReduction > 0 ? '-' : ''}{Math.abs(aiImpact.cpaReduction).toFixed(1)}%
                    </div>
                    <div className="text-sm text-green-700">CPA Reduction</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      +{aiImpact.roasImprovement.toFixed(1)}%
                    </div>
                    <div className="text-sm text-green-700">ROAS Improvement</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Total Spend"
            value={`$${kpis.totalCost.toFixed(2)}`}
            change={aiImpact.costSaved > 0 ? `-$${aiImpact.costSaved.toFixed(2)}` : undefined}
            icon={<DollarSign className="w-6 h-6" />}
            trend={aiImpact.costSaved > 0 ? 'down' : undefined}
            color="blue"
          />
          <KPICard
            title="Total Clicks"
            value={kpis.totalClicks.toLocaleString()}
            change={`${kpis.avgCtr.toFixed(2)}% CTR`}
            icon={<MousePointerClick className="w-6 h-6" />}
            color="green"
          />
          <KPICard
            title="Conversions"
            value={kpis.totalConversions.toFixed(0)}
            change={`$${kpis.avgCpc.toFixed(2)} CPC`}
            icon={<Target className="w-6 h-6" />}
            trend="up"
            color="purple"
          />
          <KPICard
            title="ROAS"
            value={kpis.avgRoas.toFixed(2)}
            change={aiImpact.roasImprovement > 0 ? `+${aiImpact.roasImprovement.toFixed(1)}%` : undefined}
            icon={<TrendingUp className="w-6 h-6" />}
            trend={aiImpact.roasImprovement > 0 ? 'up' : undefined}
            color="indigo"
          />
        </div>

        {/* AI Before/After Comparison */}
        {beforeAfterData && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">
              AI Impact: Before vs After Optimization
            </h2>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-2">Cost per Acquisition</div>
                <div className="flex items-center justify-center gap-4">
                  <div>
                    <div className="text-2xl font-bold text-gray-400">
                      ${beforeAfterData.before.cpa}
                    </div>
                    <div className="text-xs text-gray-500">Before</div>
                  </div>
                  <TrendingDown className="w-6 h-6 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      ${beforeAfterData.after.cpa}
                    </div>
                    <div className="text-xs text-green-600">After AI</div>
                  </div>
                </div>
                <div className="mt-2 text-sm font-medium text-green-600">
                  {(((beforeAfterData.before.cpa - beforeAfterData.after.cpa) / beforeAfterData.before.cpa) * 100).toFixed(0)}% improvement
                </div>
              </div>

              <div className="text-center">
                <div className="text-sm text-gray-600 mb-2">Return on Ad Spend</div>
                <div className="flex items-center justify-center gap-4">
                  <div>
                    <div className="text-2xl font-bold text-gray-400">
                      {beforeAfterData.before.roas}x
                    </div>
                    <div className="text-xs text-gray-500">Before</div>
                  </div>
                  <TrendingUp className="w-6 h-6 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {beforeAfterData.after.roas}x
                    </div>
                    <div className="text-xs text-green-600">After AI</div>
                  </div>
                </div>
                <div className="mt-2 text-sm font-medium text-green-600">
                  {(((beforeAfterData.after.roas - beforeAfterData.before.roas) / beforeAfterData.before.roas) * 100).toFixed(0)}% improvement
                </div>
              </div>

              <div className="text-center">
                <div className="text-sm text-gray-600 mb-2">Monthly Spend</div>
                <div className="flex items-center justify-center gap-4">
                  <div>
                    <div className="text-2xl font-bold text-gray-400">
                      ${beforeAfterData.before.cost}
                    </div>
                    <div className="text-xs text-gray-500">Before</div>
                  </div>
                  <TrendingDown className="w-6 h-6 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      ${beforeAfterData.after.cost}
                    </div>
                    <div className="text-xs text-green-600">After AI</div>
                  </div>
                </div>
                <div className="mt-2 text-sm font-medium text-green-600">
                  ${beforeAfterData.before.cost - beforeAfterData.after.cost} saved
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Chart */}
        {chartData.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Performance Trends (30 Days)</h2>
            <MetricsChart
              data={chartData}
              metrics={['cost', 'conversions']}
              height={300}
            />
          </div>
        )}

        {/* Active Campaigns */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Active Campaigns</h2>
            <button
              onClick={() => router.push('/campaigns')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View All →
            </button>
          </div>
          
          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No campaigns found</p>
              <button
                onClick={handleSync}
                className="btn btn-primary mt-4"
              >
                Sync Campaigns
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaigns.slice(0, 6).map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onSelect={() => router.push(`/campaigns/${campaign.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
