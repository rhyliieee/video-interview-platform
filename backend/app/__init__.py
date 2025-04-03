from flask import Flask
from flask_cors import CORS
from .config import Config

# Using a simple in-memory store for prototype purposes
# For production, replace with a database (e.g., using Flask-SQLAlchemy)
interviews_db = {}

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for requests from the React frontend
    CORS(app, resources={r"/api/*": {"origins": "*"}}) # Adjust origin for production

    from . import routes
    app.register_blueprint(routes.bp)

    return app