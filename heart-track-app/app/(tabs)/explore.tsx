import { useState } from 'react';
import { CameraViewContainer } from '@/components/CameraViewContainer';

export default function App() {
  const [measureId, setMeasureId] = useState('');
  const [measureInProgress, setMeasureInProgress] = useState<boolean>(false);

  console.log("App", measureId, measureInProgress);

  return (
      <CameraViewContainer measureId={measureId} measureInProgress={measureInProgress} setMeasureId={setMeasureId} setMeasureInProgress={setMeasureInProgress} />
  )
}