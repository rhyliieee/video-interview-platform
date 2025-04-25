from flask import Blueprint, request, jsonify, current_app
from app.utils import generate_unique_link, CacheManager
from app.services import upload_to_drive
import io
import datetime

bp = Blueprint('api', __name__, url_prefix='/api')

cache_manager = CacheManager()

@bp.route('/interviews', methods=['POST'])
def create_interview():
    data = request.get_json()

    if not data or 'questions' not in data or not isinstance(data['questions'], list):
        return jsonify({"error": "Invalid input. 'questions' array is required."}), 400
    
    questions = data['questions']
    link_id = generate_unique_link()

    # STORE INTERVIEW DATA TO CACHE MANAGER
    interview_data = {
        "questions": questions,
        "created_at": datetime.datetime.now()
    }

    cache_manager.set(link_id, interview_data)

    # In a real app, save to a database here
    print(f"Interview created: {link_id}, Questions: {questions}") # Log for debug

    return jsonify({"unique_link": link_id}), 201

@bp.route('/interviews/<link_id>', methods=['GET'])
def get_interview(link_id):
    # GET LINK FROM THE CACHE MANAGER
    interview = cache_manager.get(link_id)
    if not interview:
        return jsonify({"error": "Interview not found"}), 404

    # Return only necessary data (questions)
    return jsonify({"questions": interview["questions"]})

@bp.route('/upload/<link_id>', methods=['POST'])
def upload_recording(link_id):
    if not cache_manager.has(link_id):
        return jsonify({"error": "Invalid interview link"}), 404
    
    if 'video' not in request.files:
        return jsonify({"error": "No video file part"}), 400
    
    file = request.files.get('video', '')
    question_index = request.form.get('questionIndex', 'unknown')

    if file.filename == '':
        folder_id = current_app.config['GDRIVE_FOLDER_ID']
        if not folder_id:
            return jsonify({"error": "Google Drive Folder ID not Configured"}), 500
        
        # SANTIZE FILENAME OR CREATE A STRUCTURED ONE
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"interview_{link_id}_q{question_index}_{timestamp}.webm"

        # READ FILE INTO MEMORY FOR UPLOAD STREAM
        file_stream = io.BytesIO(file.read())
        file_stream.seek(0)

        file_id = upload_to_drive(file_stream, filename, folder_id, file.mimetype)

        if file_id:
            return jsonify({"message": "Upload successful", "fileId": file_id}), 200
        else:
            return jsonify({"error": "Failed to upload to Google Drive"}), 500
        
    return jsonify({"error": "Error processing file"}), 500