import cv2
import json
import numpy as np

image = cv2.imread("output-smallpngtools.png")

# colors to detect (BGR format because OpenCV uses BGR)
colors = {
    "green": [0,255,0],
    "purple": [169,81,120],
    "red": [0,0,255],
    "teal": [255,255,0]
}

territories = []

for name,color in colors.items():

    lower = np.array(color) - 10
    upper = np.array(color) + 10

    mask = cv2.inRange(image, lower, upper)

    contours,_ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    for i,c in enumerate(contours):

        area = cv2.contourArea(c)

        if area < 100:  # ignore tiny specks
            continue

        points = []

        for p in c:
            x = int(p[0][0])
            y = int(p[0][1])
            points.append([x,y])

        territories.append({
            "id": f"{name}-{i}",
            "name": f"{name.capitalize()} Territory {i+1}",
            "type": "Territory",
            "owner": "",
            "description": "",
            "points": points
        })

with open("territories.json","w") as f:
    json.dump(territories,f,indent=2)

print("Territories extracted.")