import { useState, useEffect } from "react"
import { Dropdown, Input, Button, message, Select } from "antd"
import { FilterOutlined, SearchOutlined, MoreOutlined, ExclamationCircleFilled, SortAscendingOutlined, InfoCircleOutlined, ReloadOutlined } from "@ant-design/icons"
import { CreditCardOutlined, DollarOutlined, BankOutlined, WalletOutlined } from "@ant-design/icons"
import debounce from "lodash/debounce"
import TableModify from "../../../dashboard/components/Table"
import Filter from "../../../../components/Filter/Filter"
import UpdateBookingStatus from "../UpdateBookingStatus/UpdateBookingStatus"
import BookingDetail from "../BookingDetail/BookingDetail"
import styles from "./ListBooking.module.scss"
import { useGetBookingByIdQuery } from "../../../../redux/services/bookingApi"
import momoIcon from "../../../../../src/assets/momo.png"
import dayjs from "dayjs"
import { Tooltip } from "antd"

const HorizontalEllipsisIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="3" cy="8" r="1.5" fill="currentColor" />
    <circle cx="8" cy="8" r="1.5" fill="currentColor" />
    <circle cx="13" cy="8" r="1.5" fill="currentColor" />
  </svg>
)

export default function ListBooking({
  bookings,
  bookingStatusCodes,
  paymentStatusCodes,
  paymentMethodCodes,
  onStatusChange,
  isUpdating,
  onReload
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredData, setFilteredData] = useState(bookings || [])
  const [selectedValues, setSelectedValues] = useState({
    status: [],
    payment: [],
    dateFilter: null,
  })
  const [dateRange, setDateRange] = useState(null)
  const [filterVisible, setFilterVisible] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [statusModalVisible, setStatusModalVisible] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState(null)
  const [isBookingDetailVisible, setIsBookingDetailVisible] = useState(false)
  const [sortOption, setSortOption] = useState("newest")
  const [isReloading, setIsReloading] = useState(false)

  const {
    data: bookingDetailData,
    isLoading: isDetailLoading,
    isError: isDetailError,
  } = useGetBookingByIdQuery(selectedBookingId, {
    skip: !selectedBookingId,
  })

  useEffect(() => {
    setFilteredData(bookings || [])
  }, [bookings])

  const getBookingStatusDisplay = (statusCode) => {
    const statusMap = {
      [bookingStatusCodes.CONFIRMED]: "Đã xác nhận",
      [bookingStatusCodes.PENDING]: "Chờ xác nhận",
      [bookingStatusCodes.NEEDCHECKIN]: "Cần check-in",
      [bookingStatusCodes.CHECKEDIN]: "Đã check-in",
      [bookingStatusCodes.NEEDCHECKOUT]: "Cần check-out",
      [bookingStatusCodes.CHECKEDOUT]: "Đã check-out",
      [bookingStatusCodes.CANCELLED]: "Đã huỷ",
      [bookingStatusCodes.COMPLETED]: "Hoàn tất",
      [bookingStatusCodes.REFUND]: "Đã hoàn tiền",
    }
    return statusMap[statusCode] || "Trạng thái không xác định"
  }

  const getPaymentStatusDisplay = (statusCode) => {
    const statusMap = {
      [paymentStatusCodes.BOOKING]: "Đã đặt",
      [paymentStatusCodes.PENDING]: "Chờ thanh toán",
      [paymentStatusCodes.PAID]: "Đã thanh toán",
      [paymentStatusCodes.REFUND]: "Yêu cầu hoàn tiền",
      [paymentStatusCodes.FAILED]: "Thanh toán thất bại",
    }
    return statusMap[statusCode] || "Chưa thanh toán"
  }

  const statusDescriptions = {
    [bookingStatusCodes.CONFIRMED]: "Đơn đặt phòng đã được xác nhận thành công và đang chờ check-in",
    [bookingStatusCodes.PENDING]: "Đơn đặt phòng đang chờ chủ phòng xác nhận thông tin",
    [bookingStatusCodes.NEEDCHECKIN]: "Khách hàng cần thực hiện thủ tục check-in trong ngày đến",
    [bookingStatusCodes.CHECKEDIN]: "Khách đã check-in thành công và đang sử dụng phòng",
    [bookingStatusCodes.NEEDCHECKOUT]: "Đến giờ check-out, khách cần hoàn tất thủ tục trả phòng",
    [bookingStatusCodes.CHECKEDOUT]: "Khách đã check-out thành công, đang chờ xác nhận hoàn tất",
    [bookingStatusCodes.CANCELLED]: "Đơn đặt phòng đã bị hủy bởi khách hoặc chủ phòng",
    [bookingStatusCodes.COMPLETED]: "Đơn đặt phòng đã được hoàn tất toàn bộ quy trình",
    [bookingStatusCodes.REFUND]: "Đơn hàng đã được hoàn tiền",
  }

  const statusPaymentDescriptions = {
    [paymentStatusCodes.BOOKING]: "Đơn hàng đã được đặt thành công và đang chờ thanh toán",
    [paymentStatusCodes.PENDING]: "Đơn hàng đang trong quá trình xử lý thanh toán",
    [paymentStatusCodes.PAID]: "Đơn hàng đã được thanh toán đầy đủ",
    [paymentStatusCodes.REFUND]: "Đơn đặt phòng đang yêu cầu hoàn tiền",
    [paymentStatusCodes.FAILED]: "Thanh toán không thành công, cần thử lại hoặc chọn phương thức khác",
  }

  const statusOptions = Object.entries(bookingStatusCodes).map(([key, value]) => ({
    label: getBookingStatusDisplay(value),
    value: getBookingStatusDisplay(value),
  }))

  const paymentOptions = Object.entries(paymentStatusCodes).map(([key, value]) => ({
    label: getPaymentStatusDisplay(value),
    value: getPaymentStatusDisplay(value),
  }))

  const filterGroups = [
    {
      name: "status",
      title: "Trạng thái đặt phòng",
      options: statusOptions,
    },
    {
      name: "payment",
      title: "Trạng thái thanh toán",
      options: paymentOptions,
    },
  ]

  const sortOptions = [
    { value: "newest", label: "Mới nhất" },
    { value: "refundRequests", label: "Yêu cầu hoàn tiền" },
  ]

  const parseDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return null
    return dayjs(dateTimeStr, "DD/MM/YYYY HH:mm:ss")
  }

  const matchesDateTimeFilter = (booking, dateFilter) => {
    if (!dateFilter) return true
    if (!booking || !booking._originalBooking) return false

    const checkInDateTime = parseDateTime(booking._originalBooking.checkInHour)
    const checkOutDateTime = parseDateTime(booking._originalBooking.checkOutHour)

    if (!checkInDateTime || !checkOutDateTime) return false

    if (dateFilter.date) {
      const filterDate = dateFilter.date.format("DD/MM/YYYY")
      const bookingDate = checkInDateTime.format("DD/MM/YYYY")

      if (filterDate !== bookingDate) return false
    }

    if (dateFilter.timeRange) {
      const [filterStartTime, filterEndTime] = dateFilter.timeRange

      const checkInTime = checkInDateTime.hour() * 60 + checkInDateTime.minute()
      const checkOutTime = checkOutDateTime.hour() * 60 + checkOutDateTime.minute()

      const filterStartMinutes = filterStartTime.hour() * 60 + filterStartTime.minute()
      const filterEndMinutes = filterEndTime.hour() * 60 + filterEndTime.minute()

      const checkInInRange = checkInTime >= filterStartMinutes && checkInTime <= filterEndMinutes
      const checkOutInRange = checkOutTime >= filterStartMinutes && checkOutTime <= filterEndMinutes
      const bookingSpansFilterRange = checkInTime <= filterStartMinutes && checkOutTime >= filterEndMinutes

      if (!(checkInInRange || checkOutInRange || bookingSpansFilterRange)) {
        return false
      }
    }

    return true
  }

  const applyFilters = () => {
    let filtered = [...bookings]

    if (selectedValues.status && selectedValues.status.length > 0) {
      filtered = filtered.filter((item) =>
        selectedValues.status.includes(getBookingStatusDisplay(item._originalBooking.status)),
      )
    }

    if (selectedValues.payment && selectedValues.payment.length > 0) {
      filtered = filtered.filter((item) =>
        selectedValues.payment.includes(getPaymentStatusDisplay(item._originalBooking.paymentStatus)),
      )
    }

    if (searchTerm) {
      filtered = filtered.filter((item) => {
        const customerName = item._originalBooking.customerId?.userId?.fullName?.toLowerCase() || ""
        const bookingId = item._originalBooking?._id?.toLowerCase() || ""
        return customerName.includes(searchTerm.toLowerCase()) ||
          bookingId.includes(searchTerm.toLowerCase())
      })
    }

    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].startOf("day")
      const endDate = dateRange[1].endOf("day")

      filtered = filtered.filter((item) => {
        const bookingDate = new Date(item._originalBooking.createdAt)
        return bookingDate >= startDate.toDate() && bookingDate <= endDate.toDate()
      })
    }

    if (selectedValues.dateFilter) {
      filtered = filtered.filter((item) => matchesDateTimeFilter(item, selectedValues.dateFilter))
    }

    // Apply sorting based on selected option
    applySorting(filtered)
  }

  const applySorting = (data) => {
    let sortedData = [...data]
    const today = dayjs().format("DD/MM/YYYY")

    switch (sortOption) {
      case "refundRequests":
        // Sort refund requests to the top
        sortedData.sort((a, b) => {
          const aIsRefundRequest =
            a._originalBooking.status === bookingStatusCodes.CANCELLED &&
            a._originalBooking.paymentStatus === paymentStatusCodes.REFUND

          const bIsRefundRequest =
            b._originalBooking.status === bookingStatusCodes.CANCELLED &&
            b._originalBooking.paymentStatus === paymentStatusCodes.REFUND

          if (aIsRefundRequest && !bIsRefundRequest) return -1
          if (!aIsRefundRequest && bIsRefundRequest) return 1

          // If both or neither are refund requests, sort by creation date (newest first)
          return new Date(b._originalBooking.createdAt) - new Date(a._originalBooking.createdAt)
        })
        break
        // Sort pending bookings to the top
        sortedData.sort((a, b) => {
          const aIsPending = a._originalBooking.status === bookingStatusCodes.PENDING
          const bIsPending = b._originalBooking.status === bookingStatusCodes.PENDING

          if (aIsPending && !bIsPending) return -1
          if (!aIsPending && bIsPending) return 1

          // If both or neither are pending, sort by creation date (newest first)
          return new Date(b._originalBooking.createdAt) - new Date(a._originalBooking.createdAt)
        })
        break

      case "newest":
      default:
        sortedData.sort((a, b) => {
          const dateA = dayjs(a._originalBooking.checkInHour, "DD/MM/YYYY HH:mm:ss")
          const dateB = dayjs(b._originalBooking.checkInHour, "DD/MM/YYYY HH:mm:ss")
          return dateB.valueOf() - dateA.valueOf()
        })
        break
    }

    setFilteredData(sortedData)
  }

  useEffect(() => {
    applyFilters()
  }, [selectedValues, searchTerm, dateRange, bookings, sortOption])

  const handleFilterChange = (filterName, newValues) => {
    if (filterName === "reset") {
      setSelectedValues(newValues)
      setDateRange(null)
      setSearchTerm("")
      return
    }

    if (filterName === "dateRange") {
      setDateRange(newValues)
      return
    }

    if (filterName === "search") {
      setSearchTerm(newValues)
      return
    }

    if (filterName === "dateFilter") {
      setSelectedValues({
        ...selectedValues,
        dateFilter: newValues,
      })
      return
    }

    setSelectedValues({
      ...selectedValues,
      [filterName]: newValues,
    })
  }

  const handleSortChange = (value) => {
    setSortOption(value)
  }

  const debouncedSearch = debounce((value) => {
    setSearchTerm(value)
  }, 500)

  const handleSearch = (e) => {
    const value = e.target.value
    debouncedSearch(value)
  }

  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [])

  const getStatusClass = (status) => {
    const statusMap = {
      "Đã xác nhận": "confirmed",
      "Chờ xác nhận": "pending",
      "Cần check-in": "needcheckin",
      "Đã check-in": "inprogress",
      "Cần check-out": "needcheckout",
      "Đã check-out": "checkedout",
      "Đã huỷ": "canceled",
      "Hoàn tất": "complete",
      "Đã hoàn tiền": "refund",
    }

    return statusMap[status] || "pending"
  }

  const getPaymentClass = (payment) => {
    const paymentMap = {
      "Đã đặt": "booked",
      "Chờ thanh toán": "pending",
      "Đã thanh toán": "paid",
      "Yêu cầu hoàn tiền": "refund",
      "Thanh toán thất bại": "cancelled",
      "Chưa thanh toán": "pending",
    }

    return paymentMap[payment] || "pending"
  }

  const getPaymentIcon = (method) => {
    if (method == paymentMethodCodes.MOMO) {
      return <img src={momoIcon || "/placeholder.svg"} alt="MoMo" style={{ width: "16px", height: "16px" }} />
    } else if (typeof method === "string") {
      const methodStr = method.toLowerCase()
      if (methodStr.includes("visa") || methodStr.includes("card")) {
        return <CreditCardOutlined />
      } else if (methodStr.includes("cash")) {
        return <DollarOutlined />
      } else if (methodStr.includes("bank") || methodStr.includes("transfer")) {
        return <BankOutlined />
      } else {
        return <WalletOutlined />
      }
    } else {
      return <WalletOutlined />
    }
  }

  const handleViewDetails = (booking) => {
    const bookingId = booking._originalBooking._id || booking._originalBooking.id
    setSelectedBookingId(bookingId)
    setIsBookingDetailVisible(true)
  }

  const handleCloseBookingDetail = () => {
    setIsBookingDetailVisible(false)
    setSelectedBookingId(null)
  }

  const handleStatusUpdate = (booking) => {
    setSelectedBooking(booking)
    setStatusModalVisible(true)
  }

  const handleCloseStatusModal = () => {
    setStatusModalVisible(false)
    setSelectedBooking(null)
  }

  const handleCustomStatusChange = async (booking) => {
    try {
      await onStatusChange(booking._originalBooking._id, {
        status: bookingStatusCodes.REFUND,
      })

      // message.success("Cập nhật trạng thái hoàn tiền thành công");
      handleCloseStatusModal()
    } catch (error) {
      message.error(error?.message || "Thao tác thất bại")
    }
  }

  const handleReloadData = async () => {
    if (onReload && typeof onReload === 'function') {
      setIsReloading(true)
      try {
        await onReload()
        message.success('Dữ liệu đã được làm mới')
      } catch (error) {
        message.error('Làm mới dữ liệu thất bại')
      } finally {
        setIsReloading(false)
      }
    }
  }

  const menuItems = (record) => {
    const items = [
      {
        key: "1",
        label: "Xem Chi Tiết",
        onClick: () => handleViewDetails(record),
      },
    ]

    if (
      record._originalBooking.status === bookingStatusCodes.CANCELLED &&
      record._originalBooking.paymentStatus === paymentStatusCodes.REFUND
    ) {
      items.push({
        key: "2",
        label: "Xác nhận hoàn Tiền",
        onClick: () => handleStatusUpdate(record),
      })
    }

    return items
  }

  const tableColumn = [
    {
      title: <span className={styles.tableHeader}>Mã Đặt Phòng</span>,
      dataIndex: "bookingId",
      key: "bookingId",
      render: (_, record) => {
        const bookingId = record._originalBooking?._id || "N/A"
        return (
          <div className={styles.indexCell}>
            {record._originalBooking.status === bookingStatusCodes.CANCELLED &&
              record._originalBooking.paymentStatus === paymentStatusCodes.REFUND && (
                <Tooltip
                  title="Yêu cầu hoàn tiền cần xác nhận!"
                  color="#fa8c16"
                  overlayClassName={styles.warningTooltip}
                >
                  <ExclamationCircleFilled className={styles.urgentWarningIcon} />
                </Tooltip>
              )}
            <span className={styles.bookingId}>{bookingId}</span>
          </div>
        )
      },
    },
    {
      title: <span className={styles.tableHeader}>Khách Hàng</span>,
      dataIndex: "customerName",
      key: "customerName",
      render: (_, record) => record._originalBooking.customerId?.userId?.fullName || "Không xác định",
    },
    {
      title: <span className={styles.tableHeader}>Loại Phòng</span>,
      dataIndex: "roomType",
      key: "roomType",
      render: (_, record) => record._originalBooking.accommodationId?.accommodationTypeId?.name || "Không xác định",
    },
    {
      title: <span className={styles.tableHeader}>Check-in / Check-out</span>,
      dataIndex: "bookingTime",
      key: "bookingTime",
      render: (_, record) => {
        if (!record || !record._originalBooking) {
          return "N/A"
        }
        const booking = record._originalBooking

        const checkInDateTime = parseDateTime(booking.checkInHour)
        const checkOutDateTime = parseDateTime(booking.checkOutHour)

        if (!checkInDateTime || !checkOutDateTime) {
          return (
            <div className={styles.timeInfo}>
              {booking.checkInHour || "N/A"} - {booking.checkOutHour || "N/A"}
            </div>
          )
        }

        return (
          <div className={styles.timeInfo}>
            <div>{checkInDateTime.format("DD/MM/YYYY")}</div>
            <div>
              {checkInDateTime.format("HH:mm")} - {checkOutDateTime.format("HH:mm")}
            </div>
          </div>
        )
      },
    },
    {
      title: <span className={styles.tableHeader}>Số Người</span>,
      dataIndex: "peopleCount",
      key: "peopleCount",
      render: (_, record) => {
        const booking = record._originalBooking
        return (
          <div className={styles.peopleInfo}>
            <span>NL: {booking.adultNumber}</span>
            <span>TE: {booking.childNumber}</span>
          </div>
        )
      },
    },
    {
      title: <span className={styles.tableHeader}>Thanh Toán</span>,
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      render: (_, record) => {
        const booking = record._originalBooking
        const paymentStatus = getPaymentStatusDisplay(booking.paymentStatus)
        const paymentMethodValue = booking.paymentMethod

        const paymentMethodText =
          paymentMethodValue === paymentMethodCodes.MOMO
            ? "MoMo"
            : paymentMethodValue
              ? String(paymentMethodValue)
              : "Chưa xác định"

        return (
          <div className={styles.paymentInfo}>
            <div className={styles.method}>
              <span className={styles.paymentMethodIcon}>{getPaymentIcon(paymentMethodValue)}</span>
              {paymentMethodText}
            </div>
            <div>
              <span className={`${styles.paymentTag} ${styles[getPaymentClass(paymentStatus)]}`}>{paymentStatus}</span>
            </div>
          </div>
        )
      },
    },
    {
      title: <span className={styles.tableHeader}>Trạng Thái</span>,
      dataIndex: "status",
      key: "status",
      render: (_, record) => {
        const statusCode = record._originalBooking.status
        const statusText = getBookingStatusDisplay(statusCode)

        return <span className={`${styles.statusTag} ${styles[getStatusClass(statusText)]}`}>{statusText}</span>
      },
    },
    {
      title: <span className={styles.tableHeader}>Thao Tác</span>,
      key: "operation",
      render: (_, record) => (
        <Dropdown
          trigger={["click"]}
          menu={{
            items: menuItems(record).map((item) => ({
              ...item,
              onClick: () => item.onClick(record),
            })),
          }}
        >
          <MoreOutlined onClick={(e) => e.preventDefault()} style={{ fontSize: 18, cursor: "pointer" }} />
        </Dropdown>
      ),
    },
  ]

  const activeFilterCount =
    selectedValues.status.length +
    selectedValues.payment.length +
    (dateRange && dateRange[0] && dateRange[1] ? 1 : 0) +
    (selectedValues.dateFilter ? 1 : 0)

  return (
    <div className={styles.contentContainer}>
      <h2>Danh Sách Booking</h2>
      <div className={styles.listBooking}>
        <div className={styles.filterContainer}>
          <Input
            placeholder="Tìm kiếm tên khách hàng hoặc mã đặt phòng"
            onChange={handleSearch}
            className={styles.searchInput}
            prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
            allowClear
          />

          <Select
            value={sortOption}
            onChange={handleSortChange}
            options={sortOptions}
            className={styles.sortSelect}
            suffixIcon={<SortAscendingOutlined />}
            style={{ width: '180px', marginRight: '10px' }}
            placeholder="Sắp xếp theo"
          />

          <Dropdown
            overlay={
              <Filter
                filterGroups={filterGroups}
                selectedValues={selectedValues}
                onFilterChange={handleFilterChange}
                bookingStatusCodes={bookingStatusCodes}
                paymentStatusCodes={paymentStatusCodes}
              />
            }
            trigger={["click"]}
            placement="bottomRight"
            visible={filterVisible}
            onVisibleChange={setFilterVisible}
          >
            <Button
              icon={<FilterOutlined />}
              className={styles.filterButton}
              type={activeFilterCount > 0 ? "primary" : "default"}
            >
              Lọc
              {activeFilterCount > 0 && <span className={styles.filterBadge}>{activeFilterCount}</span>}
            </Button>
          </Dropdown>
          <Button
            icon={<ReloadOutlined spin={isReloading} />}
            onClick={handleReloadData}
            loading={isReloading}
            className={styles.reloadButton}
          >
            Làm mới
          </Button>

          <div className={styles.statusDescriptionContainer}>
            <Dropdown
              overlay={
                <div className={styles.statusDescriptionPopover}>
                  <div className={styles.descriptionSection}>
                    <h4>Trạng thái đặt phòng</h4>
                    {Object.entries(statusDescriptions).map(([statusCode, description]) => (
                      <div key={statusCode} className={styles.descriptionItem}>
                        <span
                          className={`${styles.statusDot} ${styles[getStatusClass(getBookingStatusDisplay(statusCode))]}`}
                        />
                        <div>
                          <div className={styles.descriptionTitle}>{getBookingStatusDisplay(statusCode)}</div>
                          <div className={styles.descriptionText}>{description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={styles.descriptionSection}>
                    <h4>Trạng thái thanh toán</h4>
                    {Object.entries(paymentStatusCodes).map(([key, value]) => (
                      <div key={key} className={styles.descriptionItem}>
                        <span
                          className={`${styles.statusDot} ${styles[getPaymentClass(getPaymentStatusDisplay(value))]}`}
                        />
                        <div>
                          <div className={styles.descriptionTitle}>{getPaymentStatusDisplay(value)}</div>
                          <div className={styles.descriptionText}>
                            {statusPaymentDescriptions[value] ||
                              `Trạng thái thanh toán: ${getPaymentStatusDisplay(value)}`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              }
              trigger={["click"]}
              placement="bottomRight"
            >
              <Button className={styles.infoButton} icon={<InfoCircleOutlined />}>
                Thông tin trạng thái
              </Button>
            </Dropdown>
          </div>
        </div>

        <div className={styles.tableContainer}>
          <TableModify
            tableColumn={tableColumn}
            tableData={filteredData}
            rowClassName={(record) =>
              record._originalBooking.status === bookingStatusCodes.CANCELLED &&
                record._originalBooking.paymentStatus === paymentStatusCodes.REFUND
                ? styles.urgentWarningRow
                : ""
            }
            isPagination={{
              total: filteredData.length,
              pageSize: 7,
              showSizeChanger: false,
              itemRender: (page, type, originalElement) => {
                const totalPages = Math.ceil(filteredData.length / 7)

                if (type === "prev") {
                  return (
                    <button className={styles.paginationButton} disabled={page === 0}>
                      « Trước
                    </button>
                  )
                }
                if (type === "next") {
                  return (
                    <button className={styles.paginationButton} disabled={page >= totalPages}>
                      Tiếp »
                    </button>
                  )
                }
                return originalElement
              },
            }}
            loading={isUpdating || isReloading}
            className={styles.bookingTable}
          />
        </div>
      </div>

      {selectedBooking && (
        <UpdateBookingStatus
          booking={selectedBooking}
          visible={statusModalVisible}
          onClose={handleCloseStatusModal}
          bookingStatusCodes={bookingStatusCodes}
          paymentStatusCodes={paymentStatusCodes}
          paymentMethodCodes={paymentMethodCodes}
          onStatusChange={() => handleCustomStatusChange(selectedBooking)}
          isLoading={isUpdating}
        />
      )}

      <BookingDetail
        bookingId={selectedBookingId}
        visible={isBookingDetailVisible}
        onClose={handleCloseBookingDetail}
        bookingData={bookingDetailData}
        isLoading={isDetailLoading}
        isError={isDetailError}
      />
    </div>
  )
}