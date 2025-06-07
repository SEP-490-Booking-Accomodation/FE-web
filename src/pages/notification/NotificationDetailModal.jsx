import { useEffect } from "react";
import { Modal, Typography, Divider, Button, Spin, Tag, Badge } from "antd";
import dayjs from "dayjs";
import { useUpdateNotificationMutation } from "../../redux/services/notificationApi";
import { useNavigate, useParams } from "react-router-dom";

const { Title, Text } = Typography;

const NotificationDetailModal = ({ visible, notification, onClose, loading, onUpdate  }) => {
  const [updateNotification] = useUpdateNotificationMutation();
  const navigate = useNavigate();
  const { id } = useParams(); 
  const userId = localStorage.getItem("user_id"); 

  useEffect(() => {
    const markAsRead = async () => {
      if (visible && notification?.isRead === false) {
        try {
          await updateNotification({
            id: notification._id,
            isRead: true
          });
          onUpdate?.();
        } catch (error) {
          console.error("Update failed:", error);
        }
      }
    };
  
    markAsRead();
  }, [visible, notification]);

  const formatDate = (dateString) => {
    try {
      return dayjs(dateString, 'DD/MM/YYYY HH:mm:ss').format('HH:mm DD/MM/YYYY');
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  const handleNavigate = () => {
    if (!notification) return;

    onClose();

    const ownerId = id || userId;
    if (!ownerId) {
      console.error("Owner ID not found");
      return;
    }

    switch (notification.type) {
      case 6:
        navigate(`/owner/${ownerId}/chat`);
        break;
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        navigate(`/owner/${ownerId}/booking`);
        break;
      default:
        break;
    }
  };

  if (!visible) return null;

  return (
    <Modal
      title="Chi tiết thông báo"
      visible={visible}
      onCancel={onClose}
      footer={[
        <Button key="navigate" type="primary" onClick={handleNavigate} style={{ marginRight: 8 }}>
          {notification?.type === 6 ? 'Đi đến tin nhắn' : 'Đi đến đặt phòng'}
        </Button>,
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
      ]}
      width={600}
      centered
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <Spin size="large" />
        </div>
      ) : notification ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4} style={{ marginBottom: 0, color: notification.isRead ? '#666' : '#1890ff' }}>
              {notification.title}
            </Title>
            <Tag color={notification.isRead ? "green" : "red"}>
              {notification.isRead ? "Đã đọc" : "Chưa đọc"}
            </Tag>
          </div>

          <Divider style={{ margin: '16px 0' }} />

          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Nội dung:</Text>
            <Text style={{ whiteSpace: 'pre-line' }}>{notification.content}</Text>
          </div>

          {/* {notification.bookingId && (
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>Mã Booking:</Text>
              <Text code>{notification.bookingId}</Text>
            </div>
          )} */}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text type="secondary">Thời gian: {formatDate(notification.createdAt)}</Text>
            {/* {!notification.isRead && <Badge status="processing" text="Mới" />} */}
          </div>
        </div>
      ) : (
        <Text>Không tìm thấy thông tin thông báo</Text>
      )}
    </Modal>
  );
};

export default NotificationDetailModal;