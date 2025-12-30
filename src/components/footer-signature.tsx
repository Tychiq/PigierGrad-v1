import React from "react";

export function FooterSignature() {
  return (
    <div className="w-full flex justify-center items-center py-8 mt-auto opacity-40 hover:opacity-100 transition-opacity duration-500">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-900 dark:text-white">Made with</span>
        <span className="text-xs animate-pulse">💻</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-900 dark:text-white">By Tychique</span>
      </div>
    </div>
  );
}
