#!/usr/bin/env python3
import subprocess
import os

# Get project root relative to current working directory
project_root = os.getcwd()
os.chdir(project_root)

print(f"[v0] Working in: {project_root}")
print(f"[v0] Creating package-lock.json...")

try:
    # Run npm install with --package-lock-only to create lock file
    result = subprocess.run(
        ["npm", "install", "--package-lock-only", "--legacy-peer-deps"],
        cwd=project_root
    )
    
    if result.returncode == 0:
        print("[v0] Success! package-lock.json created")
    else:
        print(f"[v0] Error: npm command failed with code {result.returncode}")
        
except Exception as e:
    print(f"[v0] Failed: {e}")
