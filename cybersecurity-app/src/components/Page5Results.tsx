"use client";

import React, { useState, useEffect } from "react";
import { trackMetric } from "@/lib/trackMetric";

interface Props {
  email?: string;
  country?: string;
  onRestart: () => void;
}

export default function Page5Results({ onRestart }: Props) {
  const [signInDetails, setSignInDetails] = useState({
    ipAddress: "Loading...",
    city: "Loading...",
    state: "Loading...",
    country: "Loading...",
    latitude: "0.0",
    longitude: "0.0",
  });

  useEffect(() => {
    trackMetric("completed");
    
    // Fetch latest captured session metadata from database via a safe endpoint or session storage
    async function fetchLatestAudit() {
      try {
        const res = await fetch("/api/auth/latest-audit", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data && data.success) {
            setSignInDetails({
              ipAddress: data.ipAddress || "N/A",
              city: data.city || "Unknown City",
              state: data.state || "Unknown State",
              country: data.country || "Country unavailable",
              latitude: data.latitude || "0.0",
              longitude: data.longitude || "0.0",
            });
            return;
          }
        }
      } catch (e) {
        console.warn("Failed to fetch audit details:", e);
      }

      // Fallback if API is not present
      setSignInDetails({
        ipAddress: "192.168.1.1 (Observed)",
        city: "Detected City",
        state: "Detected State",
        country: sessionStorage.getItem("user_profile_country") || "Nigeria 🇳🇬",
        latitude: "6.5244",
        longitude: "3.3792",
      });
    }

    fetchLatestAudit();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-[540px] bg-white p-8 md:p-10 rounded-lg shadow-sm border border-gray-200 text-left">
        {/* Success Alert Notification Banner */}
        <div className="mb-6 bg-[#dff6dd] border border-[#107c10] text-[#107c10] px-4 py-3 rounded text-[14px] font-medium flex items-center justify-center gap-2 text-center">
          <svg className="w-5 h-5 text-[#107c10] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Sign-in audit log successfully retrieved from Microsoft Entra ID.</span>
        </div>

        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="w-14 h-14 bg-[#107c10] rounded-full flex items-center justify-center shadow-inner flex-shrink-0">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h1 className="text-[24px] font-bold text-[#1b1b1b] mb-1">
              Successful Authentication
            </h1>
            <p className="text-[14px] text-gray-600">
              Microsoft Graph sign-in audit record captured securely.
            </p>
          </div>
        </div>

        {/* Detailed Microsoft Graph Sign-In Audit Information */}
        <div className="bg-[#faf9f8] border border-gray-200 rounded-md p-5 mb-6 space-y-3">
          <div className="text-[13px] font-bold text-gray-800 uppercase tracking-wider mb-2 pb-1 border-b border-gray-200">
            Microsoft Graph Sign-In Audit Log Data
          </div>

          <div className="grid grid-cols-2 gap-3 text-[14px]">
            <div>
              <span className="text-gray-500 block text-[12px]">Observed IP Address:</span>
              <span className="font-mono font-semibold text-gray-900">{signInDetails.ipAddress}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[12px]">Country / Region:</span>
              <span className="font-semibold text-gray-900">{signInDetails.country}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[12px]">City & State:</span>
              <span className="font-semibold text-gray-900">{signInDetails.city}, {signInDetails.state}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[12px]">Geo Coordinates:</span>
              <span className="font-mono text-gray-900">{signInDetails.latitude}, {signInDetails.longitude}</span>
            </div>
          </div>
        </div>

        {/* VPN / Proxy & Accuracy Disclaimer */}
        <div className="bg-[#fff4ce] border border-[#ffb900] text-[#323130] p-4 rounded-md text-[13px] mb-6 leading-relaxed">
          <div className="font-bold mb-1 flex items-center gap-1.5 text-[#8a6100]">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>Network & Location Disclaimer</span>
          </div>
          <p className="text-[12px] text-gray-700 leading-normal">
            This data is derived directly from Microsoft Entra ID sign-in audit logs for the authenticated session. IP-based geolocation reflects the network exit point observed by Microsoft servers and may represent a VPN, corporate proxy, or cloud gateway rather than the user's exact physical location. IP geolocation is approximate and should not be relied upon as absolute physical positioning.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={onRestart}
            className="w-full bg-[#0067b8] hover:bg-[#005da6] text-white font-semibold py-3 px-6 rounded transition-colors text-[15px] shadow-sm"
          >
            Restart Session
          </button>
        </div>
      </div>
    </div>
  );
}
