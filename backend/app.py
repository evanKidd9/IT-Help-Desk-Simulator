# run da app broh
from flask import Flask, jsonify, request, g
from flask_cors import CORS
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import aliased
from models import db, User, Ticket, TicketNote
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

# Authentication function for roles
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

# Log in for users and techs
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

    return jsonify(token=token, role=user.role, username=user.username, id=user.id)

# Sign up for users
@app.post("/api/auth/signup")
def signup():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""
    profile = (data.get("profile") or "").strip()

    is_tech = bool(data.get("isTech"))
    tech_code = (data.get("techCode") or "").strip()

    # validation
    if len(username) < 4:
        return jsonify(error="Username too short, must be at least 4 characters"), 400
    if not EMAIL_RE.match(email):
        return jsonify(error="Please enter a valid email address"), 400
    if len(password) < 10:
        return jsonify(error="Password too short, must be at least 10 characters"), 400
    if len(profile) < 15:
        return jsonify(error="Profile is too short, must be at least 15 characters"), 400
    
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
        role = role,
        profile=profile
    )

    db.session.add(user)

    # try to add the user to the database
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify(error="Username or email is already taken"), 409
    
    return jsonify(message="Account successfully created!! You may log in now")

# Account deletion
@app.delete("/api/me")
@require_auth()
def delete_account():
    data = request.get_json(silent=True) or {}
    confirm = (data.get("confirm") or "").strip()

    if confirm != "DELETE":
        return jsonify(error="Type 'DELETE' to confirm account deletion"), 400
    
    user = User.query.get(g.user_id)
    if not user:
        return jsonify(error="User not found"), 404
    
    # for tech, unassign them from all tickets
    Ticket.query.filter_by(assigned_to=user.id).update(
        {"assigned_to": None}, synchronize_session=False
    )

    # for user, delete any tickets they created
    Ticket.query.filter_by(created_by=user.id).delete(synchronize_session=False)

    # delete the user
    db.session.delete(user)
    db.session.commit()

    return jsonify(message="Account successfully deleted")

# Ticket creation for users
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
    if priority not in {"Low", "Medium", "High"}:
        return jsonify(error="Ticket must have a priority level"), 400

    ticket = Ticket(
        title=title,
        description=description,
        priority=priority,
        status="Open",
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

# Ticket viewing for individual users
@app.get("/api/tickets/mine")
@require_auth("user")
def my_tickets():
    tickets = (
        Ticket.query.filter_by(created_by=g.user_id).order_by(Ticket.id.desc()).all()
    )

    return jsonify(items=[
        {
            "id": t.id,
            "title": t.title,
            "priority": t.priority,
            "status": t.status,
            "progress": getattr(t, "progress", 0) or 0,
            "created_by": t.created_by,
            "description": t.description,
            "created_at": t.created_at.isoformat() if t.created_at else None
        }
        for t in tickets
    ]), 200

# Ticket viewing for techs
@app.get("/api/tech/tickets")
@require_auth("tech")
def tech_list_tickets():
    Creator = aliased(User)
    Assignee = aliased(User)

    rows = (
        db.session.query(Ticket, Creator.username, Assignee.username)
        .join(Creator, Ticket.created_by == Creator.id)
        .outerjoin(Assignee, Ticket.assigned_to == Assignee.id)
        .order_by(Creator.username.asc(), Ticket.id.desc()).all()
    )

    items = []
    for ticket, creator_username, assignee_username in rows:
        items.append({
            "id": ticket.id,
            "title": ticket.title,
            "description": ticket.description,
            "priority": ticket.priority,
            "status": ticket.status,
            "progress": ticket.progress,
            "created_by": ticket.created_by,
            "created_by_username": creator_username,
            "assigned_to": ticket.assigned_to,
            "assigned_to_username": assignee_username,
            "created_at": ticket.created_at.isoformat() if ticket.created_at else None
        })
    return jsonify(items=items), 200

# Techs assign themselves to tickets before editing
@app.patch("/api/tech/tickets/<int:ticket_id>/assign")
@require_auth("tech")
def tech_assign_ticket(ticket_id):
    ticket = Ticket.query.get(ticket_id)
    if not ticket:
        return jsonify(error="Ticket not found"), 404
    
    if ticket.assigned_to is not None and ticket.assigned_to != g.user_id:
        return jsonify(error="Ticket already assigned to another technician"), 404
    
    ticket.assigned_to = g.user_id
    db.session.commit()

    return jsonify(message="Ticket has been assigned to you!", ticket_id=ticket.id,
                   assigned_to=ticket.assigned_to), 200

# Editing tickets for assigned techs only
@app.patch("/api/tech/tickets/<int:ticket_id>")
@require_auth("tech")
def tech_update_ticket(ticket_id):
    ticket = Ticket.query.get(ticket_id)
    if not ticket:
        return jsonify(error="Ticket not found"), 404
    
    if ticket.assigned_to != g.user_id:
        return jsonify(error="Ticket already assigned to another technician"), 403
    
    data = request.get_json(silent=True) or {}

    if "priority" in data:
        priority = (data.get("priority") or "").strip()
        if priority not in { "Low", "Medium", "High" }:
            return jsonify(error="Priority must be Low, Medium, or High"), 400
        ticket.priority = priority

    if "progress" in data:
        try:
            progress = int(data.get("progress"))
        except (TypeError, ValueError):
            return jsonify(error="Progress must be an integer"), 400
        
        if progress < 0 or progress > 100:
            return jsonify(error="Progress must be between 0 - 100"), 400
        
        ticket.progress = progress

        if progress == 0:
            ticket.status = "Open"
        elif progress == 100:
            ticket.status = "Completed"
        else:
            ticket.status = "In Progress"

    db.session.commit()

    return jsonify(message="Ticket updated!", ticket={
        "id": ticket.id,
        "priority": ticket.priority,
        "progress": ticket.progress,
        "status": ticket.status,
        "assigned_to": ticket.assigned_to
    }), 200

@app.patch("/api/tech/tickets/<int:ticket_id>/unassign")
@require_auth("tech")
def tech_unassign_ticket(ticket_id):
    ticket = Ticket.query.get(ticket_id)
    if not ticket:
        return jsonify(error="Ticket not found"), 404
    
    if ticket.assigned_to != g.user_id:
        return jsonify(error="You already aren't assigned to this ticket"), 403
    
    ticket.assigned_to = None
    db.session.commit()

    return jsonify(message="Unassigned!", ticket_id=ticket.id,
                    assigned_to=ticket.assigned_to), 200

# Ticket Deletion (techs only)

@app.get("/api/tickets/<int:ticket_id>/notes")
@require_auth()
def get_ticket_notes(ticket_id):
    ticket = Ticket.query.get(ticket_id)
    if not ticket:
        return jsonify(error="Ticket not found"), 404
    
    # makes sure users can view their own ticket notes
    if g.role == "user" and ticket.created_by != g.user_id:
        return jsonify(error="Forbidden! Not your ticket!")
    
    Author = aliased(User)

    q = (
        db.session.query(TicketNote, Author.username, Author.role)
        .join(Author, TicketNote.author_id == Author.id)
        .filter(TicketNote.ticket_id == ticket_id)
        .order_by(TicketNote.created_at.asc(), TicketNote.id.asc())
    )

    # don't let users see internal notes
    if g.role == "user":
        q = q.filter(TicketNote.is_internal == False)

    rows = q.all()

    items = []
    for note, author_username, author_role in rows:
        items.append({
            "id": note.id,
            "ticket_id": note.ticket_id,
            "note": note.note,
            "is_internal": note.is_internal,
            "created_at": note.created_at.isoformat() if note.created_at else None,
            "author_id": note.author_id,
            "author_username": author_username,
            "author_role": author_role,
        })
    return jsonify(items=items), 200

@app.post("/api/tickets/<int:ticket_id>/notes")
@require_auth()
def add_ticket_note(ticket_id):
    ticket = Ticket.query.get(ticket_id)
    if not ticket:
        return jsonify(error="Ticket not found"), 404
    
    # makes sure users can view their own ticket notes
    if g.role == "user" and ticket.created_by != g.user_id:
        return jsonify(error="Forbidden! Not your ticket!")
    
    data = request.get_json(silent=True) or {}
    text = (data.get("note") or "").strip()

    if len(text) < 2:
        return jsonify(error="Note too short"), 400
    
    # make sure only techs can create internal notes
    is_internal = bool(data.get("is_internal")) if g.role == "tech" else False

    new_note = TicketNote(
        ticket_id=ticket_id,
        author_id=g.user_id,
        note=text,
        is_internal=is_internal
    )

    db.session.add(new_note)
    db.session.commit()

    return jsonify(note={
        "id": new_note.id,
        "ticket_id": new_note.ticket_id,
        "note": new_note.note,
        "is_internal": new_note.is_internal,
        "created_at": new_note.created_at.isoformat() if new_note.created_at else None,
        "author_id": new_note.author_id,
        "author_username": g.username,
        "author_role": g.role
    }), 201

if __name__ == "__main__":
    app.run(debug=True)