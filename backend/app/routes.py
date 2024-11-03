from flask import request, jsonify
from app import app
from app.video_processing import process_video
from app.audio_processing import process_audio_from_video
import os
import json
import matplotlib

from app.plots_processing import bandpass_filter, compute_dominant_frequency, process_video_cleaning
matplotlib.use('Agg')  # Add this line before importing pyplot
import matplotlib.pyplot as plt
import datetime
import base64
import numpy as np
import cv2
from scipy import signal


@app.route('/upload/<video_id>', methods=['POST'])
def upload_file(video_id):
    print('upload_file', video_id)
    video = request.files.get('video')
    if not video:
        return jsonify({'error': 'Video file is required.'}), 400

    id_folder = os.path.join(app.config['UPLOAD_FOLDER'], str(video_id))
    os.makedirs(id_folder, exist_ok=True)
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    video_filename = f"{timestamp}_{video_id}_{video.filename}"
    video_folder = id_folder
    os.makedirs(video_folder, exist_ok=True)

    video_path = os.path.join(video_folder, video_filename)
    video.save(video_path)

    
    cap = cv2.VideoCapture(video_path)
    ret, frame = cap.read()
    cap.release()
    
    if not ret:
        os.remove(video_path)
        return jsonify({
            'error': 'Could not read video file',
            'valid': False
        }), 400

    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    
    lower_red1 = np.array([0, 120, 70])
    upper_red1 = np.array([10, 255, 255])
    lower_red2 = np.array([170, 120, 70])
    upper_red2 = np.array([180, 255, 255])
    
    mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
    mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
    red_mask = mask1 + mask2
    
    red_pixel_percentage = (np.sum(red_mask > 0) / (red_mask.shape[0] * red_mask.shape[1])) * 100

    if red_pixel_percentage < 30:
        os.remove(video_path)
        return jsonify({
            'valid': False
        })

    heart_rate_video, heart_rate_video_2, heart_rate_video_3, spo2 = process_video(video_path)
    heart_rate_audio = process_audio_from_video(video_path)

    results = {
        'heart_rate_video': heart_rate_video,
        'heart_rate_video_2': heart_rate_video_2,
        'heart_rate_video_3': heart_rate_video_3,
        'heart_rate_audio': heart_rate_audio,
        'spo2': spo2,
        'timestamp': timestamp,
        'video_name': video_filename,
        'video_id': video_id,
        'valid': True
    }

    return jsonify(results)

@app.route('/finish_processing/<video_id>', methods=['POST'])
def finish_processing(video_id):
    print('finish_processing', video_id)
    id_folder = os.path.join(app.config['UPLOAD_FOLDER'], str(video_id))
    video_files = []
    
    print('folder id', id_folder)
    for file in os.listdir(id_folder):
        if any(file.lower().endswith(ext) for ext in ['.mp4', '.mov', '.avi', '.mkv']):
            video_files.append(os.path.join(id_folder, file))
    
    if not video_files:
        return jsonify({'error': 'No video files found'}), 400
        
    video_files.sort(key=lambda x: os.path.getctime(x))
    
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    merged_filename = f"{timestamp}_{video_id}_merged.mp4"
    merged_path = os.path.join(id_folder, merged_filename)
    
    if len(video_files) > 1:
        merged_video = None
        for video_path in video_files:
            cap = cv2.VideoCapture(video_path)
            if merged_video is None:
                fps = int(cap.get(cv2.CAP_PROP_FPS))
                frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                merged_video = cv2.VideoWriter(merged_path, cv2.VideoWriter_fourcc(*'mp4v'), 
                                         fps, (frame_width, frame_height))
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                merged_video.write(frame)
            cap.release()
            os.remove(video_path)

        if merged_video:
            merged_video.release()
            video_path = merged_path
    else:
        video_path = video_files[0]
    
    # Process video for heart rate measurements
    heart_rate_video, heart_rate_video_2, heart_rate_video_3, spo2 = process_video(video_path)
    heart_rate_audio = process_audio_from_video(video_path)
    
    # Generate signal analysis plot using process_video_cleaning
    s = process_video_cleaning(video_path)
    s_light_filter = bandpass_filter(s)
    freq = compute_dominant_frequency(s_light_filter)
    s_hard_filter = bandpass_filter(s, (freq-20)/60, (freq+20)/60)
    peaks = signal.find_peaks(s_hard_filter, distance=10)[0]
    
    # Create signal analysis plot
    fig, ax1 = plt.subplots(figsize=(14, 6))
    ax1.plot(s-s.mean(), 'blue', label='original (shifted)')
    ax1.plot(s_light_filter, 'orange', label='light filtered')
    ax1.plot(s_hard_filter, 'grey', label='hard filtered')
    ax1.plot(peaks, (s-s.mean())[peaks], 'ro', label='Peaks from hard filter')
    ax1.legend()
    ax1.set_title('Signal Analysis')
    
    signal_plot_path = os.path.join(id_folder, 'signal_analysis.png')
    plt.savefig(signal_plot_path, bbox_inches='tight')
    plt.close()
    
    # Create methods comparison plot
    plt.figure(figsize=(12, 6))
    methods = ['Video FFT', 'Video Bandpass', 'Video Peaks', 'Audio']
    heart_rates = [heart_rate_video, heart_rate_video_2, heart_rate_video_3, heart_rate_audio]
    
    plt.bar(methods, heart_rates)
    plt.title('Heart Rate Measurements Comparison')
    plt.ylabel('BPM')
    plt.xticks(rotation=45)
    
    comparison_plot_path = os.path.join(id_folder, 'heart_rate_comparison.png')
    plt.savefig(comparison_plot_path, bbox_inches='tight')
    plt.close()
    
    results = {
        'heart_rate_video': heart_rate_video,
        'heart_rate_video_2': heart_rate_video_2,
        'heart_rate_video_3': heart_rate_video_3,
        'heart_rate_audio': heart_rate_audio,
        'spo2': spo2,
        'timestamp': timestamp,
        'video_name': os.path.basename(video_path),
        'video_id': video_id,
        'valid': True
    }
    
    json_path = os.path.join(id_folder, 'results.json')
    with open(json_path, 'w') as f:
        json.dump(results, f, indent=4)
    
    return jsonify(results)


@app.route('/get_videos', methods=['GET'])
def get_videos():
    upload_folder = app.config['UPLOAD_FOLDER']
    video_files = []
    
    try:
        for dirname in os.listdir(upload_folder):
            dir_path = os.path.join(upload_folder, dirname)
            print(dirname)
            if os.path.isdir(dir_path):
                video_info = {}
                
                for file in os.listdir(dir_path):
                    file_path = os.path.join(dir_path, file)
                    if os.path.isfile(file_path):
                        if any(file.lower().endswith(ext) for ext in ['.mp4', '.mov', '.avi', '.mkv']):
                            stats = os.stat(file_path)
                            video_info.update({
                                'name': file,
                                'size': stats.st_size,
                                'created': stats.st_ctime,
                                'modified': stats.st_mtime,
                                'folder': dirname
                            })
                        
                        elif file == 'results.json':
                            with open(file_path, 'r') as f:
                                video_info['results'] = json.load(f)
                        

                        elif file == 'signal_analysis.png':
                            with open(file_path, 'rb') as f:
                                figure_bytes = f.read()
                                video_info['figure'] = base64.b64encode(figure_bytes).decode('utf-8')

                        print(video_info)
                
                if video_info: 
                    video_files.append(video_info)
                
        video_files.sort(key=lambda x: x['modified'], reverse=True)
        print(video_files)
        
        return jsonify({
            'videos': video_files,
            'success': True
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False,
            'videos': []
        }), 500