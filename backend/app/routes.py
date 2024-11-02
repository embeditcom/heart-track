from flask import request, jsonify
from app import app
from app.video_processing import process_video
from app.audio_processing import process_audio_from_video
import os

@app.route('/upload', methods=['POST'])
def upload_file():
    video = request.files.get('video')

    if not video:
        return jsonify({'error': 'Video file is required.'}), 400

    video_path = os.path.join(app.config['UPLOAD_FOLDER'], video.filename)
    video.save(video_path)

    import cv2
    import numpy as np
    
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

    print("Heart rate video:", heart_rate_video)
    print("Heart rate video 2:", heart_rate_video_2)
    print("Heart rate video 3:", heart_rate_video_3)
    print("Heart rate audio:", heart_rate_audio)
    print("SpO2:", spo2)

    os.remove(video_path)

    return jsonify({
        'heart_rate_video': heart_rate_video,
        'heart_rate_video_2': heart_rate_video_2,
        'heart_rate_video_3': heart_rate_video_3,
        'heart_rate_audio': heart_rate_audio,
        'spo2': spo2,
        'valid': True
    })


@app.route('/finish_processing', methods=['POST'])
def finish_processing():
    video = request.files.get('video')
    return jsonify({'message': 'Video received.'})