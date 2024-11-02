import os
import librosa
from moviepy.editor import VideoFileClip
from scipy import signal
from scipy.signal import find_peaks
import numpy as np

def process_audio_from_video(video_path):
    # Extract audio using moviepy
    try:
        video_clip = VideoFileClip(video_path)
        audio_clip = video_clip.audio
        audio_path = video_path + '.wav'  # Temporary audio file path
        audio_clip.write_audiofile(audio_path, codec='pcm_s16le')
    except Exception as e:
        print(f"Error extracting audio: {e}")
        return None

    # Process the extracted audio
    heart_rate = process_audio(audio_path)

    # Remove the temporary audio file
    if os.path.exists(audio_path):
        os.remove(audio_path)

    return heart_rate

def process_audio(audio_path):
    try:
        # Load audio file
        y, sr = librosa.load(audio_path, sr=None)

        # Normalize the audio signal
        y = y / np.max(np.abs(y))

        # Bandpass filter
        sos = signal.butter(4, [20, 150], btype='bandpass', fs=sr, output='sos')
        filtered = signal.sosfilt(sos, y)

        # Square the signal
        squared = filtered ** 2

        # Find peaks
        distance = sr * 0.33  # Minimum distance between peaks
        peaks, _ = find_peaks(squared, distance=distance, prominence=0.001)

        if len(peaks) < 2:
            return None

        # Calculate intervals
        intervals = np.diff(peaks) / sr

        # Calculate heart rate
        average_interval = np.mean(intervals)
        heart_rate = 60 / average_interval  # bpm

        return heart_rate
    except Exception as e:
        print(f"Error processing audio: {e}")
        return None