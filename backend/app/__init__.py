from flask import Flask
from flask_cors import CORS
import logging
import os

app = Flask(__name__)
CORS(app)  # Enable CORS

app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # Max upload size: 50MB

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

from app import routes