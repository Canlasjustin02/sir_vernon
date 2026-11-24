import mongoose from "mongoose";
import config from "../config/env.js";
import User from "../database/models/User.js";
import { getTenantConnectionForShop } from "../database/tenantContext.js";
import { ROLES } from "../core/constants.js";
const ownerEmail = process.env.SHOP_MIGRATION_OWNER_EMAIL?.trim().toLowerCase();
if (!ownerEmail) {
    throw new Error("SHOP_MIGRATION_OWNER_EMAIL must identify the target shop admin");
}
if (!config.MONGO_URI) {
    throw new Error("MONGO_URI is missing in environment config");
}
const migrationId = "shared-data-to-shop";
const excludedCollections = new Set(["users", "ownerregistrations"]);
const migrate = async () => {
    await mongoose.connect(config.MONGO_URI, { dbName: config.MONGO_DB_NAME });
    const owner = await User.findOne({
        email: ownerEmail,
        role: ROLES.ADMIN,
        isActive: true,
    }).select("_id email");
    if (!owner) {
        throw new Error("No active admin matches SHOP_MIGRATION_OWNER_EMAIL");
    }
    const sourceDb = mongoose.connection.db;
    if (!sourceDb)
        throw new Error("The shared MongoDB database is unavailable");
    const targetDb = getTenantConnectionForShop(owner._id.toString()).db;
    if (!targetDb)
        throw new Error("The shop MongoDB database is unavailable");
    const migrations = targetDb.collection("_shop_migrations");
    const existingMigration = await migrations.findOne({ _id: migrationId });
    if (existingMigration?.status === "complete") {
        throw new Error("Shared data migration has already completed for this shop");
    }
    if (!existingMigration) {
        const targetCollections = await targetDb.listCollections().toArray();
        for (const { name } of targetCollections) {
            if (name === "_shop_migrations")
                continue;
            if ((await targetDb.collection(name).estimatedDocumentCount()) > 0) {
                throw new Error(`Shop database already contains data in "${name}"; refusing to merge automatically`);
            }
        }
        await migrations.insertOne({
            _id: migrationId,
            ownerId: owner._id,
            ownerEmail,
            status: "in_progress",
            completedCollections: [],
            startedAt: new Date(),
        });
    }
    const completedCollections = new Set(existingMigration?.completedCollections ?? []);
    const sourceCollections = await sourceDb.listCollections().toArray();
    for (const { name } of sourceCollections) {
        if (name.startsWith("system.") || excludedCollections.has(name))
            continue;
        if (completedCollections.has(name))
            continue;
        const source = sourceDb.collection(name);
        const destination = targetDb.collection(name);
        let operations = [];
        for await (const document of source.find().batchSize(500)) {
            operations.push({
                updateOne: {
                    filter: { _id: document._id },
                    update: { $setOnInsert: document },
                    upsert: true,
                },
            });
            if (operations.length === 500) {
                await destination.bulkWrite(operations, { ordered: false });
                operations = [];
            }
        }
        if (operations.length) {
            await destination.bulkWrite(operations, { ordered: false });
        }
        await migrations.updateOne({ _id: migrationId }, { $addToSet: { completedCollections: name } });
        console.info(`Migrated collection: ${name}`);
    }
    await migrations.updateOne({ _id: migrationId }, { $set: { status: "complete", completedAt: new Date() } });
    console.info("Shared operational data migration completed.");
};
migrate()
    .catch((error) => {
    console.error("Shop data migration failed.", error);
    process.exitCode = 1;
})
    .finally(async () => {
    await mongoose.disconnect();
});
