import { NextResponse } from "next/server";

export async function GET() {
  const webhookSecret = process.env.MUX_WEBHOOK_SECRET;
  
  return NextResponse.json({
    hasWebhookSecret: !!webhookSecret,
    secretLength: webhookSecret ? webhookSecret.length : 0,
    secretPreview: webhookSecret ? `${webhookSecret.substring(0, 8)}...` : 'Not found',
    allEnvKeys: Object.keys(process.env).filter(key => key.startsWith('MUX')),
    timestamp: new Date().toISOString()
  });
} 