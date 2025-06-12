import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Delete all videos for the current user
    const result = await db.video.deleteMany({
      where: {
        userId: userId,
      },
    });

    console.log(`Deleted ${result.count} test videos for user ${userId}`);

    return NextResponse.json({ 
      success: true, 
      deletedCount: result.count,
      message: `Deleted ${result.count} test videos` 
    });
  } catch (error) {
    console.error("[CLEANUP VIDEOS]", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
} 