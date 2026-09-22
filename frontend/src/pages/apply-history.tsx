import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import StatusBadge from '@/components/StatusBadge';
import LoadingSpinner from '@/components/LoadingSpinner';
import { applyAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  TrendingDown,
  Filter 
} from 'lucide-react';
import { format } from 'date-fns';

export default function ApplyHistory() {
  const [loading, setLoading] = useState(true);
  const [runs, setRuns] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadRuns();
  }, [filter]);

  const loadRuns = async () => {
    setLoading(true);
    try {
      const res = await applyAPI.getRuns({ limit: 100 });
      let data = res.data.data;
      
      if (filter !== 'all') {
        data = data.filter((r: any) => r.status === filter);
      }
      
      setRuns(data);
    } catch (error: any) {
      toast.error('Failed to load apply history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600 animate-spin" />;
      default:
        return null;
    }
  };

  const renderChange = (run: any) => {
    if (!run.appliedChanges) return null;

    const { field, from, to } = run.appliedChanges;

    if (field === 'budget') {
      const diff = to - from;
      const isIncrease = diff > 0;
      
      return (
        <div className="flex items-center gap-2 text-sm">
          {isIncrease ? (
            <TrendingUp className="w-4 h-4 text-green-600" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-600" />
          )}
          <span className="text-gray-600">Budget:</span>
          <span className="font-medium">${from}</span>
          <span className="text-gray-400">→</span>
          <span className={`font-medium ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
            ${to}
          </span>
          <span className="text-xs text-gray-500">
            ({isIncrease ? '+' : ''}{diff > 0 ? '$' + diff.toFixed(2) : '-$' + Math.abs(diff).toFixed(2)})
          </span>
        </div>
      );
    }

    if (field === 'status') {
      return (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">Status:</span>
          <StatusBadge status={from} />
          <span className="text-gray-400">→</span>
          <StatusBadge status={to} />
        </div>
      );
    }

    return (
      <div className="text-sm text-gray-600">
        {field}: {JSON.stringify(from)} → {JSON.stringify(to)}
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner text="Loading apply history..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Apply History</h1>
            <p className="text-gray-600 mt-1">
              Timeline of all applied AI recommendations
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {['all', 'success', 'failed', 'pending'].map((status) => (
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card">
            <div className="text-sm text-gray-600">Total Applied</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {runs.length}
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600">Successful</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {runs.filter(r => r.status === 'success').length}
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600">Failed</div>
            <div className="text-2xl font-bold text-red-600 mt-1">
              {runs.filter(r => r.status === 'failed').length}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          {runs.length === 0 ? (
            <div className="card text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No apply history yet</p>
              <p className="text-sm text-gray-500 mt-2">
                Applied recommendations will appear here
              </p>
            </div>
          ) : (
            runs.map((run) => (
              <div
                key={run.id}
                className="card border-l-4 hover:shadow-md transition-shadow"
                style={{
                  borderLeftColor:
                    run.status === 'success'
                      ? '#10b981'
                      : run.status === 'failed'
                      ? '#ef4444'
                      : '#f59e0b',
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getStatusIcon(run.status)}</div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {run.recommendation?.type
                            ? `${run.recommendation.type.charAt(0).toUpperCase()}${run.recommendation.type.slice(1)} Optimization`
                            : 'Optimization Applied'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {format(new Date(run.createdAt), 'MMM dd, yyyy • HH:mm')}
                        </p>
                      </div>
                      <StatusBadge status={run.status} />
                    </div>

                    {renderChange(run)}

                    {run.recommendation?.scopeId && (
                      <div className="mt-2 text-xs text-gray-500">
                        Campaign ID: {run.recommendation.scopeId}
                      </div>
                    )}

                    {run.error && (
                      <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="text-sm text-red-800">
                          <span className="font-medium">Error:</span> {run.error}
                        </div>
                      </div>
                    )}

                    {run.status === 'success' && run.appliedChanges && (
                      <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="text-sm text-green-800">
                          ✅ Successfully applied to Google Ads
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
