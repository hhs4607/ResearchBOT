"""Run the FastAPI server: python -m src.api"""

import uvicorn

from src.api.app import create_app

app = create_app()

if __name__ == "__main__":
    uvicorn.run("src.api.__main__:app", host="0.0.0.0", port=8000, reload=True)
