interface StatusBadgeProps {
  status: string;
}

const statusColors: Record<string, string> = {
  ENABLED: 'bg-green-100 text-green-800',
  PAUSED: 'bg-yellow-100 text-yellow-800',
  REMOVED: 'bg-red-100 text-red-800',
  draft: 'bg-gray-100 text-gray-800',
  approved: 'bg-blue-100 text-blue-800',
  applied: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  failed: 'bg-red-100 text-red-800',
  success: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800';
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}>
      {status}
    </span>
  );
}
