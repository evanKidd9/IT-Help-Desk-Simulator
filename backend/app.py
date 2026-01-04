# run da app broh
from flask import Flask, jsonify
from flask_cors import CORS
from models import db

app = Flask(__name__)

app.config["SECRET_KEY"] = "dev-change-me"
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///helpdesk.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# hook to app
db.init_app(app)

CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

@app.get("/api/health")
def health():
    return jsonify(status="ok")

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)