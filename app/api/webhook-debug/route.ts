import { NextResponse } from "next/server";
import { NextRequest } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: "Webhook Debug Endpoint",
    timestamp: new Date().toISOString(),
    status: "ready"
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headers = Object.fromEntries(request.headers.entries());
    
    console.log('=== WEBHOOK DEBUG ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Headers:', JSON.stringify(headers, null, 2));
    console.log('Body:', JSON.stringify(body, null, 2));
    console.log('URL:', request.url);
    console.log('Method:', request.method);
    console.log('=== END WEBHOOK DEBUG ===');
    
    return NextResponse.json({
      received: true,
      timestamp: new Date().toISOString(),
      headers: headers,
      body: body,
      message: "Webhook received and logged"
    });
  } catch (error) {
    console.error('Webhook debug error:', error);
    return NextResponse.json({
      error: "Failed to parse webhook",
      timestamp: new Date().toISOString()
    }, { status: 400 });
  }
} 