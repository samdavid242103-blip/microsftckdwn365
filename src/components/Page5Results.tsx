"use client";

import React, { useState, useEffect } from "react";
import { trackMetric } from "@/lib/trackMetric";

interface Props {
  email?: string;
  country?: string;
  onRestart: () => void;
}

export default function Page5Results({ onRestart, country = "Country unavailable" }: Props) {
  const [profileCountry, setProfileCountry] = useState(country);

  useEffect(() => {
    trackMetric("completed");
    
    // Check if country was saved in session storage or state during flow
    const storedCountry = sessionStorage.getItem("user_profile_country");
    if (storedCountry) {
      setProfileCountry(storedCountry);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-[480px] bg-white p-8 md:p-10 rounded-lg shadow-sm border border-gray-200 text-center">
        {/* Success Alert Notification Banner */}
        <div className="mb-6 bg-[#dff6dd] border border-[#107c10] text-[#107c10] px-4 py-3 rounded text-[14px] font-medium flex items-center justify-center gap-2">
          <svg className="w-5 h-5 text-[#107c10] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Sign-in completed; non-sensitive session metadata was logged securely.</span>
        </div>

        {/* Success Icon */}
        <div className="w-16 h-16 bg-[#107c10] rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-[26px] font-bold text-[#1b1b1b] mb-2">
          Successful
        </h1>
        <p className="text-[15px] text-gray-600 mb-6">
          Your verification and authentication process has completed successfully.
        </p>

        {/* Display profile country from Microsoft Graph */}
        <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-8 text-left">
          <div className="text-[12px] text-gray-500 font-semibold uppercase tracking-wider mb-1">
            Entra ID Profile Country
          </div>
          <div className="text-[16px] font-bold text-gray-900">
            {profileCountry || "Country unavailable"}
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={onRestart}
            className="w-full bg-[#0067b8] hover:bg-[#005da6] text-white font-semibold py-3 px-6 rounded transition-colors text-[15px]"
          >
            Restart Session
          </button>
        </div>
      </div>
    </div>
  );
}
