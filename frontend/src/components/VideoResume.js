import React, { useState, useRef } from 'react';
import { Upload, Play, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import jobsApi from '../services/jobsApi';

const VideoResume = ({ userId, currentVideo, onVideoUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentVideo?.url || null);
  const [videoFile, setVideoFile] = useState(null);
  const [videoTitle, setVideoTitle] = useState(currentVideo?.title || 'My Video Resume');
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file');
      return;
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video must be less than 100MB');
      return;
    }

    // Validate duration (max 5 minutes)
    const video = document.createElement('video');
    video.onloadedmetadata = () => {
      if (video.duration > 300) {
        toast.error('Video must be less than 5 minutes');
        return;
      }
      setVideoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    };
    video.src = URL.createObjectURL(file);
  };

  const uploadVideo = async () => {
    if (!videoFile) {
      toast.error('Please select a video file');
      return;
    }

    try {
      setUploading(true);
      
      // Convert video to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64Data = event.target.result;
          
          // Get video duration
          const video = document.createElement('video');
          video.onloadedmetadata = async () => {
            // Save to MongoDB via API
            const videoData = {
              fileName: videoFile.name,
              base64: base64Data,
              title: videoTitle,
              duration: Math.round(video.duration),
            };

            await jobsApi.updateVideoResume(videoData);
            onVideoUpdate(videoData);
            
            toast.success('Video resume uploaded successfully!');
            setVideoFile(null);
            setPreview(base64Data);
          };
          video.src = base64Data;
        } catch (error) {
          console.error('Error processing video:', error);
          toast.error('Failed to process video. Please try again.');
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(videoFile);
    } catch (error) {
      console.error('Error uploading video:', error);
      toast.error('Failed to upload video. Please try again.');
      setUploading(false);
    }
  };

  const deleteVideo = async () => {
    if (!currentVideo?.url) return;

    try {
      setUploading(true);
      
      // Delete from Firebase (optional - if you have the reference)
      // For now, just update the database
      await jobsApi.deleteVideoResume();
      
      setPreview(null);
      onVideoUpdate(null);
      toast.success('Video resume deleted');
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('Failed to delete video');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <Play className="mr-3 text-blue-600" size={28} />
        Video Resume
      </h2>

      {preview ? (
        <div className="mb-6">
          <video
            src={preview}
            controls
            className="w-full rounded-lg bg-gray-900 max-h-96"
          />
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="Video title"
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={deleteVideo}
              disabled={uploading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition">
            <Upload className="mx-auto mb-3 text-gray-400" size={48} />
            <p className="text-gray-600 mb-3">
              Upload a video introduction (max 5 minutes, 100MB)
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Select Video
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>
      )}

      {videoFile && !currentVideo?.url && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-start">
          <AlertCircle className="text-blue-600 mr-3 mt-1 flex-shrink-0" size={20} />
          <div>
            <p className="font-semibold text-blue-900">
              File selected: {videoFile.name}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Ready to upload. Click the upload button below.
            </p>
          </div>
        </div>
      )}

      {videoFile && (
        <button
          onClick={uploadVideo}
          disabled={uploading}
          className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold"
        >
          {uploading ? 'Uploading...' : 'Upload Video Resume'}
        </button>
      )}
    </div>
  );
};

export default VideoResume;