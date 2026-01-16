# tables for the simulator

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(10), nullable=False)

class Ticket(db.Model):
    __tablename__ = "tickets"
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    priority = db.Column(db.String(10), nullable=False)
    status = db.Column(db.String(20), default="Open")

    created_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    created_at = db.Column(db.DateTime, server_default=db.func.now())

class TicketNote(db.Model):
    __tablename__ = "ticketnote"
    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey("tickets.id"))
    author_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    note = db.Column(db.Text, nullable=False)
    is_internal = db.Column(db.Boolean, default=False)