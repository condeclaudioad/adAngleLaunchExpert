# AdAngle MVP

AI-powered creative asset generator for media buyers. This app analyzes references, generates new marketing angles, creates visual assets using Fal.ai (Recraft V3), and uploads them to Google Drive.

## Setup

1. **Install Dependencies**
   ```bash
   npm install react react-dom @google/genai tailwindcss
   # Dev dependencies
   npm install -D vite @vitejs/plugin-react typescript @types/react @types/react-dom
   ```

2. **Environment Variables**
   Create a `.env` file in the root:
   ```
   API_KEY=your_gemini_api_key_here
   GOOGLE_CLIENT_ID=your_google_cloud_client_id_here
   FAL_KEY=optional_default_fal_key
   ```
   *Note: For the MVP, `FAL_KEY` can also be entered in the UI.*

3. **Google Drive Setup**
   - Go to Google Cloud Console.
   - Create a project and enable **Google Drive API**.
   - Create OAuth 2.0 Client ID (Web Application).
   - Add `http://localhost:5173` (or your port) to **Authorized JavaScript Origins**.

## Architecture

- **Frontend Only**: React SPA + Tailwind CSS.
- **State**: React Context API handles the workflow pipeline.
- **AI**: 
  - `@google/genai` for Vision (Image Analysis) and Text (Angle Generation).
  - `fetch` to `fal.run` for Image Generation.
- **Storage**: Browser LocalStorage for Knowledge Base, Google Drive for final assets.

## Running

```bash
npm run dev
```

## MVP Limitations

- Google Drive integration uses the implicit flow. It requires valid origins configuration in GCP.
- Image generation is throttled in the UI loop to prevent browser hanging, but real-world usage should utilize a backend queue.
- 1 Image + 1 Variation generated per angle for demo speed.
