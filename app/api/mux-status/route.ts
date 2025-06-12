/*
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import Mux from "@mux/mux-node";

const client = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get all videos for this user that are not ready
    const videos = await db.video.findMany({
      where: {
        userId: userId,
        status: {
          in: ['uploading', 'preparing']
        }
      }
    });

    const statusChecks = [];

    for (const video of videos) {
      if (video.assetId) {
        try {
          // Check the asset status directly from Mux
          const asset = await client.video.assets.retrieve(video.assetId);
          
          statusChecks.push({
            videoId: video.id,
            uploadId: video.uploadId,
            assetId: video.assetId,
            currentStatus: video.status,
            muxStatus: asset.status,
            muxPlaybackIds: asset.playback_ids,
            muxDuration: asset.duration,
            muxCreatedAt: asset.created_at,
            needsUpdate: asset.status === 'ready' && video.status !== 'ready'
          });

          // If the asset is ready but our database isn't updated, update it
          if (asset.status === 'ready' && video.status !== 'ready') {
            const playbackId = asset.playback_ids?.[0]?.id || null;
            
            await db.video.update({
              where: { id: video.id },
              data: {
                playbackId: playbackId,
                status: 'ready',
                duration: asset.duration || null,
                aspectRatio: asset.aspect_ratio || null,
                videoQuality: asset.video_quality || null,
                encodingTier: asset.encoding_tier || null,
                maxStoredResolution: asset.max_stored_resolution || null,
                maxStoredFrameRate: asset.max_stored_frame_rate || null,
                masterAccess: asset.master_access || null,
                playbackPolicy: asset.playback_ids?.[0]?.policy ? [asset.playback_ids[0].policy] : [],
                audioOnly: false, // This field might not be available in the asset object
                updatedAt: new Date()
              }
            });

            console.log(`✅ Manually updated video ${video.id} to ready status`);
          }

        } catch (error) {
          statusChecks.push({
            videoId: video.id,
            uploadId: video.uploadId,
            assetId: video.assetId,
            currentStatus: video.status,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      } else {
        statusChecks.push({
          videoId: video.id,
          uploadId: video.uploadId,
          assetId: null,
          currentStatus: video.status,
          note: 'No asset ID yet'
        });
      }
    }

    return NextResponse.json({
      message: 'Status check completed',
      totalVideos: videos.length,
      statusChecks: statusChecks,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("[MUX STATUS CHECK]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}   */