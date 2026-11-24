import ApiError from "../core/apiError.js";
import { ROLES } from "../core/constants.js";
import User from "../database/models/User.js";
import { runInTenantContext } from "../database/tenantContext.js";
const enterShopDatabase = async (req, res, next) => {
    try {
        const authRequest = req;
        const authenticatedUser = authRequest.user;
        const requestedShopId = req.header("x-shop-id");
        let shopOwnerId;
        if (authenticatedUser?.role === ROLES.ADMIN) {
            if (requestedShopId && requestedShopId !== authenticatedUser.id) {
                throw new ApiError(403, "You cannot access another shop");
            }
            shopOwnerId = authenticatedUser.id;
        }
        else if (authenticatedUser?.role === ROLES.STAFF) {
            const staff = await User.findById(authenticatedUser.id).select("shopOwnerId");
            shopOwnerId = staff?.shopOwnerId?.toString();
            if (!shopOwnerId || (requestedShopId && requestedShopId !== shopOwnerId)) {
                throw new ApiError(403, "Staff account is not assigned to this shop");
            }
        }
        else {
            shopOwnerId = requestedShopId;
            if (!shopOwnerId) {
                throw new ApiError(400, "Select a shop to continue");
            }
        }
        const shopOwner = await User.findOne({
            _id: shopOwnerId,
            role: ROLES.ADMIN,
            isActive: true,
        }).select("_id");
        if (!shopOwner) {
            throw new ApiError(404, "Laundry shop not found");
        }
        runInTenantContext(shopOwner._id.toString(), () => next());
    }
    catch (error) {
        next(error);
    }
};
export default enterShopDatabase;
