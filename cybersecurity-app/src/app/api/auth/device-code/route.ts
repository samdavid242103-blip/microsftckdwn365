import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const tenant = process.env.MICROSOFT_TENANT_ID || "common";
  const clientId = process.env.MICROSOFT_CLIENT_ID || process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: "Microsoft Client ID is not configured." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const params = new URLSearchParams({
      client_id: clientId,
      scope: "user.read openid profile email",
    });

    const response = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/devicecode`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error_description || "Failed to generate device code from Microsoft." },
        { status: response.status }
      );
    }

    return NextResponse.json({
      user_code: data.user_code,
      device_code: data.device_code,
      message: data.message,
      verification_uri: data.verification_uri,
      expires_in: data.expires_in,
      interval: data.interval || 5,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error during device code request." },
      { status: 500 }
    );
  }
}
