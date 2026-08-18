import { NextResponse } from "next/server";
import { ConfidentialClientApplication, PublicClientApplication, CryptoProvider } from "@azure/msal-node";
import crypto from "crypto";

export async function GET(request: Request) {
  const tenant = process.env.TENANT_ID || process.env.MICROSOFT_TENANT_ID || "common";
  const clientId = process.env.CLIENT_ID || process.env.MICROSOFT_CLIENT_ID || process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET || process.env.MICROSOFT_CLIENT_SECRET;

  const host = request.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const redirectUri = process.env.REDIRECT_URI || process.env.MICROSOFT_REDIRECT_URI || `${protocol}://${host}/api/auth/callback/microsoft`;

  if (!clientId || clientId === "YOUR_MICROSOFT_CLIENT_ID") {
    return NextResponse.json(
      { 
        error: "CLIENT_ID is not configured. You must obtain a valid Client ID from your Microsoft Entra app registration.",
        required_action: "Register an application in the Microsoft Entra admin center and configure CLIENT_ID in your environment variables."
      },
      { status: 500 }
    );
  }

  try {
    const cryptoProvider = new CryptoProvider();
    const pkceCodes = await cryptoProvider.generatePkceCodes();
    const state = cryptoProvider.createNewGuid();

    const msalConfig = {
      auth: {
        clientId: clientId,
        authority: `https://login.microsoftonline.com/${tenant}`,
        ...(clientSecret ? { clientSecret } : {}),
      },
    };

    // Use ConfidentialClientApplication if secret exists, else PublicClientApplication
    const cca = clientSecret 
      ? new ConfidentialClientApplication(msalConfig)
      : new PublicClientApplication(msalConfig);

    const authCodeUrlParameters = {
      scopes: ["user.read", "openid", "profile", "email"],
      redirectUri: redirectUri,
      responseMode: "query" as const,
      state: state,
      codeChallenge: pkceCodes.challenge,
      codeChallengeMethod: "S256",
    };

    const authUrl = await cca.getAuthCodeUrl(authCodeUrlParameters);

    const response = NextResponse.redirect(authUrl);
    const isSecure = !host.includes("localhost");

    // Store state and codeVerifier in secure httpOnly cookies
    response.cookies.set("oauth_state", state, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      maxAge: 600,
    });

    response.cookies.set("pkce_code_verifier", pkceCodes.verifier, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      maxAge: 600,
    });

    return response;
  } catch (err: any) {
    console.error("MSAL login initiation error:", err);
    return NextResponse.json(
      { error: "Failed to initialize Microsoft authentication.", details: err.message },
      { status: 500 }
    );
  }
}
