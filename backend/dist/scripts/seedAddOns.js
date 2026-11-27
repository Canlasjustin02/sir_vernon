import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import InventoryCategory from "../database/models/InventoryCategory.js";
import Supplier from "../database/models/Supplier.js";
import Inventory from "../database/models/Inventory.js";
import { UNITS } from "../core/constants.js";
const ADDONS_CATEGORY = "AddOns";
const addonItems = [
    {
        name: "Fabric Softener Boost",
        description: "Extra softness and fresh scent for your laundry.",
        unit: UNITS.PCS,
        unitPrice: 25,
        isDefault: false,
    },
    {
        name: "Stain Removal Treatment",
        description: "Targeted pre-treatment for tough stains.",
        unit: UNITS.PCS,
        unitPrice: 50,
        isDefault: false,
    },
    {
        name: "Express Processing",
        description: "Priority handling for faster turnaround.",
        unit: UNITS.PCS,
        unitPrice: 80,
        isDefault: false,
    },
    {
        name: "Extra Rinse Cycle",
        description: "Additional rinse for sensitive skin and residue removal.",
        unit: UNITS.PCS,
        unitPrice: 20,
        isDefault: false,
    },
    {
        name: "Garment Folding & Packaging",
        description: "Neatly folded and packed items, ready to store.",
        unit: UNITS.PCS,
        unitPrice: 30,
        isDefault: false,
    },
    {
        name: "Fragrance Finish",
        description: "Light long-lasting fragrance finish.",
        unit: UNITS.PCS,
        unitPrice: 15,
        isDefault: false,
    },
];
async function main() {
    await connectDB();
    try {
        let category = await InventoryCategory.findOne({ name: ADDONS_CATEGORY });
        if (!category) {
            category = await InventoryCategory.create({
                name: ADDONS_CATEGORY,
                description: "Optional extra add-on services for laundry orders.",
                isActive: true,
            });
            console.log(`Created inventory category: ${ADDONS_CATEGORY}`);
        }
        else {
            console.log(`Inventory category already exists: ${ADDONS_CATEGORY}`);
        }
        let supplier = await Supplier.findOne({ email: "addons-supplier@system.local" });
        if (!supplier) {
            supplier = await Supplier.create({
                name: "System Add-ons Supplier",
                contactPerson: "System",
                email: "addons-supplier@system.local",
                phone: "0000000000",
                address: "System",
                category: "Add-ons",
                status: "ACTIVE",
            });
            console.log(`Created supplier: ${supplier.name}`);
        }
        else {
            console.log(`Supplier already exists: ${supplier.name}`);
        }
        let created = 0;
        let updated = 0;
        for (const item of addonItems) {
            const existing = await Inventory.findOne({
                name: item.name,
                categoryName: ADDONS_CATEGORY,
            });
            if (existing) {
                await Inventory.findByIdAndUpdate(existing._id, {
                    $set: {
                        ...item,
                        categoryName: ADDONS_CATEGORY,
                        supplierId: supplier._id,
                        isActive: true,
                        qtyInStock: existing.qtyInStock ?? 999,
                        reorderLevel: existing.reorderLevel ?? 0,
                        batchQty: existing.batchQty ?? 1,
                        isOrderPending: false,
                    },
                });
                updated += 1;
                console.log(`Updated: ${item.name}`);
            }
            else {
                await Inventory.create({
                    ...item,
                    categoryName: ADDONS_CATEGORY,
                    supplierId: supplier._id,
                    isActive: true,
                    qtyInStock: 999,
                    reorderLevel: 0,
                    batchQty: 1,
                    isOrderPending: false,
                    sku: null,
                    imageUrl: null,
                });
                created += 1;
                console.log(`Created: ${item.name}`);
            }
        }
        console.log(`\nDone. Created: ${created}, Updated: ${updated}`);
        console.log(`Add-ons category "${ADDONS_CATEGORY}" is ready for /inventory/category/${ADDONS_CATEGORY}`);
    }
    finally {
        await mongoose.connection.close();
    }
}
main().catch(async (err) => {
    console.error("Failed to seed add-ons:", err);
    try {
        await mongoose.connection.close();
    }
    catch { }
    process.exit(1);
});
