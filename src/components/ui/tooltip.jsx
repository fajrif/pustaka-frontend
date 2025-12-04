// Tooltip.jsx
import React from 'react';

const Tooltip = ({ children, content }) => {
  return (
    <div className="relative group flex items-center justify-center">
      {/* The trigger element */}
      {children}

      {/* The tooltip content */}
      <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="bg-gray-800 text-white text-xs rounded py-1 px-3 shadow-lg whitespace-nowrap">
          {content}
        </div>
      </div>
    </div>
  );
};

export { Tooltip };
