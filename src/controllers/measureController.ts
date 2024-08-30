import { Request, Response } from "express";

import { v4 as uuidv4 } from "uuid";
import { db } from "../lib/prisma";
import {
    checkExistingMeasure,
    createCustomer,
    createMeasureRecord,
    findCustomer,
} from "../services/measureService";
import { processHydrometers } from "../services/googleAIService";

export const createMeasure = async (req: Request, res: Response) => {
    const { image_url, customer_code, measure_datetime, measure_type } =
        req.body;

    if (!image_url || !customer_code || !measure_type) {
        return res.status(400).json({
            error_code: "INVALID_DATA",
            error_description: "Missing required fields.",
        });
    }

    try {
        const measureValue = await processHydrometers(image_url);
        const measureUuid = uuidv4();

        let customer = await findCustomer(customer_code);

        if (!customer) {
            customer = await createCustomer(customer_code);
        }

        const measureDate = new Date(measure_datetime);
        const existingMeasure = await checkExistingMeasure(
            customer.id,
            measure_type,
            measureDate
        );

        if (existingMeasure) {
            return res.status(409).json({
                error_code: "DOUBLE_REPORT",
                error_description: "Leitura do mês já realizada",
            });
        }

        await createMeasureRecord({
            measure_uuid: measureUuid,
            measure_type,
            measure_value: Number(measureValue) || 0,
            measure_datetime,
            image_url,
            customerId: customer.id,
        });

        res.status(200).send({ image_url, measureValue, measureUuid });
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred during processing.");
    }
};

export const confirmMeasure = async (req: Request, res: Response) => {
    const { measure_uuid, confirmed_value } = req.body;

    if (!measure_uuid || !confirmed_value) {
        return res.status(400).json({
            error_code: "INVALID_DATA",
            error_description:
                "Os dados fornecidos no corpo da requisição são inválidos.",
        });
    }

    try {
        const measure = await db.measure.findUnique({
            where: { measure_uuid },
        });

        if (!measure) {
            return res.status(404).json({
                error_code: "MEASURE_NOT_FOUND",
                error_description: "Leitura não encontrada.",
            });
        }

        if (measure.has_confirmed) {
            return res.status(409).json({
                error_code: "CONFIRMATION_DUPLICATE",
                error_description: "Leitura já confirmada.",
            });
        }

        await db.measure.update({
            where: { measure_uuid },
            data: {
                measure_value: confirmed_value,
                has_confirmed: true,
            },
        });

        res.status(200).json({
            success: true,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error_code: "INTERNAL_ERROR",
            error_description: "Um erro ocorreu durante o processamento.",
        });
    }
};

export const listMeasures = async (req: Request, res: Response) => {
    const { customer_code } = req.params;
    const { measure_type } = req.query;

    if (!customer_code) {
        return res.status(400).json({
            error_code: "INVALID_DATA",
            error_description: "Código do cliente é necessário.",
        });
    }

    let measureTypeFilter;

    if (measure_type) {
        const measureType =
            typeof measure_type === "string" ? measure_type.toUpperCase() : "";
        if (measureType !== "WATER" && measureType !== "GAS") {
            return res.status(400).json({
                error_code: "INVALID_TYPE",
                error_description: "Tipo de medição não permitida.",
            });
        }
        measureTypeFilter = measureType;
    }

    try {
        const customer = await findCustomer(customer_code);

        if (!customer) {
            return res.status(404).json({
                error_code: "MEASURES_NOT_FOUND",
                error_description: "Nenhum registro encontrado.",
            });
        }

        const measures = await db.measure.findMany({
            where: {
                customerId: customer.id,
                ...(measureTypeFilter
                    ? { measure_type: measureTypeFilter as any }
                    : {}),
            },
            select: {
                measure_uuid: true,
                measure_datetime: true,
                measure_type: true,
                has_confirmed: true,
                image_url: true,
            },
        });

        if (measures.length === 0) {
            return res.status(404).json({
                error_code: "MEASURES_NOT_FOUND",
                error_description: "Nenhuma leitura encontrada.",
            });
        }

        res.status(200).json({
            customer_code,
            measures,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error_code: "INTERNAL_ERROR",
            error_description: "Um erro ocorreu durante o processamento.",
        });
    }
};
