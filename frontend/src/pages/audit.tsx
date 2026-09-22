import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { applyAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { FileText, Filter, Download } from 'lucide-react';
import { format } from 'date-fns';

export default function AuditLog() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [actionFilter, setActionFilter] = useState('all');
  const [targetFilter, setTargetFilter] = useState('all');

  useEffect(() => {
    loadLogs();
  }, [actionFilter, targetFilter]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 200 };
      if (actionFilter !== 'all') params.action = actionFilter;
      if (targetFilter !== 'all') params.targetType = targetFilter;

      const res = await applyAPI.getAudit(params);
      setLogs(res.data.data);
    } catch (error: any) {
      toast.error('Failed to load audit log');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Date', 'Action', 'Target', 'User', 'Before', 'After', 'Success'];
    const rows = logs.map(log => [
      format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss'),
      log.action,
      `${log.targetType}:${log.targetId}`,
      log.actorUserId || 'System',
      JSON.stringify(log.beforeJson),
      JSON.stringify(log.afterJson),
      log.success ? 'Yes' : 'No'
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('Audit log exported!');
  };

  const uniqueActions = [...new Set(logs.map(l => l.action))];
  const uniqueTargets = [...new Set(logs.map(l => l.targetType))];

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner text="Loading audit log..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Audit Log</h1>
            <p className="text-gray-600 mt-1">
              Complete history of all changes made to your campaigns
            </p>
          </div>
          <button
            onClick={exportCSV}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action
              </label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="all">All Actions</option>
                {uniqueActions.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Type
              </label>
              <select
                value={targetFilter}
                onChange={(e) => setTargetFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="all">All Types</option>
                {uniqueTargets.map((target) => (
                  <option key={target} value={target}>
                    {target}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Log Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                    Timestamp
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                    Target
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                    Changes
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No audit logs found</p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {format(new Date(log.createdAt), 'MMM dd, HH:mm:ss')}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div>{log.targetType}</div>
                        <div className="text-xs text-gray-500">{log.targetId}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1 text-sm">
                          {log.beforeJson && Object.keys(log.beforeJson).length > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">Before:</span>
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {JSON.stringify(log.beforeJson)}
                              </code>
                            </div>
                          )}
                          {log.afterJson && Object.keys(log.afterJson).length > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">After:</span>
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {JSON.stringify(log.afterJson)}
                              </code>
                            </div>
                          )}
                          {log.errorMessage && (
                            <div className="text-xs text-red-600 mt-1">
                              Error: {log.errorMessage}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {log.success ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Failed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {logs.length > 0 && (
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing {logs.length} audit log entries
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
