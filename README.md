# BFHL Full Stack Challenge

REST API + frontend for the SRM Full Stack Engineering Challenge (Round 1).

## Stack

- **Backend** — Node.js / Express
- **Frontend** — Vanilla HTML/CSS/JS (zero dependencies)
- **Deploy** — Vercel (recommended) or Render

---

## Local Development

### 1. Install & run the backend

```bash
cd backend
npm install
npm start
# → http://localhost:3001
```

### 2. Open the frontend

Just open `frontend/index.html` in your browser. The default API URL is already set to `http://localhost:3001`.

### 3. Test the API directly

```bash
curl -X POST http://localhost:3001/bfhl \
  -H "Content-Type: application/json" \
  -d '{"data":["A->B","A->C","B->D","X->Y","Y->Z","Z->X","hello"]}'
```

---

## Deploying

### Vercel (recommended — one command)

```bash
npm i -g vercel
vercel --prod
```

The `vercel.json` in the root handles routing automatically:
- `POST /bfhl` → Express API
- Everything else → `frontend/index.html`

After deploy, update the **base url** field in the frontend to your Vercel URL.

### Render

1. Create a new **Web Service** pointing to this repo
2. Set **Build Command**: `cd backend && npm install`
3. Set **Start Command**: `node backend/server.js`
4. Set env vars: `USER_ID`, `EMAIL_ID`, `ROLL_NUMBER`

For the frontend, create a separate **Static Site** pointing to the `frontend/` folder.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Server port |
| `USER_ID` | `johndoe_17091999` | Your user_id in response |
| `EMAIL_ID` | `john.doe@college.edu` | Your email in response |
| `ROLL_NUMBER` | `21CS1001` | Your roll number in response |

---

## API Reference

### `POST /bfhl`

**Request**
```json
{ "data": ["A->B", "A->C", "B->D", "X->Y", "Y->Z", "Z->X", "hello"] }
```

**Response** — see spec for full schema. Handles:
- Valid tree construction with multi-root support
- Cycle detection (returns `has_cycle: true`, `tree: {}`)
- Diamond/multi-parent (first-parent-wins)
- Duplicate edge deduplication
- Invalid entry classification
- Depth calculation & summary stats
