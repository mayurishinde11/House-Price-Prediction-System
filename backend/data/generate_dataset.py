"""
generate_dataset.py
--------------------
Generates a synthetic but realistic Indian house-price dataset for the
EstateIQ price-prediction project.

Run:
    python generate_dataset.py

Output:
    house_data.csv   (in this same folder)
"""

import numpy as np
import pandas as pd

np.random.seed(42)

# ---------------------------------------------------------------------
# 1. Location hierarchy: State -> City -> Locality
#    Base price = avg price per sqft (INR) for that locality, used to
#    drive the synthetic target variable.
#    Covers all 28 states + 8 union territories of India.
# ---------------------------------------------------------------------
LOCATIONS = {
    "Andhra Pradesh": {
        "Visakhapatnam": {
            "MVP Colony": 6200, "Madhurawada": 4800, "Dwaraka Nagar": 5500,
        },
        "Vijayawada": {
            "Benz Circle": 5200, "Governorpet": 4600, "Auto Nagar": 3800,
        },
    },
    "Arunachal Pradesh": {
        "Itanagar": {
            "Naharlagun": 3200, "Ganga Market": 3600, "Chandranagar": 3000,
        },
    },
    "Assam": {
        "Guwahati": {
            "Zoo Road": 5500, "Dispur": 6000, "Beltola": 4800, "Khanapara": 4200,
        },
    },
    "Bihar": {
        "Patna": {
            "Boring Road": 6500, "Kankarbagh": 4500, "Bailey Road": 7000,
        },
    },
    "Chhattisgarh": {
        "Raipur": {
            "Civil Lines": 4800, "Shankar Nagar": 5200, "Telibandha": 4400,
        },
    },
    "Goa": {
        "Panaji": {
            "Miramar": 11000, "Dona Paula": 12500, "Caranzalem": 9500,
        },
        "Margao": {
            "Fatorda": 6800, "Borda": 6000,
        },
    },
    "Gujarat": {
        "Ahmedabad": {
            "Satellite": 7200, "Bopal": 5800, "Navrangpura": 8500,
            "Vastrapur": 9200,
        },
        "Surat": {
            "Adajan": 5500, "Vesu": 6800, "City Light": 6200,
        },
    },
    "Haryana": {
        "Gurugram": {
            "DLF Phase 1": 13500, "Sohna Road": 6500, "Sector 49": 8500,
            "Golf Course Road": 16000,
        },
        "Faridabad": {
            "Sector 15": 5800, "Greenfield Colony": 5200,
        },
    },
    "Himachal Pradesh": {
        "Shimla": {
            "Mall Road": 9500, "Sanjauli": 5500, "Chhota Shimla": 6800,
        },
    },
    "Jharkhand": {
        "Ranchi": {
            "Harmu": 4800, "Lalpur": 5200, "Kanke Road": 4200,
        },
    },
    "Karnataka": {
        "Bengaluru": {
            "Whitefield": 7800, "Koramangala": 12500, "Indiranagar": 13500,
            "Electronic City": 6200, "Hebbal": 7000,
        },
        "Mysuru": {
            "Vijayanagar": 4800, "Gokulam": 5500, "Kuvempunagar": 5000,
        },
    },
    "Kerala": {
        "Kochi": {
            "Kakkanad": 5800, "Edappally": 6500, "Marine Drive": 11000,
        },
        "Thiruvananthapuram": {
            "Kowdiar": 6800, "Pattom": 5500, "Kazhakkoottam": 4800,
        },
    },
    "Madhya Pradesh": {
        "Indore": {
            "Vijay Nagar": 5800, "Palasia": 6500, "Rau": 4200,
        },
        "Bhopal": {
            "Arera Colony": 5500, "MP Nagar": 6200, "Kolar Road": 4000,
        },
    },
    "Maharashtra": {
        "Mumbai": {
            "Bandra": 32000, "Andheri": 21000, "Powai": 19000,
            "Borivali": 15000, "Dadar": 26000,
        },
        "Pune": {
            "Koregaon Park": 14000, "Hinjewadi": 7500, "Viman Nagar": 9500,
            "Kothrud": 8500, "Wakad": 7000,
        },
        "Nagpur": {
            "Civil Lines": 6500, "Dharampeth": 6000, "Wardha Road": 5200,
        },
    },
    "Manipur": {
        "Imphal": {
            "Thangal Bazar": 3400, "Lamphelpat": 3000,
        },
    },
    "Meghalaya": {
        "Shillong": {
            "Police Bazar": 5500, "Laitumkhrah": 4800,
        },
    },
    "Mizoram": {
        "Aizawl": {
            "Dawrpui": 3600, "Chanmari": 3200,
        },
    },
    "Nagaland": {
        "Kohima": {
            "Midland": 3400, "Dimapur Road": 3000,
        },
    },
    "Odisha": {
        "Bhubaneswar": {
            "Patia": 5500, "Saheed Nagar": 6200, "Chandrasekharpur": 4800,
        },
    },
    "Punjab": {
        "Chandigarh": {
            "Sector 17": 12500, "Sector 22": 9800, "Sector 35": 8500,
        },
        "Ludhiana": {
            "Model Town": 6200, "Sarabha Nagar": 6800,
        },
    },
    "Rajasthan": {
        "Jaipur": {
            "Malviya Nagar": 5800, "Vaishali Nagar": 5200, "C Scheme": 7500,
        },
        "Udaipur": {
            "Fatehpura": 6000, "Hiran Magri": 4800,
        },
    },
    "Sikkim": {
        "Gangtok": {
            "MG Marg": 8500, "Tadong": 5500,
        },
    },
    "Tamil Nadu": {
        "Chennai": {
            "Anna Nagar": 11500, "T Nagar": 13500, "OMR": 6800,
            "Velachery": 8200, "Adyar": 14500,
        },
        "Coimbatore": {
            "RS Puram": 6500, "Saibaba Colony": 6000, "Peelamedu": 5200,
        },
    },
    "Telangana": {
        "Hyderabad": {
            "Gachibowli": 8500, "Banjara Hills": 16000, "Madhapur": 9000,
            "Kondapur": 7800, "Kukatpally": 6200,
        },
    },
    "Tripura": {
        "Agartala": {
            "Akhaura Road": 3400, "Banamalipur": 3800,
        },
    },
    "Uttar Pradesh": {
        "Lucknow": {
            "Gomti Nagar": 6500, "Hazratganj": 8500, "Alambagh": 4800,
        },
        "Noida": {
            "Sector 62": 7500, "Sector 137": 6800, "Sector 18": 9500,
        },
        "Kanpur": {
            "Civil Lines": 5200, "Swaroop Nagar": 4600,
        },
    },
    "Uttarakhand": {
        "Dehradun": {
            "Rajpur Road": 7500, "Race Course": 6800, "Vasant Vihar": 6200,
        },
    },
    "West Bengal": {
        "Kolkata": {
            "Salt Lake": 9500, "Park Street": 17000, "Ballygunge": 15500,
            "New Town": 6800, "Howrah": 4800,
        },
    },
    # ---- Union Territories ----
    "Delhi": {
        "New Delhi": {
            "Vasant Vihar": 28000, "Dwarka": 11000, "Rohini": 9500,
            "Saket": 19000, "Karol Bagh": 14500,
        },
    },
    "Jammu and Kashmir": {
        "Srinagar": {
            "Rajbagh": 6500, "Jawahar Nagar": 5200,
        },
        "Jammu": {
            "Gandhi Nagar": 5800, "Trikuta Nagar": 4800,
        },
    },
    "Ladakh": {
        "Leh": {
            "Leh Market": 4800, "Skara": 3600,
        },
    },
    "Chandigarh": {
        "Chandigarh City": {
            "Sector 9": 11500, "Sector 21": 9000, "Sector 44": 8000,
        },
    },
    "Puducherry": {
        "Puducherry City": {
            "White Town": 9500, "Lawspet": 5800, "Reddiarpalayam": 4800,
        },
    },
    "Andaman and Nicobar Islands": {
        "Port Blair": {
            "Aberdeen Bazaar": 5200, "Haddo": 4600,
        },
    },
    "Dadra and Nagar Haveli and Daman and Diu": {
        "Daman": {
            "Nani Daman": 4800, "Moti Daman": 4400,
        },
    },
    "Lakshadweep": {
        "Kavaratti": {
            "Kavaratti Town": 3800,
        },
    },
}

PROPERTY_TYPES = ["Apartment", "Independent House", "Villa", "Builder Floor"]
FURNISHING = ["Unfurnished", "Semi-Furnished", "Furnished"]

N_SAMPLES = 15000
rows = []

# Flatten location tree for sampling
flat_localities = []
for state, cities in LOCATIONS.items():
    for city, localities in cities.items():
        for loc, base_price in localities.items():
            flat_localities.append((state, city, loc, base_price))

for _ in range(N_SAMPLES):
    state, city, locality, base_psf = flat_localities[
        np.random.randint(len(flat_localities))
    ]

    area = int(np.random.normal(1200, 550))
    area = max(350, min(area, 6000))

    bedrooms = np.random.choice([1, 2, 3, 4, 5], p=[0.12, 0.32, 0.32, 0.18, 0.06])

    # Bathrooms correlate with bedrooms
    bathrooms = max(1, min(bedrooms + np.random.choice([-1, 0, 0, 1]), 6))

    parking = np.random.choice([0, 1, 2, 3], p=[0.15, 0.45, 0.30, 0.10])

    age = np.random.choice(
        [0, 1, 2, 5, 8, 12, 18, 25],
        p=[0.08, 0.10, 0.14, 0.20, 0.18, 0.14, 0.10, 0.06]
    )

    property_type = np.random.choice(PROPERTY_TYPES, p=[0.55, 0.20, 0.10, 0.15])
    furnishing = np.random.choice(FURNISHING, p=[0.45, 0.35, 0.20])

    floor_no = np.random.randint(0, 25)
    total_floors = max(floor_no + 1, np.random.randint(1, 30))

    # ---------------------------------------------------------------
    # Price formula (synthetic ground truth) — combines locality base
    # price/sqft with feature adjustments + noise, so the model has
    # real, learnable structure (not pure randomness).
    # ---------------------------------------------------------------
    price_per_sqft = base_psf

    # Age depreciation (older property -> cheaper per sqft)
    price_per_sqft *= max(0.55, 1 - age * 0.012)

    # Furnishing premium
    furnishing_mult = {"Unfurnished": 1.0, "Semi-Furnished": 1.06, "Furnished": 1.13}
    price_per_sqft *= furnishing_mult[furnishing]

    # Property type premium
    type_mult = {
        "Apartment": 1.0, "Builder Floor": 0.97,
        "Independent House": 1.05, "Villa": 1.35,
    }
    price_per_sqft *= type_mult[property_type]

    # Floor premium (higher floor = slightly costlier, diminishing)
    price_per_sqft *= 1 + min(floor_no, 15) * 0.004

    # Bathroom / parking small premiums
    price_per_sqft *= 1 + (bathrooms - bedrooms) * 0.02
    price_per_sqft *= 1 + parking * 0.015

    # Random market noise
    price_per_sqft *= np.random.normal(1.0, 0.08)
    price_per_sqft = max(1500, price_per_sqft)

    total_price = price_per_sqft * area

    rows.append({
        "state": state,
        "city": city,
        "locality": locality,
        "area_sqft": area,
        "bedrooms": int(bedrooms),
        "bathrooms": int(bathrooms),
        "parking": int(parking),
        "property_age_years": int(age),
        "property_type": property_type,
        "furnishing": furnishing,
        "floor_no": int(floor_no),
        "total_floors": int(total_floors),
        "price_inr": round(total_price, -3),  # round to nearest 1000
    })

df = pd.DataFrame(rows)

# Light cleaning safeguards (kept even though synthetic data is already valid,
# to mirror a real-world cleaning step in the pipeline)
df = df.drop_duplicates()
df = df[df["area_sqft"] > 0]
df = df[df["price_inr"] > 0]
df.reset_index(drop=True, inplace=True)

out_path = "house_data.csv"
df.to_csv(out_path, index=False)
print(f"Saved {len(df)} rows to {out_path}")
print(df.head())
print(df.describe(include="all").T)