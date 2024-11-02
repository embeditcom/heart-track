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

    heart_rate_video, spo2 = process_video(video_path)
    heart_rate_audio = process_audio_from_video(video_path)

    os.remove(video_path)

    return jsonify({
        'heart_rate_video': heart_rate_video,
        'heart_rate_audio': heart_rate_audio,
        'spo2': spo2,
        'valid': True
    })


@app.route('/process_video', methods=['POST'])
def process_video():
    video = request.files.get('video')
    return jsonify({'message': 'Video received.'})