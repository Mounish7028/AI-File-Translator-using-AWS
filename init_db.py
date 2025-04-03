# server/init_db.py
from server import db
from server import app

with app.app_context():
    db.create_all()
    print("Database tables created.")
