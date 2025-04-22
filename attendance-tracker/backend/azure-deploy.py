import os
import sys

# Add the parent directory to the path so we can import app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.main import app

if __name__ == "__main__":
    # This file is used by Azure to start the application
    import uvicorn
    
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("azure-deploy:app", host="0.0.0.0", port=port)