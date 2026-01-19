# run da app broh
from flask import Flask, jsonify, request, g
from flask_cors import CORS
from sqlalchemy.exc import IntegrityError
from models import db, User, Ticket
from functools import wraps
from flask_migrate import Migrate
import jwt
import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import re # regex
import os


app = Flask(__name__)

app.config["SECRET_KEY"] = "dev-change-me"
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///helpdesk.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

app.config["TECH_INVITE_CODE"] = os.environ.get("TECH_INVITE_CODE", "DEV-TECH-CODE")

# hook to app
db.init_app(app)
migrate = Migrate(app, db)

CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$") # for validating email input

def require_auth(required_role=None):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            auth = request.headers.get("Authorization", "")
            if not auth.startswith("Bearer "):
                return jsonify(error="Missing Token"), 401
            
            token = auth.split(" ", 1)[1].strip()

            print("AUTH header:", repr(auth))
            print("Token extracted:", repr(token))

            try:
                payload = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
            except jwt.ExpiredSignatureError:
                return jsonify(error="Expired token"), 401
            except jwt.InvalidTokenError as e:
                print("JWT decode error:", e)
                return jsonify(error="Invalid token"), 401
            
            # store on request context
            g.user_id = int(payload.get("sub"))
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
        "sub": str(user.id),
        "username": user.username,
        "role": user.role,
        "exp": int((datetime.datetime.utcnow() + datetime.timedelta(hours=6)).timestamp())
    }
    token = jwt.encode(payload, app.config["SECRET_KEY"], algorithm="HS256")

    return jsonify(token=token, role=user.role, username=user.username)

@app.post("/api/auth/signup")
def signup():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""

    is_tech = bool(data.get("isTech"))
    tech_code = (data.get("techCode") or "").strip()

    # validation
    if len(username) < 4:
        return jsonify(error="Username too short, must be at least 4 characters"), 400
    if not EMAIL_RE.match(email):
        return jsonify(error="Please enter a valid email address"), 400
    if len(password) < 10:
        return jsonify(error="Password too short, must be at least 10 characters"), 400
    
    print("JSON received:", request.get_json())
    print("Expected tech code:", repr(app.config["TECH_INVITE_CODE"]))
    print("Received:", repr((request.get_json() or {}).get("techCode")))

    role = "user"
    if is_tech:
        if tech_code != app.config["TECH_INVITE_CODE"]:
            return jsonify(error="Invalid tech invite code."), 403
        role = "tech"

    # create user, default role will be "user"
    user = User(
        username = username,
        email=email,
        password_hash = generate_password_hash(password),
        role = role
    )

    db.session.add(user)

    # try to add the user to the database
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify(error="Username or email is already taken"), 409
    
    return jsonify(message="Account successfully created!! You may log in now")

@app.post("/api/tickets")
@require_auth("user")
def create_ticket():
    data = request.get_json(silent=True) or {}
    
    title = (data.get("title") or "").strip()
    description = (data.get("description") or "").strip()
    priority = (data.get("priority") or "Low").strip()

    if len(title) < 5:
        return jsonify(error="Title must be at least 5 characters long"), 400
    if len(description) < 10:
        return jsonify(error="Description must be at least 10 characters"), 400
    if priority not in { "Low", "Medium", "High" }:
        return jsonify(error="Ticket must have a priority level"), 400
    
    # make the ticket
    ticket = Ticket (
        title=title,
        description=description,
        priority=priority,
        status="open",
        created_by=g.user_id
    )
    db.session.add(ticket)
    db.session.commit()

    return jsonify(
        message="Ticket successfully created!",
        ticket={
            "id": ticket.id,
            "title": ticket.title,
            "priority": ticket.priority,
            "status": ticket.status
        }
    ), 201


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