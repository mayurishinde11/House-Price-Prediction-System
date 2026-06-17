"""
data_cleaning.py
-----------------
Standalone exploratory data cleaning script — run this BEFORE train_model.py
if you swap in your own raw/real-world dataset instead of the synthetic one.

It demonstrates the cleaning steps a real-world house listing CSV usually
needs: handling missing values, removing duplicates, fixing data types,
and clipping outliers. It reads data/house_data.csv, cleans it, and
overwrites data/house_data_clean.csv (leaves the original untouched).

Run:
    python data_cleaning.py
"""

import os
import pandas as pd

DATA_DIR = os.path.dirname(__file__)
RAW_PATH = os.path.join(DATA_DIR, "house_data.csv")
CLEAN_PATH = os.path.join(DATA_DIR, "house_data_clean.csv")

df = pd.read_csv(RAW_PATH)
print(f"Loaded {len(df)} rows, {df.shape[1]} columns")
print("\nMissing values per column:")
print(df.isnull().sum())

# 1. Drop exact duplicate rows
before = len(df)
df = df.drop_duplicates()
print(f"\nDropped {before - len(df)} duplicate rows")

# 2. Drop rows missing critical fields
critical_cols = ["state", "city", "locality", "area_sqft", "price_inr"]
before = len(df)
df = df.dropna(subset=critical_cols)
print(f"Dropped {before - len(df)} rows missing critical fields")

# 3. Fix obviously invalid values
df = df[df["area_sqft"] > 0]
df = df[df["price_inr"] > 0]
df = df[df["bedrooms"] > 0]
df = df[df["bathrooms"] > 0]

# 4. Clip outliers using the IQR method on price and area
for col in ["price_inr", "area_sqft"]:
    q1, q3 = df[col].quantile([0.25, 0.75])
    iqr = q3 - q1
    lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
    before = len(df)
    df = df[(df[col] >= lower) & (df[col] <= upper)]
    print(f"Clipped {before - len(df)} outlier rows on '{col}'")

# 5. Normalize text columns (trim whitespace, consistent casing for joins)
text_cols = ["state", "city", "locality", "property_type", "furnishing"]
for col in text_cols:
    df[col] = df[col].astype(str).str.strip()

df = df.reset_index(drop=True)
df.to_csv(CLEAN_PATH, index=False)
print(f"\nSaved {len(df)} cleaned rows to {CLEAN_PATH}")