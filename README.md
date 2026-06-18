# EstateIQ — House Price Prediction System

AI-powered house price prediction and budget-planning web app for Indian
real estate, built with **Python, Pandas, NumPy, Scikit-learn, Flask, HTML,
CSS, and JavaScript**.

Pick a State → City → Locality and enter property details (area, bedrooms,
bathrooms, parking, type, furnishing, age) on the **Predict** page, and a
trained regression model returns an instant price estimate with a
confidence range — served live from Flask.

---

## Project structure

House-Price-Prediction-System/

│

├── backend/

│   ├── app.py                     # Flask app: pages + JSON API (locations, predict, auth, metrics)

│   ├── requirements.txt           # Python dependencies

│   ├── venv/                      # Virtual environment (not committed — see Setup below)

│   │

│   ├── data/

│   │   ├── generate_dataset.py    # Builds the synthetic India housing dataset

│   │   ├── data_cleaning.py       # Standalone cleaning/EDA script

│   │   ├── house_data.csv         # Generated dataset (15,000 rows, all India states/UTs)

│   │   └── users.db               # SQLite user store (created at runtime, not committed)

│   │

│   ├── model/

│   │   ├── train_model.py         # Preprocessing + trains/evaluates 3 regressors, saves the best

│   │   ├── house_price_model.pkl  # Trained sklearn Pipeline (preprocessing + model bundled)

│   │   ├── locations.json         # State -> City -> [Localities] map (powers UI dropdowns)

│   │   └── metrics.json           # MAE / RMSE / R² per model (powers Dashboard page)

│   │

│   ├── templates/                 # Jinja2 HTML templates (server-rendered pages)

│   │   ├── index.html             # Landing page

│   │   ├── predict.html           # Price predictor

│   │   ├── budget.html            # EMI / budget planner

│   │   ├── dashboard.html         # Model performance dashboard

│   │   ├── login.html

│   │   ├── signup.html

│   │   └── partials/

│   │       ├── navbar.html

│   │       ├── footer.html

│   │       └── favicon.html

│   │

│   └── static/

│       ├── css/

│       │   ├── style.css          # Design system: colors, type, buttons, cards, nav, footer

│       │   └── predict.css        # Predict-page layout (form + showcase panel)

│       └── js/

│           ├── auth.js            # Renders navbar login/signout state from session

│           ├── predict.js         # State/City/Locality cascade + calls /api/predict

│           ├── budget.js          # Client-side EMI calculator

│           └── dashboard.js       # Fetches /api/metrics and renders model stats

│

├── .gitignore

└── README.md


---

## How it works (ML workflow)

1. **Data collection** — `generate_dataset.py` builds a realistic synthetic
   dataset covering **all 28 states and 8 union territories of India**
   (36 total), with 51 cities and 149 localities, each with its own base
   price-per-sqft, combined with property features through a price
   formula plus market noise — giving the data real, learnable structure.

2. **Data cleaning** — `data_cleaning.py` demonstrates removing
   duplicates, dropping missing critical fields, filtering invalid
   values, and clipping outliers via the IQR method.

3. **Preprocessing & feature selection** — categorical columns
   (`state`, `city`, `locality`, `property_type`, `furnishing`) are
   one-hot encoded; numeric columns (`area_sqft`, `bedrooms`, `bathrooms`,
   `parking`, `property_age_years`, `floor_no`, `total_floors`) are
   standardized — all inside a single `sklearn.Pipeline`.

4. **Model training** — `train_model.py` trains and compares three
   regressors: Linear Regression, Random Forest, and Gradient Boosting.
   The best model by test R² is saved automatically.

   | Model              | MAE (₹)    | RMSE (₹)   | R²     |
   |--------------------|-----------:|-----------:|-------:|
   | Linear Regression  | 14,86,597  | 22,56,097  | 0.881  |
   | Random Forest      | 19,69,831  | 27,68,911  | 0.821  |
   | **Gradient Boosting** | **13,53,644** | **19,45,650** | **0.912** |

5. **Serving predictions** — Flask loads the saved pipeline once at
   startup. `/api/predict` accepts JSON, runs it through the same
   pipeline used in training, and returns a price estimate, a ±range,
   and price/sqft.

6. **Deployment basics** — a single Flask process serves both the HTML
   pages and the JSON API; SQLite handles minimal session-based auth.

---

## Setup & run (Windows / PowerShell)

```powershell
# 1. Clone the repo
git clone https://github.com/mayurishinde11/House-Price-Prediction-System.git
cd House-Price-Prediction-System\backend

# 2. Create and activate a virtual environment (Python 3.12 recommended)
py -3.12 -m venv venv
venv\Scripts\Activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. (Re)generate the dataset — already included, re-run for fresh data
cd data
python generate_dataset.py
cd ..

# 5. (Optional) run the standalone cleaning demo
python data\data_cleaning.py

# 6. Train the model — already included, re-run after changing data/features
cd model
python train_model.py
cd ..

# 7. Start the app
python app.py
```

Visit **http://127.0.0.1:5000**.

---

## API reference

| Method | Route             | Description                                      |
|--------|-------------------|---------------------------------------------------|
| GET    | `/api/locations`  | Returns `{ state: { city: [localities] } }`        |
| POST   | `/api/predict`    | Body: property details JSON → price estimate       |
| GET    | `/api/metrics`    | Returns model evaluation metrics                    |
| POST   | `/api/signup`     | `{ email, password }` → creates account, logs in    |
| POST   | `/api/login`      | `{ email, password }` → logs in                     |
| POST   | `/api/logout`     | Clears session                                       |
| GET    | `/api/me`         | Returns current session email or `null`             |

**Example `/api/predict` request:**
```json
{
  "state": "Jammu and Kashmir",
  "city": "Jammu",
  "locality": "Gandhi Nagar",
  "area_sqft": 1000,
  "bedrooms": 2,
  "bathrooms": 2,
  "parking": 1,
  "property_type": "Apartment",
  "furnishing": "Unfurnished",
  "property_age_years": 5
}
```

**Response:**
```json
{
  "predicted_price": 6119000.0,
  "price_range": { "low": 5629000.0, "high": 6608000.0 },
  "price_per_sqft": 6119.0,
  "input": { "...echoed input..." }
}
```

---

## Pages

| Route | Description |
|---|---|
| `/` | Landing page with hero + feature highlights |
| `/predict` | Price predictor — State/City/Locality cascade + property details form |
| `/budget` | EMI / budget planner with live calculation |
| `/dashboard` | Model performance metrics (best model, R², MAE) |
| `/login`, `/signup` | Session-based auth backed by SQLite |

---

## Tech stack

- **ML:** Python, Pandas, NumPy, Scikit-learn (Pipeline, ColumnTransformer,
  OneHotEncoder, StandardScaler, GradientBoostingRegressor)
- **Backend:** Flask, SQLite (auth), Joblib (model persistence)
- **Frontend:** HTML, CSS, vanilla JavaScript (fetch API, no build step)

---

## Author

Built by Mayuri Balasaheb Shinde.