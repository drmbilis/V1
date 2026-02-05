import StatusBadge from './StatusBadge';
import { Target, DollarSign, MousePointerClick, TrendingUp } from 'lucide-react';

interface CampaignCardProps {
  campaign: any;
  onSelect: () => void;
}

export default function CampaignCard({ campaign, onSelect }: CampaignCardProps) {
  const metrics = campaign.latestMetrics || {};
  const cost = parseFloat(metrics.costMicros || 0) / 1000000;
  const clicks = parseInt(metrics.clicks || 0);
  const conversions = parseFloat(metrics.conversions || 0);
  const ctr = parseFloat(metrics.ctr || 0) * 100;

  return (
    <div
      onClick={onSelect}
      className="card hover:shadow-lg transition-all cursor-pointer border border-gray-200 hover:border-primary-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg line-clamp-1">
            {campaign.name}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {campaign.channelType || 'SEARCH'} Campaign
          </p>
        </div>
        <StatusBadge status={campaign.status} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <div className="bg-blue-50 p-2 rounded">
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Spend</div>
            <div className="font-semibold text-gray-900">
              ${cost.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-green-50 p-2 rounded">
            <MousePointerClick className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Clicks</div>
            <div className="font-semibold text-gray-900">
              {clicks.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-purple-50 p-2 rounded">
            <Target className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Conversions</div>
            <div className="font-semibold text-gray-900">
              {conversions.toFixed(0)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-orange-50 p-2 rounded">
            <TrendingUp className="w-4 h-4 text-orange-600" />
          </div>
          <div>
            <div className="text-xs text-gray-500">CTR</div>
            <div className="font-semibold text-gray-900">
              {ctr.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {campaign.budget && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Daily Budget</span>
            <span className="font-medium text-gray-900">
              ${parseFloat(campaign.budget).toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
