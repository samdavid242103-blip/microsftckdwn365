import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("cookies") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const text = await file.text();
    return NextResponse.json({ success: true, contents: text });
  } catch (error) {
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
