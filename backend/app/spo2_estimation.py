import numpy as np
from scipy import signal

def estimate_spo2(intensity_values, fps):
    """
    Estimate SpO2 levels from intensity values of finger recording.
    
    Args:
        intensity_values: List of intensity values from the video
        fps: Frames per second of the recording
    
    Returns:
        float: Estimated SpO2 percentage or -1 if calculation is not possible
    """
    
    if intensity_values is None or len(intensity_values) < fps:  # Check if we have enough data
        return -1
    
    try:
        intensities = np.array(intensity_values)
        
        detrended = signal.detrend(intensities)
        
        peaks, _ = signal.find_peaks(detrended)
        troughs, _ = signal.find_peaks(-detrended)
        
        if len(peaks) < 2 or len(troughs) < 2:
            return -1
        
        ac_component = np.mean(detrended[peaks]) - np.mean(detrended[troughs])
        dc_component = np.mean(intensities)
        
        if dc_component == 0:
            return -1
        
        r_value = (ac_component / dc_component)
        
        # Empirical formula for SpO2 estimation
        # SpO2 = 110 - 25 * R (simplified empirical formula)
        spo2 = 110 - (25 * r_value)
        
        
        return float(spo2)
        
    except Exception as e:
        print(f"Error calculating SpO2: {str(e)}")
        return -1