# TaskFlow 🚀

A collaborative project management tool built with React — inspired by Trello and Asana. Manage projects, assign tasks, communicate with your team, and track progress in real time.

![TaskFlow](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react) ![License](https://img.shields.io/badge/License-MIT-green) ![Status](https://img.shields.io/badge/Status-Active-brightgreen)

---

## Features

- 🔐 **Auth System** — Sign up / Sign in with email and password
- 📋 **Project Boards** — Kanban-style boards with drag & drop
- 🗂️ **Task Cards** — Create, edit, assign, prioritize, and label tasks
- 💬 **Comments** — Threaded communication inside each task
- 🔔 **Notifications** — Real-time alerts for comments and assignments
- 🌐 **Live Presence** — WebSocket-simulated activity feed per board
- 👥 **Team Management** — Assign members to projects and tasks
- 📊 **Overview Dashboard** — Progress bars, open tasks, and stats

---

## Demo Credentials

```
Email:    alex@taskflow.io
Password: pass123
```

---

## Getting Started

### Prerequisites

- Node.js v16 or higher
- npm v8 or higher

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/taskflow.git

# 2. Navigate into the project
cd taskflow

# 3. Install dependencies
npm install

# 4. Start the development server
npm start
```

The app will open at **http://localhost:3000**

---

## Project Structure

```
taskflow/
├── public/
│   └── index.html
├── src/
│   ├── App.js          # Main application (all components + store)
│   └── index.js        # React entry point
├── package.json
└── README.md
```

---

## Usage

### Creating a Project
1. Click **+ New Project** in the left sidebar
2. Enter a name, description, and pick a color
3. Default columns (To Do, In Progress, Review, Done) are created automatically

### Managing Tasks
- Click **+** on any column to add a task
- Click a task card to open the detail modal
- **Drag and drop** cards between columns
- Assign team members, set priority, due date, and labels from the modal

### Collaborating
- Add comments inside any task — teammates get notified
- Use the **🔔 bell icon** to view all notifications
- Watch the **live indicator** to see who's active on the board

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 (Hooks) |
| State Management | Custom in-memory store (pub/sub pattern) |
| Styling | Inline CSS with CSS variables |
| Real-time | WebSocket simulation (setInterval) |
| Auth | In-memory user store |
| Build Tool | Create React App |

---

## Known Limitations

- Data is **in-memory only** — refreshing the page resets all data
- WebSocket is **simulated** — not a real socket connection
- No persistent backend or database

## Roadmap

- [ ] Node.js + Express REST API
- [ ] PostgreSQL database integration
- [ ] Real WebSocket support via Socket.io
- [ ] JWT-based authentication
- [ ] File attachments on tasks
- [ ] Email notifications
- [ ] Mobile responsive layout

---

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

```bash
# Fork the repo, then:
git checkout -b feature/your-feature
git commit -m "Add your feature"
git push origin feature/your-feature
# Open a Pull Request
```

---

## License

[MIT](LICENSE) — free to use, modify, and distribute.

---

> Built with ❤️ using React. Inspired by Trello, Asana, and Linear.
