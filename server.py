from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from datetime import datetime, timedelta, time as time_obj
import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*", "methods": ["GET", "POST", "PUT"], "allow_headers": ["Origin", "X-Requested-With", "Content-Type", "Accept"]}})

DB_FILE = 'db.json'

# Ensure the db.json file exists
if not os.path.exists(DB_FILE):
    with open(DB_FILE, 'w') as f:
        json.dump({'users': {}, 'translations': {}}, f)

# Function to load the database
def load_db():
    with open(DB_FILE, 'r') as f:
        return json.load(f)

# Function to save the database
def save_db(db):
    with open(DB_FILE, 'w') as f:
        json.dump(db, f, indent=4, cls=DateTimeEncoder)

class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime, time_obj)):
            return obj.isoformat()
        return super().default(obj)

def as_datetime(dct):
    for key, value in dct.items():
        try:
            dct[key] = datetime.fromisoformat(value)
        except (TypeError, ValueError):
            pass
    return dct

@app.route('/')
def home():
    return "Welcome to the Flask CRUD API!"

# Signup POST
@app.route('/signup', methods=['POST'])
def signup_post():
    data = request.get_json()
    if not data or not all(
            k in data for k in ("id", "name", "email", "contactNumber", "country", "gender", "username", "password")):
        return jsonify({'message': 'Invalid data'}), 400

    db = load_db()
    if data['id'] in db['users']:
        return jsonify({'message': 'User already exists'}), 400

    db['users'][data['id']] = data
    save_db(db)
    return jsonify({'message': 'User created', 'user': data}), 201

# Signup GET
@app.route('/signup/<user_id>', methods=['GET'])
def signup_get(user_id):
    db = load_db()
    user = db['users'].get(user_id)
    if user is None:
        return jsonify({'message': 'User not found'}), 404
    return jsonify(user), 200

# Login POST
@app.route('/login', methods=['POST'])
def login_post():
    data = request.get_json()
    if not data or 'username' not in data or 'password' not in data:
        return jsonify({'message': 'Invalid data'}), 400

    db = load_db()
    user = next((u for u in db['users'].values() if u['username'] == data['username'] and u['password'] == data['password']), None)
    if user:
        return jsonify({'message': 'Login successful', 'user': user}), 200
    return jsonify({'message': 'Invalid credentials'}), 401

# Login GET
@app.route('/login/<username>', methods=['GET'])
def login_get(username):
    db = load_db()
    user = next((u for u in db['users'].values() if u['username'] == username), None)
    if user is None:
        return jsonify({'message': 'User not found'}), 404
    return jsonify(user), 200

# Upload file (dummy implementation, extend as needed)
@app.route('/upload', methods=['POST'])
def upload_file():
    file = request.files['file']
    # Process the file as needed
    return jsonify({"status": "success", "filename": file.filename}), 201

# Add translation history
@app.route('/history', methods=['POST'])
def create_translation():
    data = request.get_json()
    if not data or not all(
            k in data for k in ("translationId", "userId", "filename", "words", "targetLanguage", "date", "time")):
        return jsonify({'message': 'Invalid data'}), 400

    db = load_db()
    if data['translationId'] in db['translations']:
        return jsonify({'message': 'Translation already exists'}), 400

    date = datetime.strptime(data['date'], '%Y-%m-%d').date()
    time = datetime.strptime(data['time'], '%H:%M:%S').time()
    data['date'] = date.isoformat()
    data['time'] = time.isoformat()

    db['translations'][data['translationId']] = data
    save_db(db)
    return jsonify({'message': 'Translation added', 'translation': data}), 201
@app.route('/history/user/<user_id>', methods=['GET'])
def fetch_user_translation_history(user_id):
    db = load_db()
    user_translations = [trans for trans in db['translations'].values() if trans['userId'] == user_id]
    return jsonify(user_translations), 200

# Fetch a specific translation history
@app.route('/history/<translation_id>', methods=['GET'])
def fetch_translation_history(translation_id):
    db = load_db()
    translation = db['translations'].get(translation_id)
    if translation is None:
        return jsonify({'message': 'Translation history not found'}), 404

    time_value = translation['time']
    if isinstance(time_value, timedelta):
        total_seconds = time_value.total_seconds()
        hours, remainder = divmod(total_seconds, 3600)
        minutes, seconds = divmod(remainder, 60)
        time_value = time_obj(int(hours), int(minutes), int(seconds))

    translation_data = {
        'translationId': translation['translationId'],
        'userId': translation['userId'],
        'filename': translation['filename'],
        'words': translation['words'],
        'targetLanguage': translation['targetLanguage'],
        'date': translation['date'],
        'time': time_value if isinstance(time_value, str) else time_value.strftime('%H:%M:%S')
    }
    return jsonify(translation_data), 200

if __name__ == '__main__':
    app.run(debug=True, port=8080)
