import React from "react";

interface BlogGridProps {
  children: React.ReactNode;
  className?: string;
}

export default function BlogGrid({ children, className = "" }: BlogGridProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {children}
    </div>
  );
}
