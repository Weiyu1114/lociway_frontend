# LociWay Frontend

乐沩项目总盘前端页面。页面从 LociWay 后端读取飞书多维表格数据，用于团队内部查看业务线、机会、任务和资料入口。

## Local Preview

```bash
npm install --ignore-scripts
npm run dev:client -- --host 127.0.0.1 --port 5173
```

Open:

```text
http://127.0.0.1:5173/client/index.html
```

## Environment

Create `.env` from `.env.example` when running locally:

```bash
cp .env.example .env
```

Current backend:

```text
VITE_LOCIWAY_API_BASE=https://lociway-backend.onrender.com
```

## Render Static Site

Use these settings on Render:

```text
Service type: Static Site
Build Command: npm install --ignore-scripts && npm run build:client
Publish Directory: dist/client
```

Environment variable:

```text
VITE_LOCIWAY_API_BASE=https://lociway-backend.onrender.com
```

Daily data updates should be made in Feishu Base. The frontend only displays data; it does not edit business records.
