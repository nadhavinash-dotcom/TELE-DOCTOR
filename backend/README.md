# Teleconsultation Engine - backend (no login, no payment)
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
API docs: http://localhost:8000/docs
NOTE: there is no authentication - anyone who can reach this server can read, edit and delete every record. Run it on localhost only.
