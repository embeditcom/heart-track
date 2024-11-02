import React, { useState } from 'react';

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

interface VideoCardProps {
    video: Video;
    formatFileSize: (bytes: number) => string;
    formatDate: (timestamp: number) => string;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, formatFileSize, formatDate }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div 
            onClick={() => setIsExpanded(!isExpanded)}
            className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
        >
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="font-semibold text-gray-900">{video.name}</h3>
                        <p className="text-sm text-gray-500">
                            Size: {formatFileSize(video.size)}
                        </p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                        <p>Created: {formatDate(video.created)}</p>
                        <p>Modified: {formatDate(video.modified)}</p>
                    </div>
                </div>

                {isExpanded && (
                    <>
                        {video.results && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-medium mb-2">Results</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <p>Heart Rate (Video - FFT): {video.results.heart_rate_video?.toFixed(1) ?? 'N/A'} BPM</p>
                                    <p>Heart Rate (Video - Bandpass): {video.results.heart_rate_video_2?.toFixed(1) ?? 'N/A'} BPM</p>
                                    <p>Heart Rate (Video - Peaks): {video.results.heart_rate_video_3?.toFixed(1) ?? 'N/A'} BPM</p>
                                    <p>Heart Rate (Audio): {video.results.heart_rate_audio?.toFixed(1) ?? 'N/A'} BPM</p>
                                    <p>SpO₂: {video.results.spo2.toFixed(1)}%</p>
                                </div>
                            </div>
                        )}

                        {video.figure && (
                            <div>
                                <img 
                                    src={`data:image/png;base64,${video.figure}`}
                                    alt="Heart Rate Comparison"
                                    className="w-full max-w-2xl mx-auto"
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default VideoCard;