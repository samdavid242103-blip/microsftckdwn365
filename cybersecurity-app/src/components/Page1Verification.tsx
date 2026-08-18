"use client";

import { useState } from "react";

interface Props {
  onVerified: () => void;
}

export default function Page1Verification({ onVerified }: Props) {
  const [verifying, setVerifying] = useState(false);
  const [complete, setComplete] = useState(false);

  const handleCheck = () => {
    if (verifying || complete) return;
    
    setVerifying(true);

    // Ultra-fast verification simulation so there is no delay
    setTimeout(() => {
      setVerifying(false);
      setComplete(true);
      
      setTimeout(() => {
        onVerified();
      }, 400); // 400ms transition
    }, 600); // 600ms sweep
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] flex flex-col items-center justify-center px-4 py-8 font-sans select-none antialiased">
      {/* Dark Cloudflare Turnstile Widget Simulation matching the user's reference image */}
      <div className="flex flex-col items-center w-full max-w-[320px]">
        <div className="w-full bg-[#313131] rounded-[4px] shadow-md overflow-hidden flex flex-col p-4 mb-4">
          <div className="flex items-center justify-between">
            {/* Left: Checkbox and Label */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleCheck}
                disabled={verifying || complete}
                className={`w-7 h-7 rounded-[3px] border-2 transition-all flex items-center justify-center
                  ${complete ? "bg-transparent border-transparent" : "bg-transparent border-[#666] hover:border-[#888]"}
                  ${verifying ? "cursor-default" : "cursor-pointer"}
                `}
              >
                {verifying && !complete && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {complete && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#22c55e]">
                    <path
                      d="M20 6L9 17L4 12"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
              <span className="text-white text-[15px] font-normal">
                Verify you are human
              </span>
            </div>

            {/* Right: Cloudflare Logo & Links */}
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex flex-col items-center">
                <svg width="28" height="18" viewBox="0 0 24 16" fill="none">
                  <path
                    d="M17.5 5.5C17.5 2.5 15 0 12 0C9.8 0 7.9 1.3 7 3.2C6.7 3.1 6.3 3 6 3C3.8 3 2 4.8 2 7C2 7.2 2 7.4 2.1 7.6C0.8 8.4 0 9.8 0 11.5C0 14 2 16 4.5 16H19.5C22 16 24 14 24 11.5C24 9.4 22.5 7.6 20.5 7.1C20.5 7.1 20.5 7 20.5 7C20.5 6.2 19.8 5.5 19 5.5C18.5 5.5 18 5.7 17.7 6.1C17.6 5.7 17.5 5.5 17.5 5.5Z"
                    fill="#F38020"
                  />
                </svg>
                <span className="text-white text-[9px] font-bold tracking-[0.05em] uppercase">Cloudflare</span>
              </div>
              <div className="flex gap-1">
                <span className="text-[8px] text-[#aaa] hover:underline cursor-pointer">Privacy</span>
                <span className="text-[8px] text-[#666]">•</span>
                <span className="text-[8px] text-[#aaa] hover:underline cursor-pointer">Help</span>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Status Subtext */}
        <div className="text-center">
          {!complete ? (
            <span className="text-[15px] text-[#666] font-normal tracking-tight">
              Browser security sweep in progress.
            </span>
          ) : (
            <span className="text-[15px] text-[#22c55e] font-medium animate-pulse">
              Success! Redirecting...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
