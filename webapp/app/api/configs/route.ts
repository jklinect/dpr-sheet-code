/* eslint-disable require-jsdoc */
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { listConfigs, saveConfig } from "@/lib/storage";
import { FormValues } from "@/types";

export async function GET() {
  try {
    const configs = listConfigs();
    return NextResponse.json(configs);
  } catch (error) {
    console.error("GET /api/configs error:", error);
    return NextResponse.json(
      { error: "Failed to list configs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, values }: { name: string; values: FormValues } = body;
    if (!name || !values) {
      return NextResponse.json(
        { error: "Missing name or values" },
        { status: 400 }
      );
    }
    const config = saveConfig(name, values);
    return NextResponse.json(config);
  } catch (error) {
    console.error("POST /api/configs error:", error);
    return NextResponse.json(
      { error: "Failed to save config" },
      { status: 500 }
    );
  }
}
