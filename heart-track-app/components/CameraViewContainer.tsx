import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import {useState, useRef, useEffect} from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as FileSystem from 'expo-file-system';
import {FlashMode} from "expo-camera/legacy";

interface CameraViewContainerProps {
    measureId: string,
    measureInProgress: boolean,
    setMeasureId: (measureId: string) => void,
    setMeasureInProgress: (measureInProgress: boolean) => void,
}
export function CameraViewContainer({measureId, measureInProgress, setMeasureId, setMeasureInProgress}: CameraViewContainerProps) {
    let videoRecordingMaxRecorded = 5;

    const [facing, setFacing] = useState<CameraType>('back');
    const [torch, setTorch] = useState<boolean>(true);
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView | null>(null)
    const [heartRate, setHeartRate] = useState(0);
    const [heartRate2, setHeartRate2] = useState(0);
    const [heartRate3, setHeartRate3] = useState(0);
    const [heartRate4, setHeartRate4] = useState(0);
    const [recording, setRecording] = useState();

    // Ref to keep track of the latest measureInProgress value
    const measureInProgressRef = useRef(measureInProgress);
    const measureIdRef = useRef(measureId);

    useEffect(() => {
        // Sync ref with measureInProgress whenever it changes
        measureInProgressRef.current = measureInProgress;
        measureIdRef.current = measureId;
    }, [measureInProgress, measureId]);

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
        // console.log("onVideoRecorded: measureInProgress", measureInProgress)
        console.log("onVideoRecorded: measureInProgress (ref)", measureInProgressRef.current);
        try {
            console.log("Video recorded", video)
            if (!video?.uri) {
                console.error("No video URI available");
                return;
            }

            console.log("Uploading video...");
            FileSystem.uploadAsync('http://172.20.10.2:5000/upload/' + measureIdRef.current, video.uri, {
                httpMethod: 'POST',
                uploadType: FileSystem.FileSystemUploadType.MULTIPART,
                fieldName: 'video',
            }).then((response) => {
                if (response.status == 200) {
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
                } else {
                    console.log("Got response status: " + response.status);
                }
            })
        } catch (error) {
            console.error("Error during video recording/processing:", error);
        }

        console.log("measureInProgress", measureInProgressRef.current)
        if (measureInProgressRef.current) {
            console.log("Restarting measuring")
            cameraRef?.current?.recordAsync({"maxDuration": videoRecordingMaxRecorded}).then(onVideoRecorded)
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
        console.log("Stop measuring: " + measureIdRef.current)
        setMeasureInProgress(false);
        cameraRef?.current?.stopRecording()
        console.log("Calling finish_processing")
        fetch(`http://172.20.10.2:5000/finish_processing/${measureIdRef.current}`, {method: 'POST'})
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
                <TouchableOpacity style={styles.button} onPress={startMeasuring}>
                    <Text style={styles.text}>Start</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={stopMeasuring}>
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
