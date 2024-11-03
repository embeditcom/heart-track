from flask import Flask
from flask_cors import CORS
import logging
import os

app = Flask(__name__)
CORS(app)

app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['FINISHED_FOLDER'] = 'finished_videos'
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024
app.config['HOST'] = '172.20.10.2'
app.config['PORT'] = 5000

# Create necessary directories
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['FINISHED_FOLDER'], exist_ok=True)

from app import routes