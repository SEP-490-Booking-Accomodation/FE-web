/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react";
import { Navigate } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import OwnerLayout from "../layouts/OwnerLayout";
import Signup from "../pages/auth/signup/SignUp";
import VerifyCode from "../pages/auth/verifyCode/VerifyCode";
import ForgotPassword from "../pages/auth/forgotPassword/ForgotPassword";
import SetNewPassword from "../pages/auth/setNewPassword/SetNewPassword";
import SimpleLayout from "../layouts/SimpleLayout.jsx";

// Lazy load pages
const Login = lazy(() => import("../pages/auth/login/Login"));
const Dashboard = lazy(() => import("../pages/dashboard/Dashboard"));
const Account = lazy(() => import("../pages/account/Account"));
const Coupon = lazy(() => import("../pages/coupon/Coupon"));
const Booking = lazy(() => import("../pages/booking/Booking"));
const Notification = lazy(() =>
  import("../pages/notification/Notification.jsx")
);
const Owner = lazy(() => import("../pages/owner/Owner"));

// owner pages
const TypeRoomOwner = lazy(() =>
  import("../pages/owner/childPage/TypeRoom/TypeRoom.jsx")
);
const BookingOwner = lazy(() =>
  import("../pages/owner/childPage/Booking/Booking.jsx")
);
const InformationOwner = lazy(() =>
  import("../pages/owner/childPage/Information/Information.jsx")
);
const OverviewOwner = lazy(() =>
  import("../pages/owner/childPage/Overview/Overview.jsx")
);
// const PlaceOwner = lazy(() =>
//   import("../pages/owner/childPage/accomodation/Accomodation.jsx")
// );

const RentalLocationOwner = lazy(() =>
  import("../pages/owner/childPage/rentalLocation/RentalLocation.jsx")
);
const RentalLocationDetail = lazy(() =>
  import(
    "../pages/owner/childPage/rentalLocation/detail/RentalLocationDetail.jsx"
  )
);
const RentalCreate = lazy(() =>
  import("../pages/owner/childPage/rentalLocation/create/RentalCreate.jsx")
);
const AccommodationDetail = lazy(() =>
  import(
    "../pages/owner/childPage/accomodation/childPage/AccomodationDetail/AccomodationDetail.jsx"
  )
);

const AccommodationEdit = lazy(() =>
  import(
    "../pages/owner/childPage/accomodation/childPage/AccomodationEdit/AccomodationEdit.jsx"
  )
);

const AccommodationCreate = lazy(() =>
  import(
    "../pages/owner/childPage/accomodation/childPage/AccomodationCreate/AccomodationCreate.jsx"
  )
);

const PolicyOwner = lazy(() =>
  import("../pages/owner/childPage/Policy/Policy.jsx")
);
const SettingOwner = lazy(() =>
  import("../pages/owner/childPage/Setting/Setting.jsx")
);

const CustomerInformation = lazy(() =>
  import("../pages/customer/information/Customer.jsx")
);

const CustomerBookingHistory = lazy(() =>
  import("../pages/customer/historyBooking/Booking.jsx")
);
const CustomerSetting = lazy(() =>
  import("../pages/customer/setting/Setting.jsx")
);
const PolicyApp = lazy(() => import("../pages/policyApp/PolicyApp"));
const RentalLocation = lazy(() =>
  import("../pages/rentalLocation/RentalLocation")
);
const Messages = lazy(() => import("../pages/messeges/Messeges.jsx"));

const Report = lazy(() => import("../pages/report/Report"));

const Transaction = lazy(() => import("../pages/transaction/Transaction"));
const NotFound = lazy(() => import("../pages/error/NotFound"));
import {
  ProtectedRoute,
  AdminRoute,
  OwnerRoute,
  NotAuthRoute,
} from "./ProtectedRoute";
import NotAuthLayout from "../layouts/NotAuthLayout.jsx";
import CustomerLayout from "../layouts/CustomerLayout.jsx";

// Define routes
export const routes = [
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },

  {
    path: "/",
    element: (
      <NotAuthRoute>
        <NotAuthLayout />
      </NotAuthRoute>
    ),
    children: [
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/signup",
        element: <Signup />,
      },
      {
        path: "/verifycode",
        element: <VerifyCode />,
      },
      {
        path: "/forgot-password",
        element: <ForgotPassword />,
      },
      {
        path: "/set-new-password",
        element: <SetNewPassword />,
      },
    ],
  },
  // {
  //   path: "/customer",
  //   element: (
  //     <CustomerRoute>
  //       <CustomerLayout />
  //     </CustomerRoute>
  //   ),
  //   children: [{ path: "/", element: <CustomerInformation /> }],
  // },
  {
    path: "/admin",
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      { path: "", element: <Navigate to="/admin/dashboard" replace /> }, // Chuyển hướng từ /admin sang /admin/dashboard
      { path: "dashboard", element: <Dashboard /> },
      { path: "account", element: <Account /> },
      { path: "coupon", element: <Coupon /> },
      { path: "booking", element: <Booking /> },
      { path: "transaction", element: <Transaction /> },
      { path: "rental", element: <RentalLocation /> },
      { path: "policy", element: <PolicyApp /> },
      { path: "report", element: <Report /> },
    ],
  },
  {
    path: "/",
    element: (
      <AdminRoute>
        <CustomerLayout />
      </AdminRoute>
    ),
    children: [
      { path: "customer/:id", element: <CustomerInformation /> },
      { path: "customer/:id/booking", element: <CustomerBookingHistory /> },
      { path: "customer/:id/setting", element: <CustomerSetting /> },
    ],
  },
  {
    path: "/owner",
    element: (
      <OwnerRoute>
        <OwnerLayout />
      </OwnerRoute>
    ),
    children: [
      { path: "", element: <Navigate to="/owner/dashboard" replace /> }, // Chuyển hướng từ /admin sang /admin/dashboard
      { path: "owners", element: <Owner /> },
      { path: "dashboard", element: <OverviewOwner /> },
      { path: "booking", element: <BookingOwner /> },
      { path: "information", element: <InformationOwner /> },
      { path: "rental-location", element: <RentalLocationOwner /> },
      // { path: "rental-location/:id", element: <RentalLocationDetail /> },

      { path: "type-room", element: <TypeRoomOwner /> },
      { path: "policy", element: <PolicyOwner /> },
      { path: "setting", element: <SettingOwner /> },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <SimpleLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "/rental-location/:id",
        element: <RentalLocationDetail />, // Component này không nằm trong OwnerLayout
      },
      {
        path: "/rental-location/create",
        element: <RentalCreate />, // Component này không nằm trong OwnerLayout
      },
      {
        path: "accomodation/:id",
        element: <AccommodationDetail />,
      },
      {
        path: "accomodation/edit/:id",
        element: <AccommodationEdit />,
      },
      {
        path: "accomodation/create",
        element: <AccommodationCreate />,
      },
      { path: "notification", element: <Notification /> },
      { path: "messages", element: <Messages /> },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/404" replace />,
  },
  {
    path: "/404",
    element: <NotFound />,
  },
];
