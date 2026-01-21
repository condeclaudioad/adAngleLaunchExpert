
const { GoogleGenAI } = require("@google/genai");

const key = 'AIzaSyAHOPUSSu5y7NquvDAL0-VEos9lxzlCgmk';

async function listRaw() {
    const ai = new GoogleGenAI({ apiKey: key });
    try {
        const response = await ai.models.list();
        // The SDK returns { models: [...] } or just an array depending on version.
        const models = response.models || response;

        console.log("--- MODEL LIST ---");
        if (Array.isArray(models)) {
            models.forEach(m => console.log(m.name, "| Methods:", m.supportedGenerationMethods));
        } else {
            console.log("Response is not array:", response);
        }
    } catch (e) {
        console.error("List failed:", e);
    }
}
listRaw();
