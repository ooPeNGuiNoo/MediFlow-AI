# 🏥 MediFlow AI — AI-Powered Pre-Consultation System

> An intelligent pre-consultation assistant that collects patient symptoms via AI chat, generates structured medical reports, and routes them to doctors for review — before the patient ever walks in.

---

## 🎬 Pitch Video

<!-- Add your pitch video link below -->
📽️ **Demo / Pitch Video:** _[[https://mmuedumy-my.sharepoint.com/:v:/g/personal/chan_hui_ern_student_mmu_edu_my/IQCLbOF-vXZ1QZa9JMZnNNiBAVfjHaF45pjPfcpYmUVYBEU?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJPbmVEcml2ZUZvckJ1c2luZXNzIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXciLCJyZWZlcnJhbFZpZXciOiJNeUZpbGVzTGlua0NvcHkifX0&e=idtLgo](https://mmuedumy-my.sharepoint.com/:v:/g/personal/chan_hui_ern_student_mmu_edu_my/IQDp8eSviA1qRqzkE1V0buVFAeAlT_Z8G7jRbXABZC4zi40?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJPbmVEcml2ZUZvckJ1c2luZXNzIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXciLCJyZWZlcnJhbFZpZXciOiJNeUZpbGVzTGlua0NvcHkifX0&e=lAEifN)]_

---

## 📖 Overview

MediFlow AI streamlines the patient-doctor consultation workflow by leveraging conversational AI to gather symptom data upfront. Patients chat with an AI assistant, which generates a structured pre-consultation report. Doctors can then review, annotate, and approve or reject the report before the appointment — saving time and improving clinical readiness.

---

## ✨ Features

- **AI-Powered Chat Consultation** — Multi-turn conversational AI guides patients through symptom collection with follow-up questions
- **Dual Language Support** — Reports generated in both English and Bahasa Malaysia
- **Severity Classification** — AI automatically classifies each case as Low 🟢, Medium 🟡, or High 🔴 severity
- **Doctor Review Dashboard** — Doctors receive reports in a queue, can add notes, and approve or reject with a single click
- **Real-Time Decision Polling** — Patients are notified of the doctor's decision in near real-time (polling every 4 seconds)
- **Consultation History & Analytics** — Visual charts showing severity distribution across all past consultations
- **Patient Reports View** — Patients can track their past reports and check doctor decisions
- **Unread Notification Badge** — Animated notification badge on the home screen when a new doctor decision arrives
- **File Upload Support** — Patients can attach relevant documents or images during consultation
- **Queue Assignment** — Each submitted report is automatically assigned a queue number and consultation room

---

## 🏗️ Project Structure

```
mediflow-ai/
├── index.html          # Landing page — role selection (Patient / My Reports / Doctor)
├── chat.html           # AI chat interface for patient pre-consultation
├── doctor.html         # Doctor dashboard — review and action reports
├── my_reports.html     # Patient's personal report history with decision status
├── dashboard.html      # Analytics dashboard — consultation history and severity charts
├── server.js           # Local Node.js server + CORS proxy to ilmu.ai API
└── .env                # API key config (not committed — see Setup)
```

---

## 🔄 Workflow

```
Patient → Chat with AI → Report Generated → Doctor Reviews → Approved / Rejected → Patient Notified
```

1. **Patient** visits `index.html` and selects "I'm a Patient"
2. AI asks structured follow-up questions about symptoms, duration, severity, and history
3. A pre-consultation **report** is auto-generated with severity rating, confidence score, and recommended action
4. Report is pushed to the **doctor's queue**
5. **Doctor** reviews the report, adds clinical notes, and approves or rejects
6. **Patient** sees the decision in real time on their report screen

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, Tailwind CSS, Vanilla JavaScript |
| AI Backend | [ilmu.ai](https://ilmu.ai) ZAI GLM API (OpenAI-compatible) |
| Charts | Chart.js |
| Fonts | Sora (Google Fonts) |
| Local Server | Node.js (built-in `http` / `https` modules — no framework) |
| Storage | Browser `localStorage` (no database required) |

---

## ⚙️ Setup & Running Locally

### Prerequisites

- [Node.js](https://nodejs.org/) v14 or higher
- An [ilmu.ai](https://ilmu.ai) API key

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/mediflow-ai.git
   cd mediflow-ai
   ```

2. **Create a `.env` file** in the project root:
   ```
   ZAI_API_KEY=sk-your-api-key-here
   ```

3. **Start the server**
   ```bash
   node server.js
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

> No `npm install` needed — the server uses only Node.js built-in modules.

---

## 🔑 API Configuration

MediFlow AI uses the **ilmu.ai ZAI GLM API**, which follows the OpenAI-compatible format.

| Setting | Value |
|---|---|
| Endpoint | `https://api.ilmu.ai/v1/chat/completions` |
| Default Model | `ilmu-glm-5.1` |
| Auth | `Authorization: Bearer <ZAI_API_KEY>` |

The local `server.js` acts as a CORS proxy, forwarding requests from the browser to the ilmu.ai API securely.

---

## 🚀 Pages at a Glance

| Page | URL | Description |
|---|---|---|
| Home | `/index.html` | Role selection landing page |
| AI Chat | `/chat.html` | Patient symptom collection chatbot |
| Doctor Dashboard | `/doctor.html` | Report review and action queue |
| My Reports | `/my_reports.html` | Patient's report history |
| Analytics | `/dashboard.html` | Severity charts and consultation stats |

---

## ⚠️ Disclaimer

MediFlow AI is a **healthcare workflow assistance tool** and does not replace the judgment of a licensed medical professional. All AI-generated reports must be reviewed and validated by a qualified doctor before any clinical action is taken.

---

## 📄 License

This project is intended for educational and hackathon purposes.
