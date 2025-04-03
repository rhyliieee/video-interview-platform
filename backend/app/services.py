import os
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
import io
from .config import Config

SCOPES = ['https://www.googleapis.com/auth/drive.file']

def get_gdrive_service():
    try:
        creds = service_account.Credentials.from_service_account_file(
            Config.GOOGLE_CREDENTIALS_PATH, scopes=SCOPES)
        service = build('drive', 'v3', credentials=creds)
        return service
    except Exception as e:
        print(f"Error creating Google Drive service: {e}")
        return None

def upload_to_drive(file_stream, filename, folder_id, mime_type='video/webm'):
    service = get_gdrive_service()
    if not service:
        return None

    file_metadata = {
        'name': filename,
        'parents': [folder_id]
    }
    try:
        media = MediaIoBaseUpload(file_stream, mimetype=mime_type, resumable=True)
        file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id'
        ).execute()
        print(f"File ID: {file.get('id')} uploaded successfully to folder {folder_id}.")
        return file.get('id')
    except Exception as e:
        print(f"An error occurred during upload: {e}")
        return None