import os

from flask import Flask
import logging

from flask import Flask, Response, flash, jsonify, redirect, render_template, request

# logging.basicConfig(level=logging.INFO)

def create_app():
    # create and configure the app
    app = Flask(__name__, instance_relative_config=True, template_folder="./templates")

    @app.route("/", methods=["GET", "POST"])
    def index():
        return render_template("index.html")

    @app.route("/upload-video", methods=["POST"])
    def upload_video_file():
        file = request.files.get("file")
        # save the file to the uploads folder
        file.save(os.path.join("video-uploads", file.filename))


    return app