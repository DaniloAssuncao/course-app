import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    console.log("=== DEBUG VIDEOS ===");
    
    // Get all videos regardless of user
    const allVideos = await db.video.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log("Total videos in database:", allVideos.length);
    
    allVideos.forEach((video, index) => {
      console.log(`Video ${index + 1}:`, {
        id: video.id,
        userId: video.userId,
        uploadId: video.uploadId,
        assetId: video.assetId,
        playbackId: video.playbackId,
        status: video.status,
        duration: video.duration,
        aspectRatio: video.aspectRatio,
        videoQuality: video.videoQuality,
        createdAt: video.createdAt,
        updatedAt: video.updatedAt
      });
    });

    return NextResponse.json({
      total: allVideos.length,
      videos: allVideos.map(video => ({
        id: video.id,
        userId: video.userId,
        uploadId: video.uploadId,
        assetId: video.assetId,
        playbackId: video.playbackId,
        status: video.status,
        duration: video.duration,
        aspectRatio: video.aspectRatio,
        videoQuality: video.videoQuality,
        createdAt: video.createdAt,
        updatedAt: video.updatedAt
      }))
    });
  } catch (error) {
    console.error("[DEBUG VIDEOS]", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
} 