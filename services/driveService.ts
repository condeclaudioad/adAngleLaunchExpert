// This service handles the Drive API interaction.
// Note: We use the Google Identity Services (GSI) client for auth.

// Helper: Convert Base64 Data URI to Blob directly to avoid Fetch/CORS issues
const dataURItoBlob = (dataURI: string): Blob => {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
};

export const initGoogleClient = (clientId: string, callback: (token: any) => void) => {
  // @ts-ignore
  if (typeof google === 'undefined') {
    console.error("Google script not loaded");
    return null;
  }

  try {
    // @ts-ignore
    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: callback,
    });
    return client;
  } catch (e) {
    console.error("Failed to init google client", e);
    return null;
  }
};

export const createFolder = async (folderName: string, accessToken: string): Promise<string> => {
  const metadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  const response = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Failed to create folder: ${err.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.id;
};

export const uploadImageToDrive = async (
  imageUrl: string, 
  fileName: string, 
  folderId: string, 
  accessToken: string
) => {
  // 1. Convert Base64 URL to Blob properly
  const fileBlob = dataURItoBlob(imageUrl);
  
  // 2. Prepare Metadata
  const metadata = {
    name: fileName,
    parents: [folderId],
  };

  // 3. Create Multipart Body manually
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', fileBlob);

  // 4. Send Request
  // Note: 'uploadType=multipart' is crucial for this format
  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    body: form,
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("Drive upload failed response:", err);
    throw new Error("Failed to upload image to Drive");
  }

  return await response.json();
};