import { AsyncLocalStorage } from "node:async_hooks";
import mongoose from "mongoose";
import ApiError from "../core/apiError.js";
import User from "./models/User.js";
const tenantStorage = new AsyncLocalStorage();
const tenantConnections = new Map();
const tenantSchemas = new Map();
const GLOBAL_MODELS = new Set(["User", "OwnerRegistration"]);
export const getTenantConnection = () => tenantStorage.getStore();
export const getCurrentShopOwnerId = () => getTenantConnection()?.name.match(/^laundry_shop_([\da-f]{24})$/i)?.[1];
export const getTenantConnectionForShop = (shopOwnerId) => {
    if (!/^[\da-f]{24}$/i.test(shopOwnerId)) {
        throw new ApiError(400, "Invalid shop");
    }
    const cached = tenantConnections.get(shopOwnerId);
    if (cached)
        return cached;
    const connection = mongoose.connection.useDb(`laundry_shop_${shopOwnerId}`, {
        useCache: true,
    });
    tenantConnections.set(shopOwnerId, connection);
    return connection;
};
const bindGlobalModelRefs = (schema) => {
    schema.eachPath((_path, schemaType) => {
        if (schemaType.options.ref === "User") {
            schemaType.options.ref = User;
        }
        if (schemaType.schema)
            bindGlobalModelRefs(schemaType.schema);
        if (schemaType.$embeddedSchemaType?.schema) {
            bindGlobalModelRefs(schemaType.$embeddedSchemaType.schema);
        }
    });
};
const registerTenantModels = (connection) => {
    for (const [name, originalSchema] of tenantSchemas) {
        if (GLOBAL_MODELS.has(name) || connection.models[name])
            continue;
        const schema = originalSchema.clone();
        bindGlobalModelRefs(schema);
        connection.model(name, schema);
    }
};
export const createTenantModel = (name, schema) => {
    tenantSchemas.set(name, schema);
    const globalModel = mongoose.model(name, schema);
    return new Proxy(globalModel, {
        get(target, property) {
            const connection = getTenantConnection();
            if (!connection) {
                const value = Reflect.get(target, property, target);
                return typeof value === "function" ? value.bind(target) : value;
            }
            registerTenantModels(connection);
            const model = connection.models[name];
            const value = Reflect.get(model, property, model);
            return typeof value === "function" ? value.bind(model) : value;
        },
        construct(_target, args) {
            const connection = getTenantConnection();
            if (!connection) {
                return Reflect.construct(globalModel, args);
            }
            registerTenantModels(connection);
            const model = connection.models[name];
            return Reflect.construct(model, args);
        },
    });
};
export const runInTenantContext = (shopOwnerId, callback) => tenantStorage.run(getTenantConnectionForShop(shopOwnerId), callback);
