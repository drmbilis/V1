import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import StatusBadge from '@/components/StatusBadge';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmDialog from '@/components/ConfirmDialog';
import { recommendationsAPI } from '@/lib/api';
import { useAppStore } from '@/store';
import { toast } from 'react-hot-toast';
import {
  Lightbulb,
  TrendingUp,
  Edit,
  Check,
  X,
  AlertTriangle,
  Sparkles,
  DollarSign
} from 'lucide-react';

export default function Recommendations() {
  const { selectedCustomerId } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [filter, setFilter] = useState('draft');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<any>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [selectedRec, setSelectedRec] = useState<any>(null);

  useEffect(() => {
    loadRecommendations();
  }, [filter, selectedCustomerId]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const res = await recommendationsAPI.list({
        customerId: selectedCustomerId,
        status: filter,
        limit: 50
      });
      setRecommendations(res.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (rec: any) => {
    setEditingId(rec.id);
    setEditedData({ ...rec.proposalJson });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditedData(null);
  };

  const handleSaveEdit = (rec: any) => {
    const updated = recommendations.map(r => 
      r.id === rec.id 
        ? { ...r, proposalJson: editedData }
        : r
    );
    setRecommendations(updated);
    setEditingId(null);
    toast.success('Changes saved! Ready to approve.');
  };

  const handleApprove = async (rec: any) => {
    try {
      await recommendationsAPI.approve(rec.id);
      toast.success('✅ Recommendation approved!');
      loadRecommendations();
      setShowApproveDialog(false);
      setSelectedRec(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to approve');
    }
  };

  const handleReject = async (rec: any) => {
    try {
      await recommendationsAPI.reject(rec.id);
      toast.success('Recommendation rejected');
      loadRecommendations();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to reject');
    }
  };

  const getRiskColor = (level: string) => {
    const colors: Record<string, string> = {
      low: 'text-green-600 bg-green-50',
      medium: 'text-yellow-600 bg-yellow-50',
      high: 'text-red-600 bg-red-50'
    };
    return colors[level] || colors.medium;
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      keyword: Lightbulb,
      budget: DollarSign,
      adcopy: Edit,
      pause: AlertTriangle
    };
    const Icon = icons[type] || Lightbulb;
    return <Icon className="w-5 h-5" />;
  };

  const renderProposal = (rec: any) => {
    const isEditing = editingId === rec.id;
    const data = isEditing ? editedData : rec.proposalJson;

    switch (rec.type) {
      case 'budget':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Current Budget:</span>
              <span className="font-medium">${data.currentBudget}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Recommended:</span>
              {isEditing ? (
                <input
                  type="number"
                  value={data.recommendedBudget}
                  onChange={(e) => setEditedData({
                    ...editedData,
                    recommendedBudget: parseFloat(e.target.value)
                  })}
                  className="border rounded px-2 py-1 w-24 text-right"
                  step="0.01"
                />
              ) : (
                <span className="font-medium text-primary-600">
                  ${data.recommendedBudget}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Change:</span>
              <span className={`font-medium ${
                data.changePercent > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {data.changePercent > 0 ? '+' : ''}{data.changePercent}%
              </span>
            </div>
          </div>
        );

      case 'keyword':
        return (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">
              Add Keywords ({data.keywords?.length || 0}):
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {data.keywords?.slice(0, 5).map((kw: any, idx: number) => (
                <div key={idx} className="text-sm flex items-center gap-2">
                  <span className="text-gray-600">•</span>
                  <span>{kw.text}</span>
                  <span className="text-xs text-gray-500">({kw.matchType})</span>
                </div>
              ))}
              {data.keywords?.length > 5 && (
                <div className="text-xs text-gray-500">
                  +{data.keywords.length - 5} more
                </div>
              )}
            </div>
            {data.negativeKeywords?.length > 0 && (
              <div className="mt-2 pt-2 border-t">
                <div className="text-sm font-medium text-gray-700">
                  Negative Keywords ({data.negativeKeywords.length}):
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {data.negativeKeywords.slice(0, 3).join(', ')}
                  {data.negativeKeywords.length > 3 && '...'}
                </div>
              </div>
            )}
          </div>
        );

      case 'adcopy':
        return (
          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">Headlines:</div>
              {data.headlines?.map((h: string, idx: number) => (
                <div key={idx} className="text-sm text-gray-600 mb-1">
                  {idx + 1}. {h}
                </div>
              ))}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">Descriptions:</div>
              {data.descriptions?.map((d: string, idx: number) => (
                <div key={idx} className="text-sm text-gray-600 mb-1">
                  {idx + 1}. {d}
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <pre className="text-xs text-gray-600 overflow-x-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        );
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner text="Loading recommendations..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Recommendations</h1>
            <p className="text-gray-600 mt-1">
              Review and apply AI-generated optimization suggestions
            </p>
          </div>
          <button className="btn btn-primary flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Generate New
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {['draft', 'approved', 'applied', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Recommendations List */}
        {recommendations.length === 0 ? (
          <div className="card text-center py-12">
            <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No {filter} recommendations</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec) => {
              const isEditing = editingId === rec.id;
              
              return (
                <div key={rec.id} className="card border border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary-50 p-3 rounded-lg">
                      {getTypeIcon(rec.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {rec.type.charAt(0).toUpperCase() + rec.type.slice(1)} Optimization
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <StatusBadge status={rec.status} />
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getRiskColor(rec.riskLevel)}`}>
                              {rec.riskLevel.toUpperCase()} RISK
                            </span>
                            <span className="text-xs text-gray-500">
                              Confidence: {(rec.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {rec.rationale && (
                        <p className="text-sm text-gray-600 mb-4">{rec.rationale}</p>
                      )}

                      {/* Proposal */}
                      <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        {renderProposal(rec)}
                      </div>

                      {/* Expected Impact */}
                      {rec.expectedImpactJson && Object.keys(rec.expectedImpactJson).length > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-900">Expected Impact</span>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            {Object.entries(rec.expectedImpactJson).map(([key, value]) => (
                              <div key={key}>
                                <div className="text-gray-600">{key}</div>
                                <div className="font-medium text-green-700">{value}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      {rec.status === 'draft' && (
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleSaveEdit(rec)}
                                className="btn bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
                              >
                                <Check className="w-4 h-4" />
                                Save Changes
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="btn btn-secondary flex items-center gap-2"
                              >
                                <X className="w-4 h-4" />
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEdit(rec)}
                                className="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
                              >
                                <Edit className="w-4 h-4" />
                                Edit & Customize
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedRec(rec);
                                  setShowApproveDialog(true);
                                }}
                                className="btn btn-primary flex items-center gap-2"
                              >
                                <Check className="w-4 h-4" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(rec)}
                                className="btn bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
                              >
                                <X className="w-4 h-4" />
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Approve Confirmation */}
      <ConfirmDialog
        isOpen={showApproveDialog}
        title="Approve Recommendation"
        message="Are you sure you want to approve this recommendation? It will be ready for application to your Google Ads account."
        confirmText="Approve"
        onConfirm={() => selectedRec && handleApprove(selectedRec)}
        onCancel={() => {
          setShowApproveDialog(false);
          setSelectedRec(null);
        }}
      />
    </Layout>
  );
}
