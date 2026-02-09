# Kisan-Mitra
# Agri-Connect / Kisan Mitra

This project is a comprehensive agricultural ecosystem featuring a Client (Frontend), Server (Backend API), and an ML Service for crop analysis.

***

## Getting Started

Follow the instructions below to set up and run each component of the application.

### Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.9 or higher)
- **Git**

***

## 1. Clone the Repository

Start by cloning the repository to your local machine.

```bash
git clone <repository-url>
cd agri-connect
```

```mermaid
graph LR
    A[Remote Repository] -- "git clone" --> B[Local Machine]
    B -- "cd agri-connect" --> C[Project Root]
    style C fill:#e1f5fe,stroke:#01579b,stroke-width:2px
```

***

## 2. Client Setup (Frontend)

The client is a React application built with Vite and Tailwind CSS.

### Installation Commands

Navigate to the `client` folder and install the dependencies.

```bash
cd client
npm install
```

### Run Commands

Start the development server.

```bash
npm run dev
```
The application will typically run at `http://localhost:5173`.

### Visual Workflow

```mermaid
sequenceDiagram
    participant User
    participant Terminal
    participant Client

    Note over User, Client: setting up the Frontend
    User->>Terminal: cd client
    User->>Terminal: npm install
    Terminal-->>User: Dependencies Installed (node_modules)
    User->>Terminal: npm run dev
    Terminal->>Client: Start Vite Server
    Client-->>User: Ready at http://localhost:5173
```

***

## 3. Server Setup (Backend)

The server is a Node.js & Express application using TypeScript.

### Installation Commands

Navigate to the `server` folder and install the dependencies.

```bash
cd server
npm install
```

### Run Commands

Start the backend server in development mode.

```bash
npm run dev
```
The server typically runs on port `5000` (e.g., `http://localhost:5000`).

### Visual Workflow

```mermaid
sequenceDiagram
    participant User
    participant Terminal
    participant Server

    Note over User, Server: Setting up the Backend
    User->>Terminal: cd server
    User->>Terminal: npm install
    Terminal-->>User: Dependencies Installed
    User->>Terminal: npm run dev
    Terminal->>Server: Start Express (ts-node-dev)
    Server-->>User: API Listening on Port 5000
```

***

## 4. ML Service Setup (AI Engine)

The ML Service is a Python-based FastAPI application for image analysis.

### Installation Commands

Navigate to the `ml-service` directory. We recommend using a virtual environment.

**1. Create and Activate Virtual Environment**

*Windows:*
```bash
cd ml-service
python -m venv .venv
.venv\Scripts\activate
```

*Mac/Linux:*
```bash
cd ml-service
python3 -m venv .venv
source .venv/bin/activate
```

**2. Install Dependencies**

```bash
pip install -r requirements.txt
```

### Run Commands

Start the ML service.

```bash
# Make sure your virtual environment is activated
python main.py
```
Alternatively, you can run with uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
The service will run at `http://localhost:8000`.

### Visual Workflow

```mermaid
sequenceDiagram
    participant User
    participant Terminal
    participant Venv as Virtual Env
    participant ML as ML Service

    Note over User, ML: Setting up AI Service
    User->>Terminal: cd ml-service
    User->>Terminal: python -m venv .venv
    Terminal->>Venv: Create .venv
    User->>Terminal: .venv\Scripts\activate
    Terminal->>Venv: Activate Environment
    User->>Terminal: pip install -r requirements.txt
    Terminal-->>User: Python Packages Installed
    User->>Terminal: python main.py
    Terminal->>ML: Start FastAPI App
    ML-->>User: Service Ready at http://localhost:8000
```

***

## Summary of Ports

| Service | Port | URL |
| :--- | :--- | :--- |
| **Client** | 5173 | `http://localhost:5173` |
| **Server** | 5000 | `http://localhost:5000` |
| **ML Service** | 8000 | `http://localhost:8000` |
