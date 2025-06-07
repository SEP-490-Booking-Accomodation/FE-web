import { useState, useEffect, useRef } from "react";
import { Button, Typography, Spin, Badge } from "antd";
import { BellOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { Flex } from "antd";
import dayjs from "dayjs";
import styleScroll from "./Notification.module.scss";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { 
  useGetNotificationsByUserQuery, 
  useGetNotificationByIdQuery,
  useUpdateNotificationMutation 
} from "../../../redux/services/notificationApi";
import NotificationDetailModal from "../../../pages/notification/NotificationDetailModal";

const { Title, Paragraph } = Typography;
const ITEMS_PER_PAGE = 8;

export default function NotificationPanel({ onClose }) {
  const userId = useSelector((state) => state.auth.userId);
  const { data: response, isLoading, refetch } = useGetNotificationsByUserQuery(userId);
  const notifications = response?.data || [];
  
  const [filter, setFilter] = useState("all");
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const [selectedNotificationId, setSelectedNotificationId] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [updateNotification] = useUpdateNotificationMutation();
  const [showPanel, setShowPanel] = useState(true);
  const panelRef = useRef(null);
  const filterButtonsRef = useRef([]); // Thêm ref cho các nút filter
  const navigate = useNavigate();

  const { data: notificationDetail, isFetching: isDetailLoading } = 
    useGetNotificationByIdQuery(selectedNotificationId, {
      skip: !selectedNotificationId
    });

  useEffect(() => {
    if (notificationDetail) {
      setSelectedNotification(notificationDetail.data || notificationDetail);
    } else if (selectedNotificationId) {
      const notificationFromList = notifications.find(n => n._id === selectedNotificationId);
      setSelectedNotification(notificationFromList);
    }
  }, [notificationDetail, selectedNotificationId, notifications]);

  useEffect(() => {
    if (selectedNotificationId) {
      setShowPanel(false);
    } else {
      setShowPanel(true);
    }
  }, [selectedNotificationId]);

  const filteredNotifications = notifications
    .filter((notification) => filter === "all" || !notification.isRead)
    .sort((a, b) => dayjs(b.createdAt, 'DD/MM/YYYY HH:mm:ss') - dayjs(a.createdAt, 'DD/MM/YYYY HH:mm:ss'))
    .slice(0, displayCount);

  const hasMore = displayCount < notifications.length;

  const handleLoadMore = () => {
    onClose();
    navigate("/notification");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Kiểm tra xem click có phải trên panel hoặc các nút filter không
      const isFilterButton = filterButtonsRef.current.some(
        button => button && button.contains(event.target)
      );
      
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target) &&
        !event.target.closest(".ant-btn") &&
        !isFilterButton &&
        showPanel 
      ) {
        onClose();
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [onClose, showPanel]);

  const handleViewAllNotifications = () => {
    onClose();
    navigate("/notification");
  };

  const formatDate = (dateString) => {
    return dayjs(dateString, 'DD/MM/YYYY HH:mm:ss').format('DD/MM/YYYY HH:mm');
  };

  const handleNotificationClick = async (notificationId) => {
    setSelectedNotificationId(notificationId);
    try {
      await updateNotification({
        id: notificationId,
        data: { isRead: true }
      });
      refetch();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleCloseModal = () => {
    setSelectedNotificationId(null);
    setSelectedNotification(null);
    onClose(); 
  };

  // Hàm xử lý filter với ngăn sự kiện lan truyền
  const handleFilterClick = (type, e) => {
    e.stopPropagation(); // Ngăn sự kiện lan truyền
    setFilter(type);
  };

  if (isLoading) return <Spin size="small" />;

  return (
    <>
      {showPanel && (
        <div
          ref={panelRef}
          style={{
            position: "absolute",
            top: "60px",
            right: 0,
            height: "80vh",
            width: "400px",
            backgroundColor: "#fff",
            boxShadow: "0 2px 20px rgba(0, 0, 0, 0.15)",
            borderRadius: "12px",
            zIndex: 9999,
            padding: "16px",
            border: "1px solid #e8e8e8"
          }}
        >
          <div
            className={styleScroll.scrollContainer}
            style={{ height: "100%", background: "#fff", padding: "0 8px" }}
          >
            <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
              <Title level={4} style={{ margin: 0, color: "#1a1a1a" }}>
                Thông báo
              </Title>
              <Button
                type="link"
                onClick={handleViewAllNotifications}
                style={{
                  fontWeight: "500",
                  color: "#1677ff",
                  padding: 0
                }}
              >
                Xem tất cả
              </Button>
            </Flex>
            <Flex gap={12} style={{ marginBottom: 16 }}>
              <Button
                ref={el => filterButtonsRef.current[0] = el}
                type={filter === "all" ? "primary" : "default"}
                onClick={(e) => handleFilterClick("all", e)}
                style={{ 
                  borderRadius: 8,
                  fontWeight: 500,
                  transition: "all 0.3s ease",
                  background: filter === "all" ? "#1677ff" : "#f5f5f5",
                  border: "none"
                }}
              >
                Tất cả
              </Button>
              <Button
                ref={el => filterButtonsRef.current[1] = el}
                type={filter === "unread" ? "primary" : "default"}
                style={{ 
                  borderRadius: 8,
                  fontWeight: 500,
                  transition: "all 0.3s ease",
                  background: filter === "unread" ? "#1677ff" : "#f5f5f5",
                  border: "none"
                }}
                onClick={(e) => handleFilterClick("unread", e)}
              >
                Chưa đọc
              </Button>
            </Flex>

            {filteredNotifications.length > 0 ? (
              <>
                {filteredNotifications.map((item) => (
                  <div 
                    key={item._id} 
                    style={{ 
                      padding: "12px",
                      cursor: "pointer",
                      borderRadius: "8px",
                      marginBottom: "8px",
                      border: "1px solid transparent",
                      transition: "all 0.3s ease"
                    }}
                    onClick={() => handleNotificationClick(item._id)}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = "#f5f5f5";
                      e.currentTarget.style.borderColor = "#e8e8e8";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.borderColor = "transparent";
                    }}
                  >
                    <Flex align="start" gap={12}>
                      <Badge dot={!item.isRead} offset={[-6, 6]}>
                        <div style={{ 
                          padding: "10px",
                          background: item.isRead ? "#f0f0f0" : "#fff0f0",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}>
                          {item.isRead ? (
                            <CheckCircleOutlined
                              style={{
                                color: "#52c41a",
                                fontSize: "20px",
                              }}
                            />
                          ) : (
                            <BellOutlined
                              style={{
                                color: "#ff4d4f",
                                fontSize: "20px",
                              }}
                            />
                          )}
                        </div>
                      </Badge>

                      <div style={{ flex: 1 }}>
                        <Flex align="center" justify="space-between" style={{ marginBottom: 4 }}>
                          <Typography.Text
                            strong
                            style={{ 
                              fontSize: "14px",
                              color: !item.isRead ? "#1a1a1a" : "#595959"
                            }}
                          >
                            {item.title}
                          </Typography.Text>
                          <Typography.Text style={{ 
                            color: "#8c8c8c",
                            fontSize: "12px",
                            fontWeight: 500
                          }}>
                            {formatDate(item.createdAt)}
                          </Typography.Text>
                        </Flex>
                        <Typography.Paragraph
                          style={{
                            fontSize: "14px",
                            color: "#595959",
                            marginBottom: 0,
                            lineHeight: "1.5"
                          }}
                        >
                          {item.content.length > 50
                            ? `${item.content.slice(0, 50)}...`
                            : item.content}
                        </Typography.Paragraph>
                      </div>
                    </Flex>
                  </div>
                ))}
                {hasMore && (
                  <Button
                    type="default"
                    onClick={handleLoadMore}
                    style={{ 
                      width: "100%",
                      marginTop: 16,
                      borderRadius: 8,
                      height: 40,
                      fontWeight: 500,
                      background: "#f5f5f5",
                      border: "none"
                    }}
                  >
                    Xem thêm
                  </Button>
                )}
              </>
            ) : (
              <div style={{
                padding: "60px 20px",
                textAlign: "center",
                color: "#8c8c8c",
                fontSize: "14px",
                background: "#fafafa",
                borderRadius: 8,
                marginTop: 20
              }}>
                Không có thông báo nào
              </div>
            )}
          </div>
        </div>
      )}

      <NotificationDetailModal
        visible={!!selectedNotificationId}
        notification={selectedNotification}
        onClose={handleCloseModal}
        loading={isDetailLoading}
        onUpdate={refetch}
      />
    </>
  );
}