/* eslint-disable react/prop-types */

import AddNewRoom from "./addNewRoom";

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Modal content */}
      <div className="relative z-10 bg-white rounded-xl shadow-2xl flex flex-col w-full max-w-5xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 bg-slate-600 text-white shrink-0">
          <h2 className="text-base sm:text-lg font-bold">Додати нову квартиру</h2>
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-slate-500 hover:bg-slate-400 transition-colors text-sm font-medium"
            onClick={onClose}
          >
            Закрити ✕
          </button>
        </div>
        {/* Scrollable form content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100">
          <AddNewRoom />
        </div>
        {children && <div className="shrink-0 p-4">{children}</div>}
      </div>
    </div>
  );
};

export default Modal;
