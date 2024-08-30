import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { bufferToBase64, downloadImage } from "../utils/imageUtils";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export async function processHydrometers(imageUrl: string) {
    const prompt = "Please just extract the readings, just the number.";

    try {
        const buffer = await downloadImage(imageUrl);

        const urlBase64 = bufferToBase64(buffer, "image/jpeg");

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const generatedContent = await model.generateContent([
            prompt,
            urlBase64,
        ]);

        return generatedContent.response.text();
    } catch (error) {
        console.error("Error processing hydrometers:", error);
    }
}
