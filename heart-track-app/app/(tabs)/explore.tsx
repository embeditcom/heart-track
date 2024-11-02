import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as FileSystem from 'expo-file-system';
import {FlashMode} from "expo-camera/legacy";

export default function App() {
  let videoRecordingMaxRecorded = 2;

  const [facing, setFacing] = useState<CameraType>('back');
  const [torch, setTorch] = useState<boolean>(true);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null)
  const [heartRate, setHeartRate] = useState(0);
  const [heartRate2, setHeartRate2] = useState(0);
  const [heartRate3, setHeartRate3] = useState(0);
  const [heartRate4, setHeartRate4] = useState(0);
  const [recording, setRecording] = useState();
  const [measureId, setMeasureId] = useState('');
  const [measureInProgress, setMeasureInProgress] = useState<boolean>(false);

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
        <View style={styles.container}>
          <Text style={styles.message}>We need your permission to show the camera</Text>
          <Button onPress={requestPermission} title="grant permission" />
        </View>
    );
  }

  function onVideoRecorded(video) {
    try {
      console.log("Video recorded", video)
      if (!video?.uri) {
        console.error("No video URI available");
        return;
      }

      console.log("Uploading video...");
      // const response = await FileSystem.uploadAsync('http://172.20.10.10:5000/upload/' + measureId', dest, {
      FileSystem.uploadAsync('http://172.20.10.10:5000/upload', video.uri, {
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: 'video'
      }).then((response) => {
        console.log("Response:", response);

        const result = JSON.parse(response.body);
        console.log("Server response:", result);

        if (result.valid) {
          console.log("Heart Rate (Video):", result.heart_rate_video);
          console.log("Heart Rate (Video):", result.heart_rate_video_2);
          console.log("Heart Rate (Video):", result.heart_rate_video_3);
          console.log("Heart Rate (Audio):", result.heart_rate_audio);
          console.log("SpO2:", result.spo2);
          setHeartRate(Math.round(result.heart_rate_video))
          setHeartRate2(Math.round(result.heart_rate_video_2))
          setHeartRate3(Math.round(result.heart_rate_video_3))
          setHeartRate4(Math.round(result.heart_rate_audio))
        } else {
          console.error("Invalid response from server");
        }

        console.log("measureInProgress", measureInProgress)
        if (measureInProgress) {
          console.log("Restarting measuring")
          cameraRef?.current?.recordAsync({"maxDuration": videoRecordingMaxRecorded}).then(onVideoRecorded)
        }
      })
    } catch (error) {
      console.error("Error during video recording/processing:", error);
    }
  }

  function startMeasuring() {
    // set measureId based on the current time and date in format yyyy-mm-dd-hh-mm-ss
    let s = new Date().getTime().toString();
    setMeasureId(s);
    setMeasureInProgress(true);
    console.log("Start measuring, new id: " + s)
    cameraRef?.current?.recordAsync({"maxDuration": videoRecordingMaxRecorded}).then(onVideoRecorded)
  }

  async function stopMeasuring() {
    console.log("Stop measuring...")
    setMeasureInProgress(false);
    cameraRef?.current?.stopRecording()
  }

  function toggleTorch() {
    setTorch(current => !current);
  }

  return (
      <View style={styles.container}>
        <CameraView style={styles.camera} facing={facing} ref={cameraRef} mode={'video'}
                    enableTorch={torch} flash={FlashMode.auto}>
        </CameraView>
        <View style={styles.heartRateContainerParent}>
          <View style={styles.heartRateContainerTop}>
            <Text style={styles.heartRateDisplay}>{heartRate}</Text>
            {/*<Text style={styles.heartRateDisplay}>{heartRate2}</Text>*/}
            {/*<Text style={styles.heartRateDisplay}>{heartRate3}</Text>*/}
          </View>
          <View style={styles.heartRateContainerBottom}>
            <Text style={styles.heartRateDisplay}>{heartRate4}</Text>
          </View>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={toggleTorch}>
            <Text style={styles.text}>Torch</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={startMeasuring} disabled={measureInProgress}>
            <Text style={styles.text}>Start</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={stopMeasuring} disabled={!measureInProgress}>
            <Text style={styles.text}>Stop</Text>
          </TouchableOpacity>
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: .5,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 40,
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white'
  },
  heartRateContainerParent: {
    justifyContent: 'center',
    flex: 1
  },
  heartRateContainerTop: {
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 20,
    alignItems: "flex-end",
    flex: 1
  },
  heartRateContainerBottom: {
    justifyContent: 'center',
    flex: 1
  },
  heartRateContainer: {
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  heartRateDisplay: {
    fontSize: 50,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  }
});
