from flask import request, jsonify
from app import app
from app.video_processing import process_video
from app.audio_processing import process_audio_from_video
import os

@app.route('/upload', methods=['POST'])
def upload_file():
    video = request.files.get('video')

    print("Video received:", video)

    if not video:
        return jsonify({'error': 'Video file is required.'}), 400

    video_path = os.path.join(app.config['UPLOAD_FOLDER'], video.filename)

    print("Saving video to:", video_path)
    video.save(video_path)

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