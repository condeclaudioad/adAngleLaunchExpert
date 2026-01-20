
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyBj-QTlOWo1iurG5CArOX9DOFQDDdRsAhc";

async function testKeyFinal() {
    console.log("Testing API Key with gemini-2.0-flash...");
    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = "Hello! Valid?";
        const result = await model.generateContent(prompt);
        const text = await result.response.text();

        console.log("\n--- SUCCESS ---");
        console.log("Response:", text);
    } catch (error) {
        console.log("\n--- ERROR ---");
        console.error(error.message);
    }
}

testKeyFinal();
