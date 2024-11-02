import cv2
import numpy as np
from scipy.fft import fft, fftfreq
from app.spo2_estimation import estimate_spo2

def process_video(video_path):
    cap = cv2.VideoCapture(video_path)
    intensity_values = []
    fps = cap.get(cv2.CAP_PROP_FPS)

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        roi = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        avg_intensity = np.mean(roi[:, :, 1])
        intensity_values.append(avg_intensity)

    cap.release()

    intensity_values = np.array(intensity_values)

    detrended = intensity_values - np.mean(intensity_values)

    N = len(detrended)
    freqs = fftfreq(N, d=1/fps)
    fft_values = np.abs(fft(detrended))

    idxs = np.where(freqs >= 0)
    freqs = freqs[idxs]
    fft_values = fft_values[idxs]

    heart_rate_range = (0.8, 3) 
    valid_idxs = np.where((freqs >= heart_rate_range[0]) & (freqs <= heart_rate_range[1]))

    if len(valid_idxs[0]) == 0:
        heart_rate = None
    else:
        peak_idx = np.argmax(fft_values[valid_idxs])
        peak_freq = freqs[valid_idxs][peak_idx]
        heart_rate = peak_freq * 60

    spo2 = estimate_spo2(intensity_values, fps)

    return heart_rate, spo2