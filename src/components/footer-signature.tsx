import React from "react";

export function FooterSignature() {
  return (
    <div className="w-full flex justify-center items-center py-10 mt-10 opacity-30 hover:opacity-100 transition-opacity duration-700">
      <div className="flex items-center gap-1.5 text-[9px] font-medium text-blue-900/60 dark:text-white/40">
        <span>Made with</span>
        <span className="text-[11px]">💻</span>
        <span>By Tychique</span>
      </div>
    </div>
  );
}
