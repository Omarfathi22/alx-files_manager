import base64
import requests
import sys

# Check if the required arguments are provided
if len(sys.argv) != 4:
    print("Usage: python script.py <file_path> <X-Token> <parentId>")
    sys.exit(1)

# Extract arguments
file_path = sys.argv[1]  # File path to the image
x_token = sys.argv[2]    # Authentication token
parent_id = sys.argv[3]  # Parent directory or folder ID

# Extract the file name from the file path
file_name = file_path.split('/')[-1]

# Encode the file to Base64
file_encoded = None
try:
    with open(file_path, "rb") as image_file:
        file_encoded = base64.b64encode(image_file.read()).decode('utf-8')
except FileNotFoundError:
    print(f"Error: File '{file_path}' not found.")
    sys.exit(1)

# Prepare the JSON payload for the POST request
r_json = {
    'name': file_name,
    'type': 'image',
    'isPublic': True,
    'data': file_encoded,
    'parentId': parent_id
}

# Prepare the request headers
r_headers = {'X-Token': x_token}

# Send the POST request
try:
    r = requests.post("http://0.0.0.0:5000/files", json=r_json, headers=r_headers)
    r.raise_for_status()  # Raise an HTTPError for bad responses (4xx and 5xx)
    print(r.json())  # Print the JSON response
except requests.exceptions.RequestException as e:
    print(f"Error: {e}")
    sys.exit(1)
