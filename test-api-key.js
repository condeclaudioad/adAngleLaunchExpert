
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyBj-QTlOWo1iurG5CArOX9DOFQDDdRsAhc";

async function testKey() {
    console.log("Testing API Key:", API_KEY);
    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        // Use the exact same model we configured in the app
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = "Hello, world! Are you working?";
        console.log(`Sending prompt to model 'gemini-1.5-flash': "${prompt}"`);

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log("\n--- SUCCESS ---");
        console.log("Response:", text);
    } catch (error) {
        console.log("\n--- ERROR ---");
        console.error("Error details:", error.message);
        if (error.response) {
            console.error("Status:", error.response.status);
        }
    }
}

testKey();
