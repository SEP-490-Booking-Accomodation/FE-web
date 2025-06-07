import { useParams } from "react-router-dom";
import { useGetOwnerDetailByUserIdQuery } from "../../../../../redux/services/ownerApi";
import RentalForm from "./RentalForm";
import { useSelector } from "react-redux";
import { Card, Typography } from "antd";

const { Title } = Typography;

export default function RentalCreate() {
  const id = useSelector((state) => state.auth.userId);

  const {
    data: ownerDetailData,
    isLoading: ownerDetailIsLoading,
    isError: ownerDetailIsError,
    refetch,
  } = useGetOwnerDetailByUserIdQuery(id);
  const ownerId = ownerDetailData?.id;

  return (
    <div style={{ 
      padding: "24px",
      maxWidth: "1200px",
      margin: "0 auto",
      minHeight: "calc(100vh - 64px)",
      background: "#f5f5f5"
    }}>
      <Card bordered={false} style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <Title level={2} style={{ marginBottom: "24px", color: "#1890ff" }}>
          Tạo Địa Điểm Cho Thuê Mới
        </Title>
        <RentalForm refetch={refetch} ownerId={ownerId} />
      </Card>
    </div>
  );
}
