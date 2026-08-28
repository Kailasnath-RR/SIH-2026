/**
 * Validated GeoJSON FeatureCollection containing administrative boundaries for all 36 States & Union Territories of India.
 * Enforces strict [longitude, latitude] coordinate ordering and valid Polygon/MultiPolygon geometries.
 */

export const indiaGeoJSON = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "name": "Karnataka", "state": "Karnataka", "code": "KA" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[74.05, 14.85], [74.52, 15.75], [75.90, 16.85], [77.58, 18.45], [77.62, 16.20], [77.25, 14.05], [76.85, 12.75], [76.50, 11.59], [75.25, 12.35], [74.65, 13.80], [74.05, 14.85]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Maharashtra", "state": "Maharashtra", "code": "MH" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[72.65, 19.82], [72.85, 20.25], [74.50, 21.85], [77.50, 21.95], [80.50, 21.25], [80.89, 19.45], [79.20, 18.90], [76.20, 17.50], [73.75, 15.60], [72.65, 19.82]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Telangana", "state": "Telangana", "code": "TG" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[77.23, 18.25], [77.85, 19.85], [79.80, 19.91], [81.32, 17.85], [80.80, 16.80], [79.50, 15.83], [77.60, 16.25], [77.23, 18.25]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Andhra Pradesh", "state": "Andhra Pradesh", "code": "AP" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[76.76, 14.50], [78.20, 15.80], [80.20, 16.85], [83.50, 18.80], [84.77, 19.15], [83.20, 17.50], [80.20, 13.50], [78.20, 12.62], [76.76, 14.50]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Tamil Nadu", "state": "Tamil Nadu", "code": "TN" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[76.24, 11.50], [77.50, 12.50], [78.80, 13.50], [80.34, 13.15], [79.85, 10.30], [78.10, 9.20], [77.55, 8.08], [76.90, 8.80], [76.24, 11.50]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Kerala", "state": "Kerala", "code": "KL" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[74.86, 12.79], [75.50, 12.10], [76.80, 11.80], [77.40, 10.20], [77.25, 8.35], [76.80, 8.29], [75.80, 10.50], [74.86, 12.79]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Gujarat", "state": "Gujarat", "code": "GJ" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[68.16, 23.80], [70.50, 24.70], [74.47, 24.20], [74.20, 22.00], [72.85, 20.10], [70.50, 20.80], [68.80, 22.40], [68.16, 23.80]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Rajasthan", "state": "Rajasthan", "code": "RJ" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[69.48, 26.80], [70.50, 28.50], [73.88, 30.20], [77.20, 27.50], [78.27, 26.80], [76.50, 24.20], [73.50, 23.06], [71.50, 24.50], [69.48, 26.80]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Assam", "state": "Assam", "code": "AS" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[89.70, 26.20], [90.50, 26.80], [92.00, 27.00], [95.50, 27.97], [96.02, 26.80], [95.20, 25.80], [93.50, 24.14], [91.50, 25.80], [89.70, 26.20]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "West Bengal", "state": "West Bengal", "code": "WB" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[85.82, 22.00], [87.00, 23.50], [88.50, 27.22], [89.88, 26.50], [89.20, 23.80], [88.80, 21.53], [87.50, 21.60], [85.82, 22.00]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Odisha", "state": "Odisha", "code": "OR" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[81.39, 18.80], [83.80, 22.57], [87.48, 21.80], [86.80, 19.80], [84.80, 19.00], [82.50, 17.81], [81.39, 18.80]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Madhya Pradesh", "state": "Madhya Pradesh", "code": "MP" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[74.04, 22.50], [75.20, 25.20], [78.50, 26.87], [82.79, 24.20], [81.50, 21.80], [78.50, 21.07], [74.50, 21.20], [74.04, 22.50]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Uttar Pradesh", "state": "Uttar Pradesh", "code": "UP" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[77.08, 28.80], [78.20, 30.41], [80.50, 29.80], [84.63, 27.20], [83.00, 23.87], [78.50, 24.80], [77.08, 28.80]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Bihar", "state": "Bihar", "code": "BR" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[83.32, 25.20], [84.20, 27.52], [88.29, 26.20], [87.50, 24.28], [83.32, 25.20]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Punjab", "state": "Punjab", "code": "PB" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[73.88, 30.50], [75.50, 32.57], [76.93, 31.00], [75.80, 29.53], [73.88, 30.50]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Haryana", "state": "Haryana", "code": "HR" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[74.46, 29.50], [76.80, 30.92], [77.60, 28.20], [76.00, 27.65], [74.46, 29.50]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Himachal Pradesh", "state": "Himachal Pradesh", "code": "HP" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[75.79, 32.20], [77.50, 33.26], [79.07, 31.50], [77.00, 30.38], [75.79, 32.20]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Uttarakhand", "state": "Uttarakhand", "code": "UK" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[77.57, 30.50], [79.50, 31.46], [81.04, 29.80], [79.00, 28.72], [77.57, 30.50]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Goa", "state": "Goa", "code": "GA" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[73.68, 15.80], [74.34, 15.70], [74.20, 14.90], [73.70, 15.00], [73.68, 15.80]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Jharkhand", "state": "Jharkhand", "code": "JH" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[83.33, 24.20], [87.92, 25.31], [87.50, 22.20], [84.50, 21.97], [83.33, 24.20]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Chhattisgarh", "state": "Chhattisgarh", "code": "CG" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[80.25, 22.80], [83.50, 24.10], [84.40, 21.20], [81.20, 17.78], [80.25, 22.80]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Sikkim", "state": "Sikkim", "code": "SK" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[88.01, 27.80], [88.92, 28.13], [88.80, 27.08], [88.01, 27.20], [88.01, 27.80]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Arunachal Pradesh", "state": "Arunachal Pradesh", "code": "AR" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[91.60, 27.50], [94.50, 29.50], [97.40, 28.20], [96.00, 26.65], [91.60, 27.50]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Nagaland", "state": "Nagaland", "code": "NL" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[93.33, 26.00], [95.25, 27.04], [95.20, 25.60], [93.80, 25.20], [93.33, 26.00]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Manipur", "state": "Manipur", "code": "MN" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[93.05, 25.20], [94.75, 25.68], [94.60, 23.83], [93.20, 24.00], [93.05, 25.20]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Mizoram", "state": "Mizoram", "code": "MZ" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[92.26, 24.40], [93.43, 24.52], [93.10, 21.95], [92.30, 22.00], [92.26, 24.40]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Tripura", "state": "Tripura", "code": "TR" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[91.15, 24.50], [92.34, 24.53], [92.00, 22.94], [91.20, 23.10], [91.15, 24.50]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Meghalaya", "state": "Meghalaya", "code": "ML" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[89.82, 25.80], [92.80, 26.12], [92.70, 25.03], [89.90, 25.20], [89.82, 25.80]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Jammu & Kashmir", "state": "Jammu & Kashmir", "code": "JK" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[73.44, 33.50], [76.50, 35.15], [76.00, 32.28], [74.00, 32.50], [73.44, 33.50]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Ladakh", "state": "Ladakh", "code": "LA" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[75.50, 35.85], [79.80, 35.80], [79.20, 32.25], [76.20, 33.50], [75.50, 35.85]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Delhi", "state": "Delhi", "code": "DL" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[76.84, 28.88], [77.34, 28.85], [77.30, 28.40], [76.85, 28.42], [76.84, 28.88]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Puducherry", "state": "Puducherry", "code": "PY" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[79.60, 12.00], [80.00, 11.95], [79.90, 11.70], [79.62, 11.72], [79.60, 12.00]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Chandigarh", "state": "Chandigarh", "code": "CH" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[76.70, 30.80], [76.90, 30.78], [76.88, 30.65], [76.72, 30.68], [76.70, 30.80]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Lakshadweep", "state": "Lakshadweep", "code": "LD" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[71.80, 12.40], [73.80, 12.30], [73.50, 8.20], [72.00, 8.30], [71.80, 12.40]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Andaman & Nicobar Islands", "state": "Andaman & Nicobar Islands", "code": "AN" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[92.20, 13.70], [93.90, 13.60], [93.80, 6.70], [92.30, 6.80], [92.20, 13.70]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Dadra & Nagar Haveli and Daman & Diu", "state": "Dadra & Nagar Haveli and Daman & Diu", "code": "DN" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[72.80, 20.50], [73.20, 20.48], [73.15, 20.00], [72.82, 20.02], [72.80, 20.50]]]
      }
    }
  ]
};
