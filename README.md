 <div align="center">

# 🌞 **Sunway ERP Platform**

A modular **ERP web platform** built with **React + Vite + Tailwind + ShadCN UI**, designed to manage HR, Inventory, and Finance operations in one unified dashboard.

---

### 🏗️ Built With

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=FFD62E)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-0F172A?style=for-the-badge&logo=tailwindcss)
![ShadCN](https://img.shields.io/badge/ShadCN_UI-black?style=for-the-badge&logo=shadcn)
![Recharts](https://img.shields.io/badge/Recharts-2E93FA?style=for-the-badge)
![Zod](https://img.shields.io/badge/Zod-3068D9?style=for-the-badge)
![React Hook Form](https://img.shields.io/badge/React_Hook_Form-EC5990?style=for-the-badge&logo=reacthookform&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white)
![TanStack Table](https://img.shields.io/badge/TanStack_Table-FF4154?style=for-the-badge&logo=react-table&logoColor=white)
![Redux](https://img.shields.io/badge/Redux-764ABC?style=for-the-badge&logo=redux&logoColor=white)
![React Query](https://img.shields.io/badge/React_Query-FF4154?style=for-the-badge&logo=react-query&logoColor=white)

---

### 🚀 Deployment

[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://sunway-erp.vercel.app)

Live Demo → **[https://sunway-erp.vercel.app](https://sunway-erp.vercel.app)**

</div>

---

## Running locally

### Prerequisites

- **Node.js 20+** (recommended for Vite 7)
- **npm**
- **Backend** — MySQL and the Spring Boot API must be running for full functionality. See **[`../backend/README.md`](../backend/README.md)**.

### Quick start

From this directory (`sunway-erp-web`):

```bash
npm install
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** (or the port printed in the terminal if you override it).

### API base URL

The dev server can talk to the API in two ways:

1. **Direct URL (typical)** — create a `.env` file in `sunway-erp-web`:

   ```bash
   VITE_APP_BASE_URL=http://localhost:8080/api
   ```

   The backend must allow your origin; `http://localhost:5173` is already listed in the backend CORS config.

2. **Vite proxy** — omit `VITE_APP_BASE_URL` so the client uses relative `/api`, and point the proxy at your backend:

   ```bash
   VITE_PROXY_TARGET=http://localhost:8080 npm run dev
   ```

   By default, without this variable, the proxy targets the production API host configured in `vite.config.ts`; always set `VITE_PROXY_TARGET` for local backend use when using proxy mode.

Optional: **`VITE_PORT`** — dev server port (default `5173`).

### Other scripts

| Command | Description |
| ------- | ----------- |
| `npm run build` | Typecheck and production build |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |
| `npm run currency:check` | Script to catch hardcoded currency strings |

---

## 🚀 Features

### 🧭 Core Modules

| Module           | Key Features                                                                    |
| ---------------- | ------------------------------------------------------------------------------- |
| **HR & Payroll** | Employee management, attendance tracking, training, appraisals, payroll reports |
| **Inventory**    | Stock management, sales, purchase, inventory reports                            |
| **Finance**      | Accounts payable/receivable, general ledger, payroll, financial reports         |

---

### 💻 Tech Stack

| Layer                  | Technology                                                                     |
| ---------------------- | ------------------------------------------------------------------------------ |
| **Frontend Framework** | [React](https://react.dev/) (with [Vite](https://vitejs.dev/))                 |
| **Routing**            | [React Router v6](https://reactrouter.com/)                                    |
| **UI Library**         | [ShadCN UI](https://ui.shadcn.com/) + [Tailwind CSS](https://tailwindcss.com/) |
| **Charts & Analytics** | [ShadCN Charts (Recharts)](https://ui.shadcn.com/charts)                       |
| **Forms & Validation** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)      |
| **Icons**              | [Lucide React](https://lucide.dev/)                                            |
| **Calendar**           | [React Day Picker (via ShadCN)](https://react-day-picker.js.org/)              |

---

## ⚙️ Installation

### 1️⃣ Clone and enter the frontend folder

If this app lives inside a monorepo, `cd` into `sunway-erp-web`. Otherwise clone your repository and open the web project root.

```bash
git clone https://github.com/anandureghu/sunway-erp.git
cd sunway-erp/sunway-erp-web
```

(Adjust the path to match your clone.)

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Configure the API and run

Configure **`VITE_APP_BASE_URL`** or **`VITE_PROXY_TARGET`** as described in [Running locally](#running-locally), then:

```bash
npm run dev
```

Open **http://localhost:5173** (unless you changed `VITE_PORT`).

## 🧠 Development Notes

- Uses React Hook Form + Zod for schema-based form validation.

- Recharts + ShadCN ChartContainer for visual analytics.

- Responsive Sidebar Layout using ShadCN Sidebar + Collapsible.

- Theme-aware with Tailwind + CSS variables (--chart-n).
