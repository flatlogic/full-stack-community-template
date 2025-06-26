# Project Setup & Local Development

## Tech Stack

| Layer     | Technology           |
| --------- | -------------------- |
| Front‑end | **React JS**         |
| Back‑end  | **Node JS**          |
| Database  | **PostgreSQL**       |
| Container | **Docker & Compose** |

---

## 1 — Run Locally (without Docker)

### 1.1 Backend

```bash
cd backend
# install dependencies
yarn install
```

\#### Configure PostgreSQL

<details>
<summary><strong>macOS</strong></summary>

```bash
brew install postgres
```

</details>
<details>
<summary><strong>Ubuntu</strong></summary>

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

</details>

\##### Create DB & Admin User

```bash
# log in as default super‑user
psql postgres -U postgres

-- inside psql
CREATE ROLE admin WITH LOGIN PASSWORD 'admin_pass';
ALTER ROLE admin CREATEDB;
\q

# log in as the new user
psql postgres -U admin

-- inside psql
CREATE DATABASE db_<your_project_name>;
GRANT ALL PRIVILEGES ON DATABASE db_<your_project_name> TO admin;
\q
```

\##### Migrate & Start

```bash
yarn db:create   # generate schema
yarn start       # production build
```

### 1.2 Frontend

```bash
cd frontend
yarn install
yarn start
```

> Front‑end dev‑server runs at **[http://localhost:3000](http://localhost:3000)** by default.

---

## 2 — Run with Docker

```bash
cd docker
chmod +x wait-for-it.sh start-backend.sh
```

| Scenario                  | Command                            |
| ------------------------- | ---------------------------------- |
| **Fresh DB volume**       | `rm -rf data && docker-compose up` |
| **Reuse existing volume** | `docker-compose up`                |

Then open **[http://localhost:3000](http://localhost:3000)**.

Stop services with **Ctrl + C** or:

```bash
docker-compose down
```

> **Heads‑up:** Files inside the `docker/` folder and the root `Dockerfile` are used for cloud deployment. Changing them may break the pipeline.

---

## Folder Structure (top‑level)

```text
├── backend/          # Node JS API & services
├── frontend/         # React application
├── docker/           # Compose files & helper scripts
└── README.md         # (this file)
```

---

## Troubleshooting

### “connection refused”

1. Port closed or backlog full.
2. Firewall (local or network).
3. Service not running.

Verify with:

```bash
telnet <host> <port>
```

### macOS

```bash
sudo service ssh status
```

### Ubuntu – IP conflict check

```bash
arp-scan -I eth0 -l | grep <ipaddress>
arping <ipaddress>
```

### Reset PostgreSQL schema (macOS example)

```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

---

## Cheat‑sheet

| Task                    | Command                            |
| ----------------------- | ---------------------------------- |
| **Create DB schema**    | `yarn db:create`                   |
| **Start backend**       | `yarn start`                       |
| **Start dev front‑end** | `cd frontend && yarn start`        |
| **Compose up (fresh)**  | `rm -rf data && docker-compose up` |
| **Compose down**        | `docker-compose down`              |

<br/>

---

Made with ❤️ by Flatlogic Platform.
