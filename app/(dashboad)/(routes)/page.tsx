"use client";
import { UserButton } from "@clerk/nextjs";
import { Video, CheckCircle, Clock, AlertCircle, Upload } from "lucide-react";
import { IconBadge } from "@/components/icon-badge";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

import MuxUploader from "@mux/mux-uploader-react";
import MuxPlayer from "@mux/mux-player-react";
import { Button } from "@/components/ui/button";

interface VideoRecord {
  id: string;
  uploadId: string | null;
  assetId: string | null;
  playbackId: string | null;
  status: string;
  duration: number | null;
  aspectRatio: string | null;
  videoQuality: string | null;
  createdAt: string;
  updatedAt: string;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "uploading":
      return <Upload className="h-4 w-4 text-blue-500 animate-pulse" />;
    case "preparing":
      return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
    case "ready":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "errored":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "uploading":
      return "text-blue-600 bg-blue-50 border-blue-200";
    case "preparing":
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "ready":
      return "text-green-600 bg-green-50 border-green-200";
    case "errored":
      return "text-red-600 bg-red-50 border-red-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
};

const VideoCard = ({ video }: { video: VideoRecord }) => (
  <div className={`border rounded-lg p-4 space-y-2 ${getStatusColor(video.status)} border`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {getStatusIcon(video.status)}
        <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(video.status)}`}>{video.status.toUpperCase()}</span>
        {(video.status === "uploading" || video.status === "preparing") && (
          <span className="text-xs text-gray-500">Processing...</span>
        )}
      </div>
      <div className="text-sm text-gray-500">{new Date(video.createdAt).toLocaleString()}</div>
    </div>
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <span className="font-medium">Upload ID:</span>
        <div className="text-gray-600 font-mono text-xs break-all">{video.uploadId || "N/A"}</div>
      </div>
      <div>
        <span className="font-medium">Asset ID:</span>
        <div className="text-gray-600 font-mono text-xs break-all">{video.assetId || "Pending..."}</div>
      </div>
      <div>
        <span className="font-medium">Playback ID:</span>
        <div className="text-gray-600 font-mono text-xs break-all">{video.playbackId || "Pending..."}</div>
      </div>
      <div>
        <span className="font-medium">Duration:</span>
        <div className="text-gray-600">{video.duration ? `${Math.round(video.duration)}s` : "Pending..."}</div>
      </div>
    </div>
    {video.aspectRatio && (
      <div className="text-sm">
        <span className="font-medium">Aspect Ratio:</span>
        <span className="text-gray-600 ml-2">{video.aspectRatio}</span>
      </div>
    )}
    {video.videoQuality && (
      <div className="text-sm">
        <span className="font-medium">Quality:</span>
        <span className="text-gray-600 ml-2">{video.videoQuality}</span>
      </div>
    )}
    {video.status === "ready" && video.playbackId && (
      
      <MuxPlayer
        playbackId={video.playbackId}
        metadata={{
          video_id: video.id,
          video_title: `Video ${video.id}`,
          viewer_user_id: "user-id-007",
        }}
      />
    )}
  </div>
);

const VideoList = ({ videos }: { videos: VideoRecord[] }) => (
  <div className="grid gap-4">
    {videos.map((video) => (
      <VideoCard key={video.id} video={video} />
    ))}
  </div>
);

const UploaderSection = ({
  uploadUrl,
  isLoading,
  uploadStatus,
  handleUploadSuccess,
  handleUploadError,
  handleUploadProgress,
}: {
  uploadUrl: string;
  isLoading: boolean;
  uploadStatus: string;
  handleUploadSuccess: (event: any) => void;
  handleUploadError: (event: any) => void;
  handleUploadProgress: (event: any) => void;
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Initializing uploader...</div>
      </div>
    );
  }
  if (!uploadUrl) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-red-600">Failed to initialize uploader</div>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <MuxUploader
        endpoint={uploadUrl}
        onSuccess={handleUploadSuccess}
        onError={handleUploadError}
        onProgress={handleUploadProgress}
      />
      {uploadStatus && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800">{uploadStatus}</p>
        </div>
      )}
      <div className="text-sm text-gray-600 space-y-2">
        <p><strong>How it works:</strong></p>
        <ol className="list-decimal list-inside space-y-1 ml-4">
          <li>Select and upload your video file</li>
          <li>Upload information is saved to database</li>
          <li>Mux processes your video in the background</li>
          <li>Real webhooks update status automatically</li>
          <li>You'll see real-time progress: uploading → preparing → ready</li>
        </ol>
      </div>
    </div>
  );
};

export default function Home() {
  const [uploadUrl, setUploadUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [pollingActive, setPollingActive] = useState(false);

  const fetchVideos = useCallback(async () => {
    try {
      setRefreshing(true);
      const response = await fetch("/api/videos");
      if (response.ok) {
        const videosData = await response.json();
        setVideos(videosData);
        
        // Check if there are any videos still processing
        const hasProcessingVideos = videosData.some((video: VideoRecord) => 
          video.status === "uploading" || video.status === "preparing"
        );
        
        setPollingActive(hasProcessingVideos);
        
        console.log("Videos fetched:", videosData.length, "Processing:", hasProcessingVideos);
      } else {
        console.error("Failed to fetch videos:", response.status);
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Auto-refresh videos when there are processing videos
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (pollingActive) {
      //console.log("Starting polling for video updates...");
      interval = setInterval(() => {
        fetchVideos();
      }, 3000); // Poll every 3 seconds
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
        console.log("Stopped polling for video updates");
      }
    };
  }, [pollingActive, fetchVideos]);

  useEffect(() => {
    const fetchUploadUrl = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/mux", {
          method: "GET",
        });
        
        if (!response.ok) {
          throw new Error("Failed to get upload URL");
        }
        
        const data = await response.json();
        setUploadUrl(data.url);
        console.log("Upload URL received:", data.url);
      } catch (error) {
        console.error("Error getting upload URL:", error);
        toast.error("Failed to initialize uploader");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUploadUrl();
    fetchVideos();
  }, [fetchVideos]);

  const handleUploadSuccess = async (event: any) => {
    try {
      //console.log("Upload completed successfully!");
      //console.log("Upload event:", event);
      
      setUploadStatus("Processing upload...");
      
      // Extract upload information
      const uploadData = {
        endpoint: event.target?.endpoint,
        success: event.target?.upload?.success,
        // Extract upload ID from endpoint URL
        extractedId: event.target?.endpoint?.match(/upload\/([^?]+)/)?.[1],
        timestamp: Date.now()
      };
      
      //console.log("Sending upload data to API:", uploadData);
      
      // Call our API route to save upload information
      const response = await fetch("/api/mux", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "upload.success",
          data: uploadData
        }),
      });

      if (response.ok) {
        console.log("Upload information saved to database!");
        setUploadStatus("Upload saved! Processing video...");
        toast.success("Video uploaded successfully! Processing...");
        
        // Start polling for updates
        setPollingActive(true);
        
        // Refresh the video list immediately
        setTimeout(() => {
          fetchVideos();
        }, 1000);
        
        // Clear upload status after a delay
        setTimeout(() => {
          setUploadStatus("");
        }, 5000);
      } else {
        const errorText = await response.text();
        console.error("Failed to save upload information:", errorText);
        setUploadStatus("Upload completed but failed to save");
        toast.error("Upload completed but failed to save information");
      }
    } catch (error) {
      console.error("Error handling upload success:", error);
      setUploadStatus("Error processing upload");
      toast.error("Error processing upload");
    }
  };

  const handleUploadError = (event: any) => {
    console.error("Upload failed:", event);
    setUploadStatus("Upload failed");
    toast.error("Upload failed. Please try again.");
  };

  const handleUploadProgress = (event: any) => {
    const progress = event.detail?.progress || 0;
    setUploadStatus(`Uploading... ${Math.round(progress)}%`);
  };

  const debugDatabase = async () => {
    try {
      console.log("=== DEBUG DATABASE ===");
      const response = await fetch("/api/debug-videos");
      const result = await response.json();
      
      console.log("Database debug result:", result);
      toast.success(`Found ${result.total} videos in database. Check console for details.`);
    } catch (error) {
      console.error("Error debugging database:", error);
      toast.error("Error debugging database");
    }
  };

  const cleanupTestVideos = async () => {
    try {
      console.log("=== CLEANUP TEST VIDEOS ===");
      const response = await fetch("/api/cleanup-test-videos", {
        method: "POST",
      });
      const result = await response.json();
      
      if (result.success) {
        console.log("Cleanup result:", result);
        toast.success(`Deleted ${result.deletedCount} test videos`);
        
        // Refresh the video list
        setTimeout(() => {
          fetchVideos();
        }, 500);
      } else {
        toast.error(`Cleanup failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Error cleaning up test videos:", error);
      toast.error("Error cleaning up test videos");
    }
  };

  return (
    <div className="flex flex-col gap-y-6">
      <div className="flex items-center gap-x-2">
        <IconBadge icon={Video} />
        <h2 className="text-2xl">Video Upload</h2>
        {pollingActive && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            Live updates active
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Button
            onClick={cleanupTestVideos}
            variant="destructive"
            tabIndex={0}
            aria-label="Clean Up Test Videos"
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') cleanupTestVideos(); }}
          >
            Clean Up Videos
          </Button>
          <Button
            onClick={debugDatabase}
            className="flex items-center gap-2  bg-purple-500 text-white rounded hover:bg-purple-600"
            tabIndex={0}
            aria-label="Debug DB"
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') debugDatabase(); }}
          >
            Debug DB
          </Button>
        </div>
      </div>
      
      <UploaderSection
        uploadUrl={uploadUrl}
        isLoading={isLoading}
        uploadStatus={uploadStatus}
        handleUploadSuccess={handleUploadSuccess}
        handleUploadError={handleUploadError}
        handleUploadProgress={handleUploadProgress}
      />

      {/* Video List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Your Videos</h3>
          <div className="flex items-center gap-2">
            {pollingActive && (
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                Auto-refreshing...
              </span>
            )}
            <Button
              onClick={fetchVideos}
              disabled={refreshing}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              tabIndex={0}
              aria-label="Refresh Video List"
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fetchVideos(); }}
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>
        
        {videos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No videos uploaded yet. Upload your first video above!
          </div>
        ) : (
          <VideoList videos={videos} />
        )}
      </div>
    </div>
  );
}
