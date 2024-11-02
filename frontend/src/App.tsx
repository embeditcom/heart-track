import React, { useState, useRef } from 'react';
import axios from 'axios';

interface HealthData {
  heart_rate_video: number | null;
  heart_rate_audio: number | null;
  spo2: number;
}

function App() {
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

    try {
      const response = await axios.post('http://localhost:5000/upload', formData, {
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
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
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

            {healthData && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Results</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <table className="min-w-full">
                    <tbody>
                      <tr>
                        <td className="py-2 font-medium">Heart Rate (Video)</td>
                        <td className="py-2">
                          {healthData.heart_rate_video
                            ? `${Math.round(healthData.heart_rate_video)} BPM`
                            : 'N/A'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 font-medium">Heart Rate (Audio)</td>
                        <td className="py-2">
                          {healthData.heart_rate_audio
                            ? `${Math.round(healthData.heart_rate_audio)} BPM`
                            : 'N/A'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 font-medium">SpO₂</td>
                        <td className="py-2">{healthData.spo2}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;