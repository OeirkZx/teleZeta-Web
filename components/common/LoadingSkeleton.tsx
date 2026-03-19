// [TeleZeta] Loading Skeleton Component
// Skeleton placeholder dengan shimmer animation
'use client';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 8, className = '' }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius }}
    />
  );
}

// Pre-built skeleton patterns
export function CardSkeleton() {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="flex items-center gap-3 mb-4">
        <Skeleton width={40} height={40} borderRadius="50%" />
        <div className="flex-1">
          <Skeleton width="60%" height={16} className="mb-2" />
          <Skeleton width="40%" height={12} />
        </div>
      </div>
      <Skeleton height={12} className="mb-2" />
      <Skeleton height={12} width="80%" />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="card" style={{ padding: 20 }}>
      <Skeleton width={28} height={28} borderRadius={6} className="mb-2" />
      <Skeleton width="50%" height={12} className="mb-2" />
      <Skeleton width="30%" height={22} />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 py-3 px-4">
      <Skeleton width={36} height={36} borderRadius="50%" />
      <Skeleton width="30%" height={14} />
      <Skeleton width="20%" height={14} />
      <Skeleton width="15%" height={14} />
      <Skeleton width="10%" height={28} borderRadius={14} />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="animate-fadeIn" style={{ padding: '24px' }}>
      <Skeleton width="30%" height={28} className="mb-2" />
      <Skeleton width="50%" height={14} className="mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

export default Skeleton;
