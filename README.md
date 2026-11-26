# Our Little Museum

A private multiplayer 3D romantic museum (React Three Fiber + Socket.IO).

## Run locally
    npm install
    npm run server   # API, uploads, multiplayer on :3001
    npm run dev      # client on :5173 (proxies to the server)

## Deploy (one service serves everything)
    npm install && npm run build
    NODE_ENV=production PORT=3001 UPLOAD_DIR=/data/uploads npm start
or build the included `Dockerfile` (mount a persistent volume at `/data`).
Use a host with long-running Node + WebSockets (Render, Railway, Fly.io, a VPS) behind HTTPS.
Rooms live in memory (a restart clears them); uploaded files live in `UPLOAD_DIR`.

## Known dependencies and limits
- Characters are procedural shapes. Swap in rigged GLB models (Ready Player Me, Mixamo) for realistic motion.
- Uploads (`/api/upload`, `/api/upload-media`) are unauthenticated; add a token or storage such as S3/R2 before sharing publicly.
- Use MP4 (H.264) video and MP3/AAC audio for the widest device support.
