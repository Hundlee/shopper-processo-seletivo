import { MeasureType } from "@prisma/client";
import { db } from "../lib/prisma";

// Encontrar um cliente pelo código
export async function findCustomer(customer_code: string) {
    return await db.customer.findUnique({
        where: { customer_code },
    });
}

// Criar um novo cliente
export async function createCustomer(customer_code: string) {
    return await db.customer.create({
        data: {
            customer_code,
        },
    });
}

// Verificar se já existe uma medição no mês
export async function checkExistingMeasure(
    customerId: string,
    measure_type: MeasureType,
    measureDate: Date
) {
    const year = measureDate.getFullYear();
    const month = measureDate.getMonth();

    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

    return await db.measure.findFirst({
        where: {
            customerId,
            measure_type,
            measure_datetime: {
                gte: startOfMonth,
                lte: endOfMonth,
            },
        },
    });
}

// Criar um novo registro de medição
export async function createMeasureRecord(data: {
    measure_uuid: string;
    measure_type: MeasureType;
    measure_value: number;
    measure_datetime: string;
    image_url: string;
    customerId: string;
}) {
    return await db.measure.create({
        data,
    });
}
