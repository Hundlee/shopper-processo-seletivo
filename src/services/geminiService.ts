import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

function bufferToBase64(buffer: Buffer, mimeType: string) {
    return {
        inlineData: {
            data: buffer.toString("base64"),
            mimeType,
        },
    };
}

async function downloadImage(url: string): Promise<Buffer> {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    return Buffer.from(response.data, "binary");
}

async function processHydrometers(imageUrl: string) {
    const prompt = "Please just extract the readings, just the number.";

    try {
        const buffer = await downloadImage(imageUrl);

        const urlBase64 = bufferToBase64(buffer, "image/jpeg");

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const generatedContent = await model.generateContent([
            prompt,
            urlBase64,
        ]);

        console.log(generatedContent.response.text());
        return generatedContent.response.text();
    } catch (error) {
        console.error("Error processing hydrometers:", error);
    }
}
