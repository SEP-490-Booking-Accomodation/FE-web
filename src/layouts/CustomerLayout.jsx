import { Outlet, useNavigate, useLocation, useParams } from "react-router-dom";
import {
  BarChartOutlined,
  HomeOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Layout, Menu } from "antd";
import HeaderSimple from "../components/layouts/header/HeaderSimple";

const { Header, Content } = Layout;

const CustomerLayout = () => {
  const navigate = useNavigate(); // Để điều hướng khi người dùng click Menu
  const location = useLocation(); // Để lấy path hiện tại

  const { id } = useParams(); // Lấy ID từ URL

  const menuItems = [
    { key: `/customer/${id}`, icon: <UserOutlined />, label: "Thông tin" },
    {
      key: `/customer/${id}/booking`,
      icon: <HomeOutlined />,
      label: "Đặt phòng",
    },
    {
      key: `/customer/${id}/setting`,
      icon: <BarChartOutlined />,
      label: "Cài đặt",
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Header với Navbar */}
      <Header
        style={{
          background: "#ffffff",
          padding: "0 16px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <HeaderSimple />
      </Header>
      {/* Content */}
      <Layout
        style={{
          background: "#eef0f2",
          flex: 1,
        }}
      >
        <Content
          style={{
            background: "#fff",
            flex: 1,

            margin: "24px",
            borderRadius: 10,
          }}
        >
          <Menu
            theme="light"
            mode="horizontal"
            selectedKeys={[location.pathname]} // Đặt key dựa trên path hiện tại
            onClick={({ key }) => navigate(key)} // Điều hướng khi click menu
            items={menuItems}
            style={{
              // flex: 1,
              // justifyContent: "center",
              background: "none",
            }}
          />
          <Layout
            style={{
              background: "#fff",
              flex: 1,
              padding: "10px 24px",
            }}
          >
            <Outlet />
          </Layout>
        </Content>
      </Layout>
    </Layout>
  );
};

export default CustomerLayout;
