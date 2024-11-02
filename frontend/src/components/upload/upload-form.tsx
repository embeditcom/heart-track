import React, { useState, useRef } from 'react';
import axios from 'axios';
import ResultsTable from './results-table';
import { v4 as uuidv4 } from 'uuid';

interface HealthData {
  heart_rate_video: number | null;
  heart_rate_audio: number | null;
  heart_rate_video_2: number | null;
  heart_rate_video_3: number | null;
  spo2: number;
}

const HOST = 'localhost';
const PORT = 5000;

const UploadForm: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files[0]) {
      setFile(files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a video file first');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('video', file);
    const measurement_id = uuidv4();

    try {
      const response = await axios.post(`http://${HOST}:${PORT}/upload/${measurement_id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setHealthData(response.data);
    } catch (err) {
      setError('Error processing video. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white shadow-xl rounded-lg p-6">
      <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
        Heart Track Analysis
      </h1>

      <div className="space-y-6">
        <div className="flex flex-col items-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="video/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Select Video
          </button>
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {file.name}
            </p>
          )}
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleUpload}
            disabled={loading || !file}
            className={`px-6 py-2 rounded-lg ${
              loading || !file
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            } text-white transition-colors`}
          >
            {loading ? 'Processing...' : 'Analyze Video'}
          </button>
        </div>

        {error && (
          <div className="text-red-600 text-center">{error}</div>
        )}

        {healthData && <ResultsTable data={healthData} />}
      </div>
    </div>
  );
};

export default UploadForm;
