import { Button, Modal, Spin } from "antd";
import { Image } from "antd";
import styles from "./AccomodationDetail.module.scss";
import Tag from "../../components/Tag";

export default function AccommodationDetail(props) {
  const { visible, onCancel, loading, accommodationData, onEdit, canEdit } =
    props;

  // console.log("AccommodationDetail received data:", accommodationData);

  if (!accommodationData && !loading) {
    // console.log("No data and not loading, returning null");
    return null;
  }

  const data =
    accommodationData?.data?.[0] ||
    accommodationData?.data ||
    accommodationData;

  console.log("Normalized data for display:", data);

  const roomName = data?.accommodationTypeId?.name || "";
  const roomNo = data?.roomNo || "";
  const status = data?.status || 0;
  const description = data?.description || "";
  const maxPeople = data?.accommodationTypeId?.maxPeopleNumber || 0;
  const typeRoom = data?.accommodationTypeId?.name || "";
  const price = data?.accommodationTypeId?.basePrice?.toLocaleString() || "0";
  const overPrice =
    data?.accommodationTypeId?.overtimeHourlyPrice?.toLocaleString() || "0";
  const locationName = data?.rentalLocationId?.name || "";
  const locationAddress = data?.rentalLocationId?.address || "";
  const locationDescription = data?.rentalLocationId?.description || "";

  const amenities =
    data?.accommodationTypeId?.serviceIds?.map((service) => service.name) || [];

  const images = data?.image?.filter((img) => img && img.trim() !== "") || [];
  const displayImages = images.length > 0 ? images : Array(1).fill("");

  const handleEditNavigate = () => {
    if (onEdit) {
      onEdit(data);
    }
  };

  const getStatusDisplay = (statusCode) => {
    switch (statusCode) {
      case 1:
        return { text: "Có sẵn", color: "#52c41a", bgColor: "#f6ffed" };
      case 2:
        return { text: "Đã đặt", color: "#1890ff", bgColor: "#e6f7ff" };
      case 3:
        return { text: "Đang dọn dẹp", color: "#faad14", bgColor: "#fffbe6" };
      case 4:
        return { text: "Đang chuẩn bị", color: "#722ed1", bgColor: "#f9f0ff" };
      case 5:
        return { text: "Bảo trì", color: "#ff4d4f", bgColor: "#fff1f0" };
      case 6:
        return { text: "Đóng cửa", color: "#595959", bgColor: "#fafafa" };
      case 7:
        return { text: "Đang sử dụng", color: "#13c2c2", bgColor: "#e6fffb" };
      default:
        return { text: "Không xác định", color: "#d9d9d9", bgColor: "#fafafa" };
    }
  };

  const statusDisplay = getStatusDisplay(status);

  const modalContent = (
    <div className={styles.content}>
      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "200px",
          }}
        >
          <Spin size="large" />
        </div>
      ) : (
        <>
          <div className={styles.header}>
            <h2>{roomName}</h2>
            <div>
              <Tag
                text={statusDisplay.text}
                textColor={statusDisplay.color}
                textBackground={statusDisplay.bgColor}
              />
            </div>
          </div>
          <div className={styles.body}>
            <div className={styles.description}>
              <p>{description}</p>

              {locationName && (
                <div style={{ display: "flex", marginBottom: "8px" }}>
                  <h4 style={{ marginRight: "8px", minWidth: "150px" }}>
                    Địa điểm:{" "}
                  </h4>
                  <span>{locationName}</span>
                </div>
              )}

              {locationAddress && (
                <div style={{ display: "flex", marginBottom: "8px" }}>
                  <h4 style={{ marginRight: "8px", minWidth: "150px" }}>
                    Địa chỉ:{" "}
                  </h4>
                  <span>{locationAddress}</span>
                </div>
              )}

              <div style={{ display: "flex", marginBottom: "8px" }}>
                <h4 style={{ marginRight: "8px", minWidth: "150px" }}>
                  Số phòng:{" "}
                </h4>
                <span>{roomNo}</span>
              </div>

              <div style={{ display: "flex", marginBottom: "8px" }}>
                <h4 style={{ marginRight: "8px", minWidth: "150px" }}>
                  Số người ở tối đa:{" "}
                </h4>
                <span>{maxPeople} người</span>
              </div>

              <div style={{ display: "flex", marginBottom: "8px" }}>
                <h4 style={{ marginRight: "8px", minWidth: "150px" }}>
                  Loại phòng:{" "}
                </h4>
                <span>{typeRoom}</span>
              </div>

              <div style={{ display: "flex", marginBottom: "8px" }}>
                <h4 style={{ marginRight: "8px", minWidth: "150px" }}>
                  Giá tiền:{" "}
                </h4>
                <span>{price} VND / 1 giờ</span>
              </div>

              <div style={{ display: "flex", marginBottom: "8px" }}>
                <h4 style={{ marginRight: "8px", minWidth: "150px" }}>
                  Giá quá hạn:{" "}
                </h4>
                <span>{overPrice} VND / 1 giờ</span>
              </div>
            </div>

            <div className={styles.contentAmenity}>
              <h3 style={{ marginBottom: 10 }}>Tiện nghi, dịch vụ nổi bật: </h3>
              <div className={styles.amenities}>
                {amenities.length > 0 ? (
                  amenities.map((amenity, index) => (
                    <Tag
                      key={index}
                      text={amenity}
                      textColor={"#458fd2"}
                      textBackground={"#e9f1fd"}
                    />
                  ))
                ) : (
                  <span>Không có dịch vụ</span>
                )}
              </div>
            </div>

            {locationDescription && (
              <div className={styles.locationDescription}>
                <h3 style={{ marginBottom: 10 }}>Mô tả địa điểm: </h3>
                <p>{locationDescription}</p>
              </div>
            )}
          </div>

          {displayImages.length > 0 && (
            <div className={styles.imagesGrid}>
              <h3>Hình ảnh phòng:</h3>
              <Image.PreviewGroup>
                {displayImages.slice(0, 5).map((image, index) => (
                  <div key={index} className={styles.imageContainer}>
                    <Image
                      src={
                        image || "https://via.placeholder.com/150?text=No+Image"
                      }
                      alt={`Room view ${index + 1}`}
                      fallback="https://via.placeholder.com/150?text=Error"
                    />
                    {index === 4 && displayImages.length > 5 && (
                      <div className={styles.remainingOverlay}>
                        <span>+{displayImages.length - 5}</span>
                      </div>
                    )}
                  </div>
                ))}

                {displayImages.length > 5 && (
                  <div style={{ display: "none" }}>
                    {displayImages.slice(5).map((image, index) => (
                      <Image
                        key={`hidden-${index}`}
                        src={
                          image ||
                          "https://via.placeholder.com/150?text=No+Image"
                        }
                        alt={`Room view ${index + 6}`}
                        fallback="https://via.placeholder.com/150?text=Error"
                      />
                    ))}
                  </div>
                )}
              </Image.PreviewGroup>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <Modal
      title="Chi tiết phòng"
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button key="back" onClick={onCancel}>
          Đóng
        </Button>,
        canEdit && (
          <Button
            key="edit"
            onClick={handleEditNavigate}
            style={{
              backgroundColor: "#177EE3",
              color: "#fff",
            }}
          >
            Chỉnh sửa
          </Button>
        ),
      ]}
    >
      {modalContent}
    </Modal>
  );
}
