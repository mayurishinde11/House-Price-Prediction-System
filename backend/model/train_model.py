"""
train_model.py
---------------
Loads house_data.csv, preprocesses it, trains a regression model to
predict price_inr, evaluates it, and saves the trained pipeline
(preprocessing + model bundled together) plus metadata for the API.

Run:
    python train_model.py

Outputs (in ../model/):
    house_price_model.pkl   - trained sklearn Pipeline (preprocess + model)
    locations.json          - state -> city -> [localities] map for the UI
    metrics.json            - evaluation metrics for the README / report
"""

import json
import os

import numpy as np
import pandas as pd
import joblib

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "house_data.csv")
MODEL_DIR = os.path.join(os.path.dirname(__file__))
os.makedirs(MODEL_DIR, exist_ok=True)

# ---------------------------------------------------------------------
# 1. Load data
# ---------------------------------------------------------------------
df = pd.read_csv(DATA_PATH)
print(f"Loaded {len(df)} rows")

# ---------------------------------------------------------------------
# 2. Basic cleaning (defensive, mirrors real-world pipeline)
# ---------------------------------------------------------------------
df = df.dropna()
df = df.drop_duplicates()
df = df[(df["area_sqft"] > 0) & (df["price_inr"] > 0)]

# Remove extreme outliers using IQR on price
q1, q3 = df["price_inr"].quantile([0.01, 0.99])
df = df[(df["price_inr"] >= q1) & (df["price_inr"] <= q3)]

# ---------------------------------------------------------------------
# 3. Feature engineering
# ---------------------------------------------------------------------
df["price_per_sqft"] = df["price_inr"] / df["area_sqft"]  # not used as input, sanity only

CATEGORICAL_FEATURES = ["state", "city", "locality", "property_type", "furnishing"]
NUMERIC_FEATURES = [
    "area_sqft", "bedrooms", "bathrooms", "parking",
    "property_age_years", "floor_no", "total_floors",
]
TARGET = "price_inr"

X = df[CATEGORICAL_FEATURES + NUMERIC_FEATURES]
y = df[TARGET]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# ---------------------------------------------------------------------
# 4. Preprocessing pipeline
# ---------------------------------------------------------------------
preprocessor = ColumnTransformer(
    transformers=[
        ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
        ("num", StandardScaler(), NUMERIC_FEATURES),
    ]
)

# ---------------------------------------------------------------------
# 5. Try multiple models, keep the best by test R^2
# ---------------------------------------------------------------------
candidates = {
    "LinearRegression": LinearRegression(),
    "RandomForest": RandomForestRegressor(
        n_estimators=200, max_depth=14, random_state=42, n_jobs=-1
    ),
    "GradientBoosting": GradientBoostingRegressor(
        n_estimators=200, max_depth=4, learning_rate=0.08, random_state=42
    ),
}

results = {}
best_name, best_pipeline, best_r2 = None, None, -np.inf

for name, model in candidates.items():
    pipe = Pipeline(steps=[("preprocessor", preprocessor), ("model", model)])
    pipe.fit(X_train, y_train)
    preds = pipe.predict(X_test)

    mae = mean_absolute_error(y_test, preds)
    rmse = np.sqrt(mean_squared_error(y_test, preds))
    r2 = r2_score(y_test, preds)

    results[name] = {"MAE": round(mae, 2), "RMSE": round(rmse, 2), "R2": round(r2, 4)}
    print(f"{name}: MAE={mae:,.0f}  RMSE={rmse:,.0f}  R2={r2:.4f}")

    if r2 > best_r2:
        best_name, best_pipeline, best_r2 = name, pipe, r2

print(f"\nBest model: {best_name} (R2={best_r2:.4f})")

# ---------------------------------------------------------------------
# 6. Save trained pipeline + metadata
# ---------------------------------------------------------------------
model_path = os.path.join(MODEL_DIR, "house_price_model.pkl")
joblib.dump(best_pipeline, model_path)
print(f"Saved model to {model_path}")

# Location map for populating State -> City -> Locality dropdowns in UI
location_map = {}
for state in sorted(df["state"].unique()):
    location_map[state] = {}
    for city in sorted(df.loc[df["state"] == state, "city"].unique()):
        localities = sorted(
            df.loc[(df["state"] == state) & (df["city"] == city), "locality"].unique()
        )
        location_map[state][city] = localities

with open(os.path.join(MODEL_DIR, "locations.json"), "w") as f:
    json.dump(location_map, f, indent=2)

with open(os.path.join(MODEL_DIR, "metrics.json"), "w") as f:
    json.dump({"best_model": best_name, "results": results}, f, indent=2)

print("Saved locations.json and metrics.json")