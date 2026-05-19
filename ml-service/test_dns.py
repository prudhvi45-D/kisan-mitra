import socket
import sys

def check_dns(hostname):
    try:
        ip = socket.gethostbyname(hostname)
        print(f"SUCCESS: Resolved {hostname} to {ip}")
        return True
    except socket.gaierror as e:
        print(f"FAILURE: Could not resolve {hostname}: {e}")
        return False

print("Checking DNS resolution...")
hf_resolved = check_dns("huggingface.co")
google_resolved = check_dns("google.com")

if not hf_resolved:
    print("\nSUGGESTION: You might have a DNS issue or are offline.")
    if google_resolved:
        print("Since Google resolves, Hugging Face might be blocked or down.")
    else:
        print("Since Google also fails, you seem to be offline or have broken DNS.")
