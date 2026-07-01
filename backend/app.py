"""
app.py
------
Flask backend for EstateIQ - House Price Prediction System.

Responsibilities:
 1. Serve the frontend (templates/static).
 2. Provide /api/locations to populate State -> City -> Locality dropdowns.
 3. Provide /api/predict to run the trained ML pipeline on submitted
    property details and return an estimated price.
 4. Minimal session-based auth (/api/signup, /api/login, /api/logout,
    /api/me) using a local SQLite users table.

Run:
    python app.py
    -> http://127.0.0.1:5000
"""

import json
import os
import sqlite3
from functools import wraps

import joblib
import pandas as pd
from flask import Flask, jsonify, render_template, request, session
from werkzeug.security import check_password_hash, generate_password_hash

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model", "house_price_model.pkl")
LOCATIONS_PATH = os.path.join(BASE_DIR, "model", "locations.json")
METRICS_PATH = os.path.join(BASE_DIR, "model", "metrics.json")
DB_PATH = os.path.join(BASE_DIR, "data", "users.db")

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-change-me")

# ---------------------------------------------------------------------
# Load model + locations + metrics once at startup
# ---------------------------------------------------------------------
model = joblib.load(MODEL_PATH)

with open(LOCATIONS_PATH) as f:
    LOCATIONS = json.load(f)

with open(METRICS_PATH) as f:
    METRICS = json.load(f)


# ---------------------------------------------------------------------
# Tiny SQLite user store
# ---------------------------------------------------------------------
def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()


init_db()


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if "user_email" not in session:
            return jsonify({"error": "Not authenticated"}), 401
        return fn(*args, **kwargs)
    return wrapper


# ---------------------------------------------------------------------
# Frontend page routes
# ---------------------------------------------------------------------
@app.route("/")
def home():
    return render_template("index.html", active="home")


@app.route("/predict")
def predict_page():
    return render_template("predict.html", active="predict")


@app.route("/budget")
def budget_page():
    return render_template("budget.html", active="budget")


@app.route("/dashboard")
def dashboard_page():
    return render_template("dashboard.html", active="dashboard")


@app.route("/login")
def login_page():
    return render_template("login.html", active="login")


@app.route("/signup")
def signup_page():
    return render_template("signup.html", active="signup")


# ---------------------------------------------------------------------
# Auth API
# ---------------------------------------------------------------------
@app.route("/api/signup", methods=["POST"])
def api_signup():
    data = request.get_json(force=True)
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute(
            "INSERT INTO users (email, password_hash) VALUES (?, ?)",
            (email, generate_password_hash(password)),
        )
        conn.commit()
    except sqlite3.IntegrityError:
        return jsonify({"error": "An account with this email already exists"}), 409
    finally:
        conn.close()

    session["user_email"] = email
    return jsonify({"email": email})


@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.get_json(force=True)
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    conn = sqlite3.connect(DB_PATH)
    row = conn.execute(
        "SELECT password_hash FROM users WHERE email = ?", (email,)
    ).fetchone()
    conn.close()

    if not row or not check_password_hash(row[0], password):
        return jsonify({"error": "Invalid email or password"}), 401

    session["user_email"] = email
    return jsonify({"email": email})


@app.route("/api/logout", methods=["POST"])
def api_logout():
    session.pop("user_email", None)
    return jsonify({"ok": True})


@app.route("/api/me")
def api_me():
    if "user_email" in session:
        return jsonify({"email": session["user_email"]})
    return jsonify({"email": None})


# ---------------------------------------------------------------------
# Locations API - powers the State / City / Locality dropdowns
# ---------------------------------------------------------------------
@app.route("/api/locations")
def api_locations():
    return jsonify(LOCATIONS)


@app.route("/api/metrics")
def api_metrics():
    return jsonify(METRICS)


# ---------------------------------------------------------------------
# Prediction API
# ---------------------------------------------------------------------
DEFAULTS = {
    "property_age_years": 5,
    "floor_no": 2,
    "total_floors": 10,
    "property_type": "Apartment",
    "furnishing": "Unfurnished",
    "parking": 1,
}


@app.route("/api/predict", methods=["POST"])
def api_predict():
    data = request.get_json(force=True)

    missing = [f for f in ["state", "city", "locality", "area_sqft",
                            "bedrooms", "bathrooms"] if data.get(f) in (None, "")]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    payload = {**DEFAULTS, **data}

    try:
        row = {
            "state": payload["state"],
            "city": payload["city"],
            "locality": payload["locality"],
            "area_sqft": float(payload["area_sqft"]),
            "bedrooms": int(payload["bedrooms"]),
            "bathrooms": int(payload["bathrooms"]),
            "parking": int(payload["parking"]),
            "property_age_years": int(payload["property_age_years"]),
            "property_type": payload["property_type"],
            "furnishing": payload["furnishing"],
            "floor_no": int(payload["floor_no"]),
            "total_floors": int(payload["total_floors"]),
        }
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid numeric value supplied"}), 400

    X = pd.DataFrame([row])
    prediction = model.predict(X)[0]
    prediction = max(float(prediction), 0)

    low = prediction * 0.92
    high = prediction * 1.08

    return jsonify({
        "predicted_price": round(prediction, -3),
        "price_range": {
            "low": round(low, -3),
            "high": round(high, -3),
        },
        "price_per_sqft": round(prediction / row["area_sqft"], 2),
        "input": row,
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)