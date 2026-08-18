import { NextResponse } from "next/server";
import { ConfidentialClientApplication, PublicClientApplication } from "@azure/msal-node";
import { trackMetricServer } from "@/lib/metrics";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  const cookies = request.headers.get("cookie") || "";
  const stateCookieMatch = cookies.match(/oauth_state=([^;]+)/);
  const savedState = stateCookieMatch ? stateCookieMatch[1] : null;

  const verifierMatch = cookies.match(/pkce_code_verifier=([^;]+)/);
  const codeVerifier = verifierMatch ? verifierMatch[1] : null;

  const host = url.host;
  const protocol = url.protocol;
  const baseUrl = `${protocol}//${host}`;

  // Handle user cancellation or consent denial gracefully
  if (error) {
    const userMessage = error === "access_denied" 
      ? "Authentication was cancelled or consent was denied." 
      : (errorDescription || error);
    return NextResponse.redirect(`${baseUrl}/?auth_error=${encodeURIComponent(userMessage)}`);
  }

  // Validate state (CSRF protection)
  if (!state || !savedState || state !== savedState) {
    return NextResponse.redirect(`${baseUrl}/?auth_error=Invalid+state+parameter+or+expired+session.`);
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/?auth_error=No+authorization+code+returned+from+Microsoft.`);
  }

  if (!codeVerifier) {
    return NextResponse.redirect(`${baseUrl}/?auth_error=PKCE+code+verifier+missing+from+session.`);
  }

  const tenant = process.env.TENANT_ID || process.env.MICROSOFT_TENANT_ID || "common";
  const clientId = process.env.CLIENT_ID || process.env.MICROSOFT_CLIENT_ID || process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET || process.env.MICROSOFT_CLIENT_SECRET;
  const redirectUri = process.env.REDIRECT_URI || process.env.MICROSOFT_REDIRECT_URI || `${baseUrl}/api/auth/callback/microsoft`;

  if (!clientId) {
    return NextResponse.redirect(`${baseUrl}/?auth_error=Client+ID+is+not+configured.`);
  }

  try {
    const msalConfig = {
      auth: {
        clientId: clientId,
        authority: `https://login.microsoftonline.com/${tenant}`,
        ...(clientSecret ? { clientSecret } : {}),
      },
    };

    const cca = clientSecret 
      ? new ConfidentialClientApplication(msalConfig)
      : new PublicClientApplication(msalConfig);

    const tokenRequest = {
      code: code,
      scopes: ["user.read", "openid", "profile", "email"],
      redirectUri: redirectUri,
      codeVerifier: codeVerifier,
    };

    const response = await cca.acquireTokenByCode(tokenRequest);

    if (!response || !response.accessToken) {
      return NextResponse.redirect(`${baseUrl}/?auth_error=Token+exchange+failed+to+return+access+token.`);
    }

    // Successfully authenticated
    await trackMetricServer("oauth_success");
    await trackMetricServer("completed");

    const redirectResponse = NextResponse.redirect(`${baseUrl}/?authenticated=true`);
    
    // Clear cookies securely
    redirectResponse.cookies.set("oauth_state", "", { maxAge: 0 });
    redirectResponse.cookies.set("pkce_code_verifier", "", { maxAge: 0 });
    
    redirectResponse.cookies.set("training_authenticated", "true", {
      httpOnly: true,
      secure: !host.includes("localhost"),
      sameSite: "lax",
      maxAge: 3600,
    });

    return redirectResponse;
  } catch (err: any) {
    console.error("MSAL token acquisition exception:", err);
    return NextResponse.redirect(`${baseUrl}/?auth_error=Authentication+processing+failed.+Please+try+again.`);
  }
}
