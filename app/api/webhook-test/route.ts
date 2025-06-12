import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ 
    message: "Webhook test endpoint is working!",
    timestamp: new Date().toISOString(),
    status: "ready"
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("=== WEBHOOK TEST RECEIVED ===");
    console.log("Body:", JSON.stringify(body, null, 2));
    
    return NextResponse.json({ 
      message: "Webhook test received successfully",
      receivedData: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Webhook test error:", error);
    return NextResponse.json({ 
      error: "Failed to process webhook test",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 