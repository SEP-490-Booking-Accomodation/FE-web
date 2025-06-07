"use client"

import { useState } from "react"
import { Modal } from "antd"
import {
  UserOutlined,
  HomeOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons"
import styles from "./BookingDetailModal.module.scss"

export default function BookingDetailModal({ isVisible, onClose, bookingData }) {
  const [loading, setLoading] = useState(false)

  // Format date for display (DD/MM/YYYY)
  const formatDate = (dateTimeStr) => {
    if (!dateTimeStr) return "N/A"

    // Handle different date formats
    const datePart = dateTimeStr.split("T")[0] || dateTimeStr.split(" ")[0]
    if (!datePart) return "N/A"

    // If format is already DD/MM/YYYY
    if (datePart.includes("/")) {
      return datePart
    }

    // If format is YYYY-MM-DD
    const [year, month, day] = datePart.split("-")
    if (year && month && day) {
      return `${day}/${month}/${year}`
    }

    return datePart
  }

  // Format time for display (HH:MM)
  const formatTime = (dateTimeStr) => {
    if (!dateTimeStr) return "N/A"

    // Try to split time manually
    const timePart = dateTimeStr.split("T")[1] || dateTimeStr.split(" ")[1] || dateTimeStr
    if (!timePart) return "N/A"

    const [hour, minute] = timePart.split(":")
    if (hour === undefined || minute === undefined) return "N/A"

    // Return as HH:MM
    return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`
  }

  // Get status information
  const getStatusInfo = (status) => {
    switch (status) {
      case "pending":
        return { label: "Chờ xác nhận", className: styles.statusPending, icon: <ClockCircleOutlined /> }
      case "complete":
        return { label: "Hoàn thành", className: styles.statusComplete, icon: <CheckCircleOutlined /> }
      case "cancel":
        return { label: "Đã hủy", className: styles.statusCancel, icon: <CloseCircleOutlined /> }
      default:
        return { label: "Đang xử lý", className: styles.statusProcessing, icon: <ClockCircleOutlined /> }
    }
  }

  // If no booking data, return null
  if (!bookingData) return null
  console.log(bookingData)
  const statusInfo = getStatusInfo(bookingData.status)

  return (
    <Modal
      title={
        <div className={styles.modalTitle}>
          <span>Chi tiết đặt phòng</span>
          <div className={statusInfo.className}>
            {statusInfo.icon} {statusInfo.label}
          </div>
        </div>
      }
      open={isVisible}
      onCancel={onClose}
      footer={null}
      width={700}
      className={styles.bookingDetailModal}
    >
      <div className={styles.modalContent}>
        <div className={styles.bookingHeader}>
          <div className={styles.roomNumber}>
            <span className={styles.roomLabel}>Phòng</span>
            <span className={styles.roomValue}>{bookingData.roomNo}</span>
          </div>
          <div className={styles.bookingPrice}>
            <DollarOutlined className={styles.priceIcon} />
            <span>{bookingData.price?.toLocaleString("vi-VN")}đ</span>
          </div>
        </div>

        <div className={styles.divider}></div>

        <div className={styles.bookingInfo}>
          <div className={styles.infoSection}>
            <h3 className={styles.sectionTitle}>
              <UserOutlined /> Thông tin khách hàng
            </h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Họ tên</span>
                <span className={styles.infoValue}>{bookingData.guestName || "Chưa có thông tin"}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Số điện thoại</span>
                <span className={styles.infoValue}>{bookingData.phone || "Chưa có thông tin"}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Email</span>
                <span className={styles.infoValue}>{bookingData.email || "Chưa có thông tin"}</span>
              </div>
            </div>
          </div>

          <div className={styles.infoSection}>
            <h3 className={styles.sectionTitle}>
              <HomeOutlined /> Thông tin đặt phòng
            </h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Địa điểm</span>
                <span className={styles.infoValue}>{bookingData.placeName}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Ngày check-in</span>
                <span className={styles.infoValue}>{formatDate(bookingData.checkIn)}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Giờ check-in</span>
                <span className={styles.infoValue}>{formatTime(bookingData.checkIn)}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Ngày check-out</span>
                <span className={styles.infoValue}>{formatDate(bookingData.checkOut)}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Giờ check-out</span>
                <span className={styles.infoValue}>{formatTime(bookingData.checkOut)}</span>
              </div>
            </div>
          </div>

          {bookingData.notes && (
            <div className={styles.infoSection}>
              <h3 className={styles.sectionTitle}>Ghi chú</h3>
              <div className={styles.notesBox}>{bookingData.notes}</div>
            </div>
          )}
        </div>

        <div className={styles.actionButtons}>
          <button className={styles.closeButton} onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  )
}
