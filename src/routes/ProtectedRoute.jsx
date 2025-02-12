import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

export const NotAuthRoute = ({ children }) => {
  const { isAuthenticated, role } = useSelector((state) => state.auth);
  // const location = useLocation();
  // console.log("Auth Check:", {
  //   isAuthenticated,
  //   role,
  //   path: location.pathname,
  // });

  if (isAuthenticated) {
    if (role == "Staff") {
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  return children;
};
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  // const location = useLocation();

  // console.log("Auth Check:", {
  //   isAuthenticated,
  //   role,
  //   path: location.pathname,
  // });

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export const AdminRoute = ({ children }) => {
  const { isAuthenticated, role } = useSelector((state) => state.auth);
  // const location = useLocation();

  // console.log("Admin Check:", {
  //   isAuthenticated,
  //   role,
  //   path: location.pathname,
  // });

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role !== "Staff") {
    return <Navigate to="/404" replace />;
  }

  return children;
};
export const CustomerRoute = ({ children }) => {
  const { isAuthenticated, role } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role !== "Staff") {
    return <Navigate to="/404" replace />;
  }

  return children;
};
export const OwnerRoute = ({ children }) => {
  const { isAuthenticated, role } = useSelector((state) => state.auth);

  // const location = useLocation();

  // console.log("Owner Check:", {
  //   isAuthenticated,
  //   role,
  //   path: location.pathname,
  // });
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role !== "Owner" && role !== "Staff") {
    return <Navigate to="/404" replace />;
  }

  return children;
};
