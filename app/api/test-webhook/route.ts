import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Import the webhook handler functions directly
async function handleAssetCreated(data: any) {
  console.log("=== ASSET CREATED ===");
  const assetId = data.id;
  const uploadId = data.upload_id;
  
  console.log("Asset ID:", assetId);
  console.log("Upload ID:", uploadId);
  
  if (!assetId) {
    throw new Error("No asset ID in asset created event");
  }
  
  // Find existing record by upload ID and update with asset ID
  if (uploadId) {
    console.log("Looking for existing video with upload ID:", uploadId);
    const existingVideo = await db.video.findUnique({
      where: { uploadId: uploadId }
    });
    
    if (existingVideo) {
      console.log("Found existing video record:", existingVideo.id);
      const updatedVideo = await db.video.update({
        where: { uploadId: uploadId },
        data: {
          assetId: assetId,
          status: data.status || "preparing",
          muxCreatedAt: data.created_at,
          muxUpdatedAt: data.updated_at,
        }
      });
      console.log("✅ Updated video record with asset ID:", assetId);
      console.log("Updated video:", updatedVideo);
      return updatedVideo;
    } else {
      console.log("No existing video found, creating new record");
      // Create new record if upload record not found
      const newVideo = await db.video.create({
        data: {
          assetId: assetId,
          uploadId: uploadId,
          status: data.status || "preparing",
          muxCreatedAt: data.created_at,
          muxUpdatedAt: data.updated_at,
          userId: "webhook-created", // Fallback - ideally we'd have user context
        }
      });
      console.log("✅ Created new video record with asset ID:", assetId);
      console.log("New video:", newVideo);
      return newVideo;
    }
  } else {
    console.log("⚠️ No upload ID in asset created event");
    throw new Error("No upload ID provided");
  }
}

async function handleAssetReady(data: any) {
  console.log("=== ASSET READY ===");
  const assetId = data.id;
  
  console.log("Asset ID:", assetId);
  console.log("Playback IDs:", data.playback_ids);
  console.log("Duration:", data.duration);
  console.log("Status:", data.status);
  
  if (!assetId) {
    throw new Error("No asset ID in asset ready event");
  }
  
  // Extract comprehensive asset data
  const updateData = {
    status: "ready",
    playbackId: data.playback_ids?.[0]?.id || null,
    duration: data.duration || null,
    aspectRatio: data.aspect_ratio || null,
    videoQuality: data.video_quality || null,
    encodingTier: data.encoding_tier || null,
    maxStoredResolution: data.max_stored_resolution || null,
    maxStoredFrameRate: data.max_stored_frame_rate || null,
    masterAccess: data.master_access || null,
    playbackPolicy: data.playback_policies || ["public"],
    fileSize: data.input_info?.[0]?.file?.size ? BigInt(data.input_info[0].file.size) : null,
    audioOnly: data.audio_only || false,
    muxUpdatedAt: data.updated_at,
  };
  
  console.log("Update data:", updateData);
  
  const result = await db.video.upsert({
    where: { assetId: assetId },
    update: updateData,
    create: {
      assetId: assetId,
      userId: "webhook-created", // Fallback
      ...updateData,
    }
  });
  
  console.log("✅ Asset ready - updated video record:", assetId);
  console.log("Updated record:", result);
  return result;
}

export async function POST(req: Request) {
  try {
    const { uploadId, assetId, action } = await req.json();
    
    console.log("=== TEST WEBHOOK ===");
    console.log("Action:", action);
    console.log("Upload ID:", uploadId);
    console.log("Asset ID:", assetId);
    
    let webhookData;
    let result;
    
    switch (action) {
      case "asset_created":
        webhookData = {
          id: assetId || "test-asset-id-123",
          upload_id: uploadId,
          status: "preparing",
          created_at: "1640995200",
          updated_at: "1640995200"
        };
        
        console.log("Processing asset_created webhook data:", webhookData);
        result = await handleAssetCreated(webhookData);
        break;
        
      case "asset_ready":
        webhookData = {
          id: assetId || "test-asset-id-123",
          status: "ready",
          duration: 120.5,
          aspect_ratio: "16:9",
          video_quality: "basic",
          encoding_tier: "baseline",
          max_stored_resolution: "HD",
          max_stored_frame_rate: 29.97,
          master_access: "none",
          playback_policies: ["public"],
          playback_ids: [
            {
              id: "test-playback-id-456",
              policy: "public"
            }
          ],
          audio_only: false,
          created_at: "1640995200",
          updated_at: "1640995260"
        };
        
        console.log("Processing asset_ready webhook data:", webhookData);
        result = await handleAssetReady(webhookData);
        break;
        
      default:
        return NextResponse.json({
          success: false,
          error: "Invalid action"
        }, { status: 400 });
    }
    
    console.log("✅ Test webhook processed successfully");
    
    return NextResponse.json({ 
      success: true, 
      action,
      webhookData,
      result: {
        id: result.id,
        uploadId: result.uploadId,
        assetId: result.assetId,
        playbackId: result.playbackId,
        status: result.status,
        duration: result.duration
      }
    });
    
  } catch (error) {
    console.error("❌ Test webhook error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 