import { createBrowserRouter } from "react-router-dom";

import NotFoundPage from "../../pages/NotFoundPage";
import UnauthorizedPage from "../../pages/UnauthorizedPage";
import LoginPage from "../../pages/LoginPage";
import CustomerLoginForm from "../../features/auth/components/CustomerLoginForm";
import RegistrationForm from "../../features/auth/components/RegistrationForm";
import CustomerAccountPage from "../../features/auth/pages/CustomerAccountPage";

import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

import { ADMIN_PORTAL_ROLES } from "../../types/enums";

import AdminLayout from "../../layouts/AdminLayout";

import DashboardPage from "../../features/dashboard/pages/DashboardPage";
import UserListPage from "../../features/users/pages/UserListPage";
import OrderListPage from "../../features/orders/pages/OrderListPage";
import PaymentDashboard from "../../features/payments/pages/PaymentDashboard";
import CODPage from "../../features/payments/pages/CODPage";
import ServicesPage from "../../features/services/pages/ServicesPage";
import CategoryPage from "../../features/category/pages/CategoryPage";
import InventoryPage from "../../features/inventory/pages/InventoryPage";
import SupplierPage from "../../features/suppliers/pages/SupplierPage";
import StatusUpdatePage from "../../features/status-update/pages/StatusUpdatePage";
import VouchersPage from "../../features/vouchers/pages/VouchersPage";
import FeedbackPage from "../../features/feedback/pages/FeedbackPage";
import PickupDeliveryPage from "../../features/pickupDelivery/pages/PickupDeliveryPage";
import ProfilePage from "../../features/profile/pages/ProfilePage";

import LandingPage from "../../features/public-site/pages/LandingPage";

export const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/owner/register", element: <RegistrationForm owner /> },
  { path: "/customer/login", element: <CustomerLoginForm /> },
  { path: "/customer/register", element: <RegistrationForm /> },
  { path: "/unauthorized", element: <UnauthorizedPage /> },

  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <RoleRoute allowed={["CUSTOMER"]} />,
        children: [{ path: "/customer/account", element: <CustomerAccountPage /> }],
      },
      {
        path: "/admin",
        element: <AdminLayout />,
        children: [
          {
            element: <RoleRoute allowed={ADMIN_PORTAL_ROLES} />,
            children: [
              { index: true, element: <DashboardPage /> },

              { path: "users", element: <UserListPage /> },
              { path: "orders", element: <OrderListPage /> },
              {
                path: "payments",
                children: [
                  { index: true, element: <PaymentDashboard /> },
                  { path: "cod", element: <CODPage /> }
                ]
              },
              { path: "services", element: <ServicesPage /> },
              { path: "categories", element: <CategoryPage /> },
              { path: "inventory", element: <InventoryPage /> },
              { path: "suppliers", element: <SupplierPage /> },
              { path: "status-update", element: <StatusUpdatePage /> },
              { path: "vouchers", element: <VouchersPage /> },
              { path: "feedbacks", element: <FeedbackPage /> },
              { path: "deliveries", element: <PickupDeliveryPage /> },
              { path: "profile", element: <ProfilePage /> },
            ],
          },
        ],
      },
    ],
  },

  { path: "*", element: <NotFoundPage /> },
]);
