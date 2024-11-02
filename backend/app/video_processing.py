import cv2
import numpy as np
from scipy.fft import fft, fftfreq
from app.spo2_estimation import estimate_spo2
from scipy.signal import butter, filtfilt

def calculate_heart_rate_fft(signal, fps):
    """Calculate heart rate using FFT analysis."""
    detrended = signal - np.mean(signal)
    N = len(detrended)
    freqs = fftfreq(N, d=1/fps)
    fft_values = np.abs(fft(detrended))

    idxs = np.where(freqs >= 0)
    freqs = freqs[idxs]
    fft_values = fft_values[idxs]

    heart_rate_range = (0.8, 3)
    valid_idxs = np.where((freqs >= heart_rate_range[0]) & (freqs <= heart_rate_range[1]))

    if len(valid_idxs[0]) == 0:
        return None
    
    peak_idx = np.argmax(fft_values[valid_idxs])
    peak_freq = freqs[valid_idxs][peak_idx]
    return peak_freq * 60

def calculate_heart_rate_bandpass(signal, fps):
    """Calculate heart rate using bandpass filtering."""
    # Check if signal is long enough
    if len(signal) <= 15:  # minimum required length
        return None
        
    nyquist = fps / 2
    low, high = 0.5 / nyquist, 4 / nyquist
    b, a = butter(2, [low, high], btype='band')
    
    filtered = filtfilt(b, a, signal)
    
    peaks = []
    for i in range(1, len(filtered) - 1):
        if filtered[i] > filtered[i-1] and filtered[i] > filtered[i+1]:
            peaks.append(i)
    
    if len(peaks) < 2:
        return None
        
    intervals = np.diff(peaks) / fps
    avg_interval = np.mean(intervals)
    
    return 60 / avg_interval

def calculate_heart_rate_peaks(signal, fps):
    """Calculate heart rate by directly counting peaks in the signal."""
    detrended = signal - np.mean(signal)
    normalized = detrended / np.std(detrended)

    peaks = []
    min_prominence = 0.1 
    
    for i in range(1, len(normalized) - 1):
        if (normalized[i] > normalized[i-1] and 
            normalized[i] > normalized[i+1] and 
            normalized[i] > min_prominence):
            peaks.append(i)
    
    if len(peaks) < 2:
        return None
    
    intervals = np.diff(peaks) / fps
    avg_interval = np.mean(intervals)
    print("Avg interval:", avg_interval)
    
    heart_rate = 60 / avg_interval
    
    return heart_rate


def process_video(video_path):
    """Process video to extract heart rate and SpO2 measurements."""
    cap = cv2.VideoCapture(video_path)
    intensity_values = []
    fps = cap.get(cv2.CAP_PROP_FPS)

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        roi = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        avg_intensity = np.mean(roi[:, :, 0])  # Using red channel (index 0)
        intensity_values.append(avg_intensity)

    cap.release()
    intensity_values = np.array(intensity_values)

    heart_rate_fft = calculate_heart_rate_fft(intensity_values, fps)
    heart_rate_bandpass = calculate_heart_rate_bandpass(intensity_values, fps)
    heart_rate_peaks = calculate_heart_rate_peaks(intensity_values, fps)
    spo2 = estimate_spo2(intensity_values, fps)

    return heart_rate_fft, heart_rate_bandpass, heart_rate_peaks, spo2