export const SkeletonLoader = () => {
  return (
    <div className="lessons-list">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-shimmer skeleton-title" />
          <div className="skeleton-shimmer skeleton-text-short" />
          <div className="skeleton-shimmer skeleton-text-medium" />
          <div className="skeleton-shimmer skeleton-text-short" />
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
