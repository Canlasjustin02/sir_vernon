import { z } from "zod";
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");
export const createInventoryCategorySchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
});
export const updateInventoryCategorySchema = z.object({
    name: z.string().min(1, "Name cannot be empty").optional(),
    description: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
});
export const inventoryCategoryIdParamSchema = z.object({
    id: objectIdSchema,
});
