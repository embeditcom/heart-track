import React from 'react';

interface HealthData {
  heart_rate_video: number | null;
  heart_rate_audio: number | null;
  heart_rate_video_2: number | null;
  heart_rate_video_3: number | null;
  spo2: number;
}

interface ResultsTableProps {
  data: HealthData;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ data }) => {
  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Results</h2>
      <div className="bg-gray-50 rounded-lg p-4">
        <table className="min-w-full">
          <tbody>
            <tr>
              <td className="py-2 font-medium">Heart Rate (Video - FFT)</td>
              <td className="py-2">
                {data.heart_rate_video
                  ? `${Math.round(data.heart_rate_video)} BPM`
                  : 'N/A'}
              </td>
            </tr>
            <tr>
              <td className="py-2 font-medium">Heart Rate (Video - heart_rate_bandpass)</td>
              <td className="py-2">
                {data.heart_rate_video_2
                  ? `${Math.round(data.heart_rate_video_2)} BPM`
                  : 'N/A'}
              </td>
            </tr>
            <tr>
              <td className="py-2 font-medium">Heart Rate (Video - Peaks)</td>
              <td className="py-2">
                {data.heart_rate_video_3
                  ? `${Math.round(data.heart_rate_video_3)} BPM`
                  : 'N/A'}
              </td>
            </tr>
            <tr>
              <td className="py-2 font-medium">Heart Rate (Audio - FFT)</td>
              <td className="py-2">
                {data.heart_rate_audio
                  ? `${Math.round(data.heart_rate_audio)} BPM`
                  : 'N/A'}
              </td>
            </tr>
            <tr>
              <td className="py-2 font-medium">SpO₂</td>
              <td className="py-2">{data.spo2}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultsTable;