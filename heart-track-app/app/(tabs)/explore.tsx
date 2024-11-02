import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import {useRef, useState} from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as FileSystem from 'expo-file-system';
import {FlashMode} from "expo-camera/legacy";

export default function App() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [torch, setTorch] = useState<boolean>(true);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null)

  const [recording, setRecording] = useState();

  console.log('torch', torch);
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

  const imgDir = FileSystem.documentDirectory + 'images/';

  const ensureDirExists = async () => {
    const dirInfo = await FileSystem.getInfoAsync(imgDir);
    console.log("dirInfo")
    console.log(dirInfo)
    if (!dirInfo.exists) {
      FileSystem.makeDirectoryAsync(imgDir, { intermediates: true });
    }
    console.log("Directory exists")
  };

  function saveVideo(uri: string) {
    ensureDirExists();
    const filename = 'video.mov';
    const dest = imgDir + filename;
    console.log("Saving video to: " + dest)
    FileSystem.copyAsync({ from: uri, to: dest });
    return dest
  }

  const recordVideo = async () => {
    console.log("Recording video...")
    console.log("cameraRef: " + cameraRef)
    console.log("cameraRef.current: " )
    console.log(cameraRef.current)
    console.log(cameraRef.current.enableTorch)
    cameraRef.current.enableTorch = true
    const video = await cameraRef.current.recordAsync({"maxDuration": 2});
    console.log("Video recorded", video)

    dest = saveVideo(video.uri)

    console.log("Uploading video...")

    FileSystem.uploadAsync('http://172.20.10.10:5000/upload-video', dest, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'file'
    });

  }

  async function stopRecordVideo() {
    console.log("Stop recording video...")
    cameraRef.current.stopRecording()
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  function toggleTorch() {
    setTorch(current => !current);
  }

  return (
      <View style={styles.container}>
        <CameraView style={styles.camera} facing={facing} ref={cameraRef} mode={'video'} enableTorch={torch} flash={FlashMode.auto}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
              <Text style={styles.text}>Flip Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={toggleTorch}>
              <Text style={styles.text}>Toggle Torch</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={recordVideo}>
              <Text style={styles.text}>Record Video</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={stopRecordVideo}>
              <Text style={styles.text}>Stop</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
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
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64,
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
});
