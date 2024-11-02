from scipy import signal
import numpy as np
import cv2
import matplotlib.pyplot as plt


def bandpass_filter(s, low=None, high=None, fps=30):
    
    low_cutoff = 0.7 if not low else low # Low cutoff frequency in Hz
    high_cutoff = 3. if not high else high # High cutoff frequency in Hz
    nyquist = 0.5 * fps
    low = low_cutoff / nyquist
    high = high_cutoff / nyquist
    b, a = signal.butter(1, [low, high], btype='band')
    s = signal.filtfilt(b, a, s)

    return s



def compute_dominant_frequency(s, fps=30):    
    fft_result = np.fft.fft(s)
    n = len(s)  # Number of samples
    
    # 2. Create frequency bins
    freqs = np.fft.fftfreq(n, 1/fps)  # Frequency array in Hz
    
    # 3. Compute the magnitude spectrum and use only the positive half
    magnitude = np.abs(fft_result)[:n // 2]
    positive_freqs = freqs[:n // 2]


    max_index = np.argmax(magnitude)
    dominant_frequency = positive_freqs[max_index]

    return dominant_frequency*60

def process_video_cleaning(path):
    
    # Open the video file
    cap = cv2.VideoCapture(path)
    
    # Check if the video was opened successfully
    if not cap.isOpened():
        print("Error: Could not open video.")
        exit()
    
    frame_count = 0
    
    s = []
    
    while True:
        ret, frame = cap.read()  # Read a frame
        if not ret:
            break  # Exit loop when the video ends
    
        # Convert the frame to RGB format
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    
        # Extract the red channel (3rd channel in RGB)
        red_channel = frame_rgb[:, :, 0]
    
        # Compute the mean red intensity
        mean_red_intensity = np.mean(red_channel)
        s.append(mean_red_intensity)
        
        frame_count += 1
    
    # Release the video capture object
    cap.release()

    return np.array(s)
