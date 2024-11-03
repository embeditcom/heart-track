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
        audio_path = video_path + '.wav'
        audio_clip.write_audiofile(audio_path, codec='pcm_s16le')
    except Exception as e:
        print(f"Error extracting audio: {e}")
        return None
    heart_rate = process_audio(audio_path)

    if os.path.exists(audio_path):
        os.remove(audio_path)

    return heart_rate

def process_audio(audio_path):
    try:
        y, sr = librosa.load(audio_path, sr=None)

        y = y / np.max(np.abs(y))


        signal_energy = np.mean(np.abs(y))
        if signal_energy < 0.1:
            print("Audio signal too weak")
            return None

        noise_floor = np.mean(np.abs(y[::100]))
        snr = 20 * np.log10(signal_energy / noise_floor)
        if snr < 15: 
            print("Audio too noisy")
            return None

        spec = np.abs(librosa.stft(y))
        freqs = librosa.fft_frequencies(sr=sr)
        heart_rate_band = (0.8, 2.5)
        valid_freq_mask = (freqs >= heart_rate_band[0]) & (freqs <= heart_rate_band[1])
        heart_rate_energy = np.mean(spec[valid_freq_mask])
        total_energy = np.mean(spec)
        
        if heart_rate_energy / total_energy < 0.1:
            print("No clear heart rate signal in audio")
            return None

        sos = signal.butter(4, [20, 150], btype='bandpass', fs=sr, output='sos')
        filtered = signal.sosfilt(sos, y)

        n = len(filtered)
        fft = np.fft.fft(filtered)
        freq = np.fft.fftfreq(n, d=1/sr)
        
        positive_freq_idx = freq > 0
        freq = freq[positive_freq_idx]
        fft_magnitude = np.abs(fft[positive_freq_idx])

        mask = (freq >= 0.8) & (freq <= 2.5)
        peak_freq = freq[mask][np.argmax(fft_magnitude[mask])]
        
        heart_rate = peak_freq * 60

        return heart_rate
    except Exception as e:
        print(f"Error processing audio: {e}")
        return None