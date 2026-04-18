/* eslint-disable require-jsdoc */
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { loadConfig, deleteConfig } from "@/lib/storage";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const config = loadConfig(id);
    if (!config) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(config);
  } catch (error) {
    console.error("GET /api/configs/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to load config" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    deleteConfig(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/configs/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete config" },
      { status: 500 }
    );
  }
}
