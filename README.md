# 🩺 TELE-DOCTOR

A full-stack telemedicine and digital healthcare project.

## 🚧 Project Status — Stage 1

**Stage 1: Frontend and Backend Completed**

The initial frontend and backend implementations are complete, and the project is now available for testing. Further improvements and features may be added in upcoming stages.

## 🛠️ Minimal Tech Stack

- **Frontend:** React.js, Vite, JavaScript
- **Backend:** Python, FastAPI
- **Database:** SQLite
- **Version Control:** Git, GitHub

## 📁 Project Structure

```text
TELE-DOCTOR/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env.example
│   └── tele.db
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   └── ...
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

*Note: The structure above is representative. Actual files may vary depending on the current implementation.*

## ⚙️ Backend Setup

Open a terminal and run:

```bash
cd backend
python -m pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The backend API will be available at:

- **API:** http://127.0.0.1:8000
- **Swagger UI:** http://127.0.0.1:8000/docs

Keep the backend terminal running.

## 💻 Frontend Setup

Open a **new terminal** from the project root and run:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed in the terminal, typically:

http://localhost:5173

To create a production build, run this inside the `frontend` directory:

```bash
npm run build
```

## 🧪 Development & Testing

Recommended checks before submitting changes:

- Install frontend dependencies and run the development server.
- Install backend dependencies and start the API.
- Verify API responses using Swagger UI.
- Confirm that the frontend can communicate with the backend.
- Test error handling and validation.
- Verify that environment variables are configured correctly.

## 🤝 Contributing

Contributions and suggestions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make and test your changes.
4. Commit your changes.
5. Open a pull request describing your improvements.

## 📌 Repository

**GitHub:** https://github.com/nadhavinash-dotcom/TELE-DOCTOR

---

*TELE-DOCTOR — Stage 1 complete. Currently open for testing.*
