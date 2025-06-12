import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const videos = await db.video.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log("=== VIDEOS API ===");
    console.log("User ID:", userId);
    console.log("Found videos:", videos.length);
    videos.forEach((video, index) => {
      console.log(`Video ${index + 1}:`, {
        id: video.id,
        uploadId: video.uploadId,
        assetId: video.assetId,
        playbackId: video.playbackId,
        status: video.status,
        duration: video.duration,
        createdAt: video.createdAt,
        updatedAt: video.updatedAt
      });
    });

    return NextResponse.json(videos);
  } catch (error) {
    console.error("[VIDEOS API]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 