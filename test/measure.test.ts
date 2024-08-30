import request from "supertest";
import express from "express";
import {
    confirmMeasure,
    createMeasure,
    listMeasures,
} from "../src/controllers/measureController";

const app = express();
app.use(express.json());
app.post("/upload", createMeasure);
app.patch("/confirm", confirmMeasure);
app.get("/measures/:customer_code", listMeasures);

describe("POST /upload", () => {
    it("should respond with the measure data", async () => {
        const response = await request(app).post("/upload").send({
            image_url:
                "https://www.saaebandeirantes.com.br/public/admin/globalarq/uploads/images/hd(1).jpg",
            customer_code: "Customer1",
            measure_datetime: "2024-08-30T00:00:00Z",
            measure_type: "WATER",
        });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("image_url");
        expect(response.body).toHaveProperty("measureValue");
        expect(response.body).toHaveProperty("measureUuid");
    });

    it("should respond with 400 if required fields are missing", async () => {
        const response = await request(app).post("/upload").send({
            image_url:
                "https://www.saaebandeirantes.com.br/public/admin/globalarq/uploads/images/hd(1).jpg",
            customer_code: "1234",
        });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error_code", "INVALID_DATA");
    });
});

describe("PATCH /confirm", () => {
    it("should respond with confirmation data", async () => {
        const response = await request(app).patch("/confirm").send({
            measure_uuid: "b1f1b84b-cf7b-4679-a12a-298bc7cf93b8",
            confirmed_value: 353485,
        });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("success", true);
    });
});

describe("GET /measures/:customer_code", () => {
    it("should respond with the measures for the given customer_code", async () => {
        const response = await request(app).get("/measures/Customer1");

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("customer_code", "Customer1");
        expect(response.body).toHaveProperty("measures");
        expect(Array.isArray(response.body.measures)).toBe(true);
    });

    it("should respond with 400 if customer_code is missing", async () => {
        const response = await request(app).get("/measures/");

        expect(response.status).toBe(404);
    });

    it("should respond with 400 if measure_type is invalid", async () => {
        const response = await request(app)
            .get("/measures/Customer1")
            .query({ measure_type: "INVALID_TYPE" });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error_code", "INVALID_TYPE");
    });
});
