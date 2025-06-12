import { NextResponse } from "next/server";
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const headers = Object.fromEntries(request.headers.entries());
    
    console.log('=== CATCH-ALL WEBHOOK ===');
    console.log('URL:', request.url);
    console.log('Headers:', JSON.stringify(headers, null, 2));
    console.log('Body:', rawBody);
    console.log('========================');
    
    // Try to parse the body
    try {
      const body = JSON.parse(rawBody);
      console.log('Parsed webhook type:', body.type);
      
      if (body.type && body.type.includes('video.asset.ready')) {
        console.log('🚨 FOUND video.asset.ready webhook at wrong endpoint!');
        console.log('This should go to /api/mux');
      }
    } catch (parseError) {
      console.log('Could not parse webhook body as JSON');
    }
    
    return NextResponse.json({ 
      message: 'Webhook caught by catch-all endpoint',
      url: request.url,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Catch-all webhook error:', error);
    return NextResponse.json({ 
      error: 'Error in catch-all webhook',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Webhook catch-all endpoint is active',
    timestamp: new Date().toISOString()
  });
} 