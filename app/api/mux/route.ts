import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import Mux from "@mux/mux-node";

const client = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

// Handle upload success from frontend
async function handleUploadSuccess(data: any, userId: string) {
  console.log("Handling upload success:", JSON.stringify(data, null, 2));
  
  // Extract upload ID from endpoint URL
  let uploadId = data?.extractedId;
  if (!uploadId && data?.endpoint) {
    const urlMatch = data.endpoint.match(/upload\/([^?]+)/);
    if (urlMatch) {
      uploadId = urlMatch[1];
    }
  }
  
  if (!uploadId) {
    throw new Error("No upload ID found in upload success data");
  }
  
  // Create initial record with upload ID
  const video = await db.video.create({
    data: {
      uploadId: uploadId,
      status: "uploading",
      userId: userId,
    },
  });
  
  console.log("Created video record with upload ID:", uploadId);
  return video;
}

// Handle Mux webhook events
async function handleWebhookEvent(event: any) {
  const { type: eventType, data: eventData } = event;
  console.log("Handling webhook event:", eventType);
  console.log("Webhook data:", JSON.stringify(eventData, null, 2));

  switch (eventType) {
    case "video.asset.created": {
      const assetId = eventData.id;
      const uploadId = eventData.upload_id;
      if (!assetId) {
        throw new Error("No asset ID in asset created event");
      }
      if (uploadId) {
        const existingVideo = await db.video.findUnique({
          where: { uploadId: uploadId }
        });
        if (existingVideo) {
          await db.video.update({
            where: { uploadId: uploadId },
            data: {
              assetId: assetId,
              status: eventData.status || "preparing",
              muxCreatedAt: eventData.created_at ? String(eventData.created_at) : null,
              muxUpdatedAt: eventData.updated_at ? String(eventData.updated_at) : null,
            }
          });
          console.log("Updated video record with asset ID:", assetId);
        } else {
          await db.video.create({
            data: {
              assetId: assetId,
              uploadId: uploadId,
              status: eventData.status || "preparing",
              muxCreatedAt: eventData.created_at ? String(eventData.created_at) : null,
              muxUpdatedAt: eventData.updated_at ? String(eventData.updated_at) : null,
              userId: "system", // Fallback
            }
          });
          console.log("Created new video record with asset ID:", assetId);
        }
      }
      break;
    }
    case "video.asset.ready": {
      const assetId = eventData.id;
      if (!assetId) {
        throw new Error("No asset ID in asset ready event");
      }
      const updateData = {
        status: "ready",
        playbackId: eventData.playback_ids?.[0]?.id || null,
        duration: eventData.duration || null,
        aspectRatio: eventData.aspect_ratio || null,
        videoQuality: eventData.video_quality || null,
        encodingTier: eventData.encoding_tier || null,
        maxStoredResolution: eventData.max_stored_resolution || null,
        maxStoredFrameRate: eventData.max_stored_frame_rate || null,
        masterAccess: eventData.master_access || null,
        playbackPolicy: eventData.playback_policies || ["public"],
        fileSize: eventData.input_info?.[0]?.file?.size ? BigInt(eventData.input_info[0].file.size) : null,
        audioOnly: eventData.audio_only || false,
        muxUpdatedAt: eventData.updated_at ? String(eventData.updated_at) : null,
      };
      await db.video.upsert({
        where: { assetId: assetId },
        update: updateData,
        create: {
          assetId: assetId,
          userId: "system", // Fallback
          ...updateData,
        }
      });
      console.log("Asset ready - updated video record:", assetId);
      break;
    }
    case "video.asset.errored": {
      const assetId = eventData.id;
      if (!assetId) {
        throw new Error("No asset ID in asset errored event");
      }
      await db.video.upsert({
        where: { assetId: assetId },
        update: {
          status: "errored",
          errorType: eventData.errors?.[0]?.type || "unknown",
          errorMessage: eventData.errors?.[0]?.messages?.join(", ") || "Unknown error",
          muxUpdatedAt: eventData.updated_at ? String(eventData.updated_at) : null,
        },
        create: {
          assetId: assetId,
          status: "errored",
          errorType: eventData.errors?.[0]?.type || "unknown",
          errorMessage: eventData.errors?.[0]?.messages?.join(", ") || "Unknown error",
          muxUpdatedAt: eventData.updated_at ? String(eventData.updated_at) : null,
          userId: "system", // Fallback
        }
      });
      console.log("Asset errored - updated video record:", assetId);
      break;
    }
    case "video.asset.updated": {
      const assetId = eventData.id;
      if (!assetId) {
        throw new Error("No asset ID in asset updated event");
      }
      await db.video.updateMany({
        where: { assetId: assetId },
        data: {
          status: eventData.status || undefined,
          playbackId: eventData.playback_ids?.[0]?.id || undefined,
          duration: eventData.duration || undefined,
          aspectRatio: eventData.aspect_ratio || undefined,
          muxUpdatedAt: eventData.updated_at ? String(eventData.updated_at) : null,
        }
      });
      console.log("Asset updated - refreshed video record:", assetId);
      break;
    }
    default:
      console.log("Unhandled webhook event type:", eventType);
  }
}

// GET endpoint for creating upload URLs
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const directUpload = await client.video.uploads.create({
      cors_origin: '*',
      new_asset_settings: {
        playback_policy: ['public'],
        video_quality: 'basic', // or 'plus' for higher quality
      },
    });

    return NextResponse.json({ url: directUpload.url });
  } catch (error) {
    console.error("[MUX UPLOAD]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST endpoint for handling upload success and webhooks
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Received POST body:", JSON.stringify(body, null, 2));
    const { type, data } = body;

    if (type === "upload.success") {
      const { userId } = await auth();
      if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
      await handleUploadSuccess(data, userId);
      return new NextResponse("Upload success handled", { status: 200 });
    } else if (type?.startsWith("video.")) {
      await handleWebhookEvent(body);
      return new NextResponse("Webhook handled", { status: 200 });
    } else {
      console.log("Unknown event type:", type);
      return new NextResponse("Unknown event type", { status: 400 });
    }
  } catch (error) {
    console.error("[MUX API] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new NextResponse(`Internal Error: ${errorMessage}`, { status: 500 });
  }
} 