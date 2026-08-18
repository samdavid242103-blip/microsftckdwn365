import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ success: false, error: "Missing Turnstile token" }, { status: 400 });
    }

    const secretKey = process.env.CLOUDFLARE_SECRET_KEY || "1x0000000000000000000000000000000AA"; // Cloudflare dummy test secret key

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
      }),
    });

    const data = await res.json();

    if (data.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: "Turnstile verification failed" }, { status: 400 });
    }
  } catch (err) {
    console.error("Turnstile verification error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
