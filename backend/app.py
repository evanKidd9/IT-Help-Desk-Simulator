# run da app broh
from flask import Flask, jsonify, request
from flask_cors import CORS
from models import db, User
import jwt
import datetime

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

@app.post("/api/auth/login")
def login():
    data = request.get_json(silent=True) or {}
    username = data.get("username", "").strip()
    password = data.get("password", "")
    
    if not username or not password:
        return jsonify(error="Username and Password required"), 400
    
    # demo check for now
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify(error="Incorrect username of password"), 401
    
    if user.password_hash != password:
        return jsonify(error="Incorrect username of password"), 401
    
    payload = {
        "sub": user.id,
        "username": user.username,
        "role": user.role,
        "exp": datetime.datetime.now(datetime.timezone.utc)
           + datetime.timedelta(hours=6)
    }
    token = jwt.encode(payload, app.config["SECRET_KEY"], algorithm="HS256")

    return jsonify(token=token, role=user.role, username=user.username)

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        if not User.query.filter_by(username="tech1").first():
            db.session.add(User(username="tech1", password_hash="password123", role="tech"))
        if not User.query.filter_by(username="user1").first():
            db.session.add(User(username="user1", password_hash="password123", role="user"))
        db.session.commit()
    app.run(debug=True)