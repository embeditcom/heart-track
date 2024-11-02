import React, { useEffect, useState } from 'react';
import VideoCard from './video-card-component';

interface Video {
    name: string;
    size: number;
    created: number;
    modified: number;
    folder: string;
    results?: {
        heart_rate_video: number | null;
        heart_rate_video_2: number | null;
        heart_rate_video_3: number | null;
        heart_rate_audio: number | null;
        spo2: number;
    };
    figure?: string;
}

const FileList: React.FC = () => {
    const [videos, setVideos] = useState<Video[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
  
    useEffect(() => {
        fetchVideos();
    }, []);
  
    const fetchVideos = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch('http://localhost:5000/get_videos');
            const data = await response.json();
            
            if (data.success) {
                setVideos(data.videos);
            } else {
                setError('Failed to fetch videos');
            }
        } catch (err) {
            setError('Error connecting to server');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
  
    const formatFileSize = (bytes: number): string => {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    };
  
    const formatDate = (timestamp: number): string => {
        return new Date(timestamp * 1000).toLocaleString();
    };
  
    return (
        <div className="bg-white shadow-xl rounded-lg p-6">
            <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
                Video List
            </h1>
            <div className="space-y-4">
                {loading && (
                    <p className="text-center text-gray-600">Loading videos...</p>
                )}
                
                {error && (
                    <p className="text-center text-red-600">{error}</p>
                )}
                
                {!loading && !error && videos.length === 0 && (
                    <p className="text-center text-gray-600">No videos available</p>
                )}
                
                {videos.map((video) => (
                    <VideoCard
                        key={video.folder}
                        video={video}
                        formatFileSize={formatFileSize}
                        formatDate={formatDate}
                    />
                ))}
            </div>
        </div>
    );
};

export default FileList;