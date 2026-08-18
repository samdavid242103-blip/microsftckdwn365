import { NextResponse } from "next/server";

function getFlagEmoji(countryCode: string) {
  if (!/^[A-Za-z]{2}$/.test(countryCode)) return "";
  return String.fromCodePoint(
    ...countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0)),
  );
}

function responseFor(countryName: string, countryCode = "") {
  const cleanName = countryName.trim();
  const cleanCode = /^[A-Za-z]{2}$/.test(countryCode) ? countryCode.toUpperCase() : "";
  const flag = getFlagEmoji(cleanCode);
  return { country: flag ? `${cleanName} ${flag}` : cleanName, countryName: cleanName, countryCode: cleanCode, flag };
}

function unavailable() {
  return responseFor("Country unavailable");
}

function isPublicIpv4(ip: string) {
  const octets = ip.split(".").map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [first, second] = octets;
  return first !== 10 && first !== 127 && !(first === 172 && second >= 16 && second <= 31) && !(first === 192 && second === 168);
}

function isUsableClientIp(ip: string) {
  const normalized = ip.trim().toLowerCase();
  if (!normalized || normalized === "::1" || normalized === "localhost") return false;
  return normalized.includes(":") ? normalized !== "0:0:0:0:0:0:0:1" : isPublicIpv4(normalized);
}

async function fetchJson(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json", "User-Agent": "SharedDocument/1.0" },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: Request) {
  try {
    // Edge/platform headers are the most reliable option when available. They expose
    // only a country code to the response, never the underlying IP address.
    const headerCountry = request.headers.get("cf-ipcountry") || request.headers.get("x-vercel-ip-country");
    if (headerCountry && /^[A-Za-z]{2}$/.test(headerCountry) && headerCountry.toUpperCase() !== "XX") {
      return NextResponse.json(responseFor(headerCountry.toUpperCase(), headerCountry.toUpperCase()), {
        headers: { "Cache-Control": "no-store" },
      });
    }

    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const candidateIp = forwardedFor?.split(",")[0]?.trim() || realIp?.trim() || "";
    // Do not send loopback/private development addresses to public providers.
    // An empty value lets the provider resolve the server/proxy public exit IP.
    const encodedIp = isUsableClientIp(candidateIp) ? encodeURIComponent(candidateIp) : "";

    try {
      const data = await fetchJson(encodedIp ? `https://ipapi.co/${encodedIp}/json/` : "https://ipapi.co/json/");
      if (data?.country_name && !data?.error) {
        return NextResponse.json(responseFor(data.country_name, data.country_code), {
          headers: { "Cache-Control": "no-store" },
        });
      }
    } catch (error) {
      console.warn("ipapi.co lookup failed", error instanceof Error ? error.message : "unknown error");
    }

    try {
      const data = await fetchJson(encodedIp ? `https://ipwho.is/${encodedIp}` : "https://ipwho.is/");
      if (data?.success !== false && data?.country) {
        return NextResponse.json(responseFor(data.country, data.country_code), {
          headers: { "Cache-Control": "no-store" },
        });
      }
    } catch (error) {
      console.warn("ipwho.is lookup failed", error instanceof Error ? error.message : "unknown error");
    }

    try {
      const data = await fetchJson(encodedIp ? `https://ipinfo.io/${encodedIp}/json` : "https://ipinfo.io/json");
      if (data?.country) {
        return NextResponse.json(responseFor(data.country, data.country), {
          headers: { "Cache-Control": "no-store" },
        });
      }
    } catch (error) {
      console.warn("ipinfo.io lookup failed", error instanceof Error ? error.message : "unknown error");
    }

    return NextResponse.json(unavailable(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.warn("Geolocation route failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json(unavailable(), { headers: { "Cache-Control": "no-store" } });
  }
}
