// ...existing code...
'use client';
import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-lg ring-1 ring-green-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-green-100">
          <h3 className="text-lg font-semibold text-green-800">{title}</h3>
          <button onClick={onClose} className="text-green-700 px-3 py-1 rounded hover:bg-green-50">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
// ...existing code...