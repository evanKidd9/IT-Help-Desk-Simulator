# run da app broh
from flask import Flask, jsonify, request, g
from flask_cors import CORS
from models import db, User
from functools import wraps
import jwt
import datetime
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)

app.config["SECRET_KEY"] = "dev-change-me"
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///helpdesk.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# hook to app
db.init_app(app)

CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

def require_auth(required_role=None):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            auth = request.headers.get("Authorization", "")
            if not auth.startswith("Bearer "):
                return jsonify(error="Missing Token"), 401
            
            token = auth.split(" ", 1)[1].strip()
            try:
                payload = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
            except jwt.ExpiredSignatureError:
                return jsonify(error="Expired token"), 401
            except jwt.InvalidTokenError:
                return jsonify(error="Invalid token"), 401
            
            # store on request context
            g.user_id = payload.get("sub")
            g.username = payload.get("username")
            g.role = payload.get("role")

            if required_role and g.role != required_role:
                return jsonify(error="Forbidden"), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator

@app.get("/api/me")
@require_auth()
def me():
    return jsonify(id=g.user_id, username=g.username, role=g.role)

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
    
    if not check_password_hash(user.password_hash, password):
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
            db.session.add(User(
            username="tech1",
            password_hash=generate_password_hash("password123"),
            role="tech"
        ))
        if not User.query.filter_by(username="user1").first():
            db.session.add(User(
            username="user1",
            password_hash=generate_password_hash("password123"),
            role="user"
        ))
        db.session.commit()
    app.run(debug="True")