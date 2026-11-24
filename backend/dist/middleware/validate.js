import { z, ZodError } from "zod";
import ApiError from "../core/apiError.js";
export const validateRequest = (schema) => {
    return async (req, _res, next) => {
        try {
            const validated = await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            req.body = validated.body;
            Object.keys(req.params).forEach(key => delete req.params[key]);
            Object.assign(req.params, validated.params);
            Object.keys(req.query).forEach(key => delete req.query[key]);
            Object.assign(req.query, validated.query);
            return next();
        }
        catch (error) {
            if (error instanceof ZodError) {
                const message = error.issues.map((e) => e.message).join(", ");
                return next(new ApiError(400, message));
            }
            return next(error);
        }
    };
};
export const validateBody = (schema) => {
    return async (req, _res, next) => {
        try {
            req.body = await schema.parseAsync(req.body);
            return next();
        }
        catch (error) {
            if (error instanceof ZodError) {
                const message = error.issues.map((e) => e.message).join(", ");
                return next(new ApiError(400, message));
            }
            return next(error);
        }
    };
};
export const validateParams = (schema) => {
    return async (req, _res, next) => {
        try {
            const validated = await schema.parseAsync(req.params);
            Object.keys(req.params).forEach(key => delete req.params[key]);
            Object.assign(req.params, validated);
            return next();
        }
        catch (error) {
            if (error instanceof ZodError) {
                const message = error.issues.map((e) => e.message).join(", ");
                return next(new ApiError(400, message));
            }
            return next(error);
        }
    };
};
export const validateQuery = (schema) => {
    return async (req, _res, next) => {
        try {
            const validated = await schema.parseAsync(req.query);
            Object.keys(req.query).forEach(key => delete req.query[key]);
            Object.assign(req.query, validated);
            return next();
        }
        catch (error) {
            if (error instanceof ZodError) {
                const message = error.issues.map((e) => e.message).join(", ");
                return next(new ApiError(400, message));
            }
            return next(error);
        }
    };
};
export const validate = (schema) => validateRequest(z.object(schema));
