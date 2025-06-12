import { NextResponse } from "next/server";
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const uploadId = searchParams.get('uploadId');
  const assetId = searchParams.get('assetId');

  if (!action) {
    return NextResponse.json({
      message: "Manual Webhook Trigger",
      usage: "Add ?action=asset_created&uploadId=YOUR_UPLOAD_ID or ?action=asset_ready&assetId=YOUR_ASSET_ID",
      availableActions: ["asset_created", "asset_ready"],
      currentVideos: {
        video1: {
          uploadId: "zyIJ00uhaoU31fStqyq5PzQRwEcfj2602ketCIERXj01I00",
          assetId: "dGMCAX5oS01Od02qDtS6GUA6PyZ01rPQl3Me02wJ3R4T029Q",
          status: "preparing - needs asset_ready webhook"
        },
        video2: {
          uploadId: "csM6mgpu57LxlS9lugxajeXSn012iYxu01LwsIXK00em01Q",
          assetId: null,
          status: "uploading - needs asset_created webhook"
        }
      }
    });
  }

  try {
    let webhookPayload;
    
    if (action === 'asset_created' && uploadId) {
      webhookPayload = {
        type: "video.upload.asset_created",
        data: {
          id: assetId || "manual-asset-" + Date.now(),
          upload_id: uploadId,
          status: "preparing",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };
    } else if (action === 'asset_ready' && assetId) {
      webhookPayload = {
        type: "video.asset.ready",
        data: {
          id: assetId,
          status: "ready",
          duration: 120.5,
          aspect_ratio: "16:9",
          video_quality: "basic",
          encoding_tier: "baseline",
          max_stored_resolution: "HD",
          max_stored_frame_rate: 29.97,
          master_access: "none",
          playback_ids: [
            {
              id: "manual-playback-" + Date.now(),
              policy: "public"
            }
          ],
          audio_only: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };
    } else {
      return NextResponse.json({
        error: "Invalid parameters",
        message: "Use ?action=asset_created&uploadId=ID or ?action=asset_ready&assetId=ID"
      }, { status: 400 });
    }

    // Forward to the main webhook handler
    const response = await fetch(`${request.nextUrl.origin}/api/mux`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload)
    });

    const result = await response.json();

    return NextResponse.json({
      success: true,
      action: action,
      webhookPayload: webhookPayload,
      result: result,
      message: `Successfully triggered ${action} webhook`
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 