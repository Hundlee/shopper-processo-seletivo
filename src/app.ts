import express from "express";
import dotenv from "dotenv";
import {
    confirmMeasure,
    createMeasure,
    listMeasures,
} from "./controllers/measureController";

dotenv.config();

const app = express();
const PORT = 8081;

app.use(express.json());

app.post("/upload", createMeasure);
app.patch("/confirm", confirmMeasure);
app.get("/:customer_code/list", listMeasures);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.get("/", (req, res) => {
    res.send("Hello World!");
});
