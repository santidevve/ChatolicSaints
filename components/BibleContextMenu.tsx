import React from 'react';

interface BibleContextMenuProps {
  top: number;
  left: number;
  onAsk: () => void;
  text: string;
}

const BibleContextMenu: React.FC<BibleContextMenuProps> = ({ top, left, onAsk, text }) => {
  return (
    <div
      className="absolute z-30 animate-fade-in"
      style={{ top: `${top}px`, left: `${left}px` }}
      onMouseDown={e => e.stopPropagation()} // Prevents the global click listener from closing the menu immediately
    >
      <button
        onClick={onAsk}
        className="px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg shadow-lg hover:bg-amber-700 transition-all transform hover:-translate-y-0.5"
      >
        {text}
      </button>
    </div>
  );
};

export default BibleContextMenu;
