import React from "react";

export interface BlogGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: 2 | 3 | 4;
}

export default function BlogGrid({
  children,
  className = "",
  columns = 3,
}: BlogGridProps) {
  const colClass =
    columns === 2
      ? "grid-cols-1 md:grid-cols-2"
      : columns === 4
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

  return (
    <div
      role="feed"
      aria-label="Blog posts grid"
      className={`grid ${colClass} gap-6 sm:gap-8 ${className}`}
    >
      {children}
    </div>
  );
}
