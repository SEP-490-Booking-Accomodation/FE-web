import { useState, useEffect } from "react"
import { Dropdown, Input, Button, message, Table, Select } from "antd"
import {
  FilterOutlined,
  SearchOutlined,
  MoreOutlined,
  WalletOutlined,
  SortAscendingOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons"
import debounce from "lodash/debounce"
import Filter from "../../../../../../components/Filter/Filter"
import UpdateBookingStatus from "../UpdateBookingStatus/UpdateBookingStatus"
import BookingDetail from "../BookingDetail/BookingDetail"
import styles from "./ListBooking.module.scss"
import { useGetBookingByIdQuery } from "../../../../../../redux/services/bookingApi"
import momoIcon from "../../../../../../../src/assets/momo.png"
import dayjs from "dayjs"

export default function ListBooking({
  bookings = [],
  bookingStatusCodes = {},
  paymentStatusCodes = {},
  paymentMethodCodes = {},
  onStatusChange,
  isUpdating,
  onSelectBookingDetail,
  generatePassword,
  onReload,
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredData, setFilteredData] = useState([])
  const [selectedValues, setSelectedValues] = useState({
    status: [],
    payment: [],
    dateFilter: null,
  })
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [statusModalVisible, setStatusModalVisible] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState(null)
  const [isBookingDetailVisible, setIsBookingDetailVisible] = useState(false)
  const [sortOption, setSortOption] = useState("newest")
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 7,
    total: bookings.length,
  })
  const [isReloading, setIsReloading] = useState(false)

  const {
    data: bookingDetailData,
    isLoading: isDetailLoading,
    isError: isDetailError,
  } = useGetBookingByIdQuery(selectedBookingId, {
    skip: !selectedBookingId,
  })

  useEffect(() => {
    setPagination(prev => ({ ...prev, current: 1, total: bookings.length }))
  }, [bookings])

  useEffect(() => {
    setFilteredData(bookings)
  }, [bookings])

  const debouncedApplyFilters = debounce((filters) => {
    applyFilters(filters)
  }, 500)

  useEffect(() => {
    debouncedApplyFilters({ ...selectedValues, searchTerm })
    return () => debouncedApplyFilters.cancel()
  }, [searchTerm, selectedValues, sortOption, bookings]) 

  const getBookingStatusDisplay = (statusCode) => {
    const statusMap = {
      [bookingStatusCodes.CONFIRMED]: "Đã xác nhận",
      [bookingStatusCodes.PENDING]: "Chờ xác nhận",
      [bookingStatusCodes.NEEDCHECKIN]: "Cần check-in",
      [bookingStatusCodes.CHECKEDIN]: "Đã check-in",
      [bookingStatusCodes.NEEDCHECKOUT]: "Cần check-out",
      [bookingStatusCodes.CHECKEDOUT]: "Đã check-out",
      [bookingStatusCodes.CANCELLED]: "Đã hủy",
      [bookingStatusCodes.COMPLETED]: "Hoàn tất",
      [bookingStatusCodes.REFUND]: "Hoàn tiền",
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

  const getPaymentMethod = (method) => {
    const methods = { [paymentMethodCodes.MOMO]: "MoMo" }
    return methods[method] || "Không xác định"
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
    label: <span className={`${styles.statusTag} ${styles[key.toLowerCase()]}`}>{getBookingStatusDisplay(value)}</span>,
    value: getBookingStatusDisplay(value),
  }))

  const paymentOptions = Object.entries(paymentStatusCodes).map(([key, value]) => ({
    label: (
      <span className={`${styles.paymentTag} ${styles[key.toLowerCase()]}`}>{getPaymentStatusDisplay(value)}</span>
    ),
    value: getPaymentStatusDisplay(value),
  }))

  const filterGroups = [
    { name: "status", title: "Trạng thái", options: statusOptions },
    { name: "payment", title: "Thanh toán", options: paymentOptions },
  ]

  const sortOptions = [
    { value: "newest", label: "Mới nhất" },
    { value: "checkInToday", label: "Check-in hôm nay" },
    { value: "checkOutToday", label: "Check-out hôm nay" },
    { value: "pending", label: "Chờ xác nhận" },
  ]

  const parseDateTime = (dateTimeStr) => dayjs(dateTimeStr, "DD/MM/YYYY HH:mm:ss")

  const matchesDateTimeFilter = (booking, dateFilter) => {
    if (!dateFilter) return true
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

      return checkInInRange || checkOutInRange || bookingSpansFilterRange
    }
    return true
  }

  const applyFilters = (filters) => {
    if (!bookings || bookings.length === 0) {
      setFilteredData([])
      return
    }

    let filtered = [...bookings]

    if (filters.status?.length)
      filtered = filtered.filter((item) =>
        filters.status.includes(getBookingStatusDisplay(item._originalBooking.status)),
      )

    if (filters.payment?.length)
      filtered = filtered.filter((item) =>
        filters.payment.includes(getPaymentStatusDisplay(item._originalBooking.paymentStatus)),
      )

    if (filters.dateFilter) filtered = filtered.filter((item) => matchesDateTimeFilter(item, filters.dateFilter))

    if (filters.searchTerm)
      filtered = filtered.filter(
        (item) =>
          item._originalBooking.customerId?.userId?.fullName
            ?.toLowerCase()
            .includes(filters.searchTerm.toLowerCase()) ||
          item._originalBooking._id?.toLowerCase().includes(filters.searchTerm.toLowerCase()),
      )

    const sortedData = applySorting(filtered)
    setFilteredData(sortedData)
    setPagination((prev) => ({ ...prev, current: 1, total: sortedData.length }))
  }

  const applySorting = (data) => {
    const today = dayjs().format("DD/MM/YYYY")
    const sortedData = [...data]

    switch (sortOption) {
      case "checkInToday":
        sortedData.sort((a, b) => {
          const aCheckIn = parseDateTime(a._originalBooking.checkInHour)
          const bCheckIn = parseDateTime(b._originalBooking.checkInHour)
          const aToday = aCheckIn?.format("DD/MM/YYYY") === today
          const bToday = bCheckIn?.format("DD/MM/YYYY") === today
          return aToday === bToday ? aCheckIn - bCheckIn : aToday ? -1 : 1
        })
        break
      case "checkOutToday":
        sortedData.sort((a, b) => {
          const aCheckOut = parseDateTime(a._originalBooking.checkOutHour)
          const bCheckOut = parseDateTime(b._originalBooking.checkOutHour)
          const aToday = aCheckOut?.format("DD/MM/YYYY") === today
          const bToday = bCheckOut?.format("DD/MM/YYYY") === today
          return aToday === bToday ? aCheckOut - bCheckOut : aToday ? -1 : 1
        })
        break
      case "pending":
        sortedData.sort(
          (a, b) =>
            (a._originalBooking.status === bookingStatusCodes.PENDING ? -1 : 1) -
            (b._originalBooking.status === bookingStatusCodes.PENDING ? -1 : 1),
        )
        break
      default:
        sortedData.sort((a, b) => {
          const dateA = dayjs(a._originalBooking.checkInHour, "DD/MM/YYYY HH:mm:ss")
          const dateB = dayjs(b._originalBooking.checkInHour, "DD/MM/YYYY HH:mm:ss")
          return dateB.valueOf() - dateA.valueOf()
        })
    }

    return sortedData
  }

  const handleFilterChange = (filterName, newValues) => {
    const updatedFilters = filterName === "reset" ? newValues : { ...selectedValues, [filterName]: newValues }
    setSelectedValues(updatedFilters)
    if (filterName === "reset") setSearchTerm("")
  }

  const handleSortChange = (value) => setSortOption(value)
  const handleSearch = (e) => setSearchTerm(e.target.value)

  const handleReloadData = async () => {
    if (onReload && typeof onReload === 'function') {
      setIsReloading(true)
      try {
        await onReload()
        message.success('Dữ liệu đã được cập nhật')
      } catch (error) {
        message.error('Không thể tải lại dữ liệu. Vui lòng thử lại sau.')
      } finally {
        setIsReloading(false)
      }
    }
  }

  const getStatusClass = (status) =>
    ({
      "Đã xác nhận": "confirmed",
      "Chờ xác nhận": "pending",
      "Cần check-in": "needcheckin",
      "Đã check-in": "inprogress",
      "Cần check-out": "needcheckout",
      "Đã check-out": "checkedout",
      "Đã hủy": "canceled",
      "Hoàn tất": "complete",
      "Hoàn tiền": "refund",
    })[status] || "pending"

  const getPaymentClass = (payment) =>
    ({
      "Đã đặt": "booked",
      "Chờ thanh toán": "pending",
      "Đã thanh toán": "paid",
      "Yêu cầu hoàn tiền": "refund",
      "Thanh toán thất bại": "cancelled",
    })[payment] || "pending"

  const getPaymentIcon = (method) =>
    method === paymentMethodCodes.MOMO ? (
      <img src={momoIcon || "/placeholder.svg"} alt="MoMo" className={styles.paymentIcon} />
    ) : (
      <WalletOutlined />
    )

  const columns = [
    {
      title: <span className={styles.tableHeader}>Mã Đặt Phòng</span>,
      render: (_, record) => (
        <div className={styles.indexCell}>
          <strong>{record._originalBooking?._id}</strong>
        </div>
      ),
    },
    {
      title: <span className={styles.tableHeader}>Khách Hàng</span>,
      render: (_, record) => record._originalBooking.customerId.userId?.fullName || "Không xác định",
    },
    {
      title: <span className={styles.tableHeader}>Loại Phòng</span>,
      render: (_, record) => record._originalBooking.accommodationId.accommodationTypeId?.name || "Không xác định",
    },
    {
      title: <span className={styles.tableHeader}>Check-in / Check-out</span>,
      render: (_, record) => {
        const ci = parseDateTime(record._originalBooking.checkInHour)
        const co = parseDateTime(record._originalBooking.checkOutHour)
        return (
          <div className={styles.timeInfo}>
            <div>{ci?.format("DD/MM/YYYY")}</div>
            <div>
              {ci?.format("HH:mm")} - {co?.format("HH:mm")}
            </div>
          </div>
        )
      },
    },
    {
      title: <span className={styles.tableHeader}>Số Người</span>,
      render: (_, record) => (
        <div className={styles.peopleInfo}>
          <span>NL: {record._originalBooking.adultNumber}</span>
          <span>TE: {record._originalBooking.childNumber}</span>
        </div>
      ),
    },
    {
      title: <span className={styles.tableHeader}>Thanh Toán</span>,
      render: (_, record) => {
        const paymentStatus = getPaymentStatusDisplay(record._originalBooking.paymentStatus)
        return (
          <div className={styles.paymentInfo}>
            <div className={styles.method}>
              {getPaymentIcon(record._originalBooking.paymentMethod)}
              {getPaymentMethod(record._originalBooking.paymentMethod)}
            </div>
            <span className={`${styles.paymentTag} ${styles[getPaymentClass(paymentStatus)]}`}>{paymentStatus}</span>
          </div>
        )
      },
    },
    {
      title: <span className={styles.tableHeader}>Trạng Thái</span>,
      render: (_, record) => {
        const status = getBookingStatusDisplay(record._originalBooking.status)
        return <span className={`${styles.statusTag} ${styles[getStatusClass(status)]}`}>{status}</span>
      },
    },
    {
      title: "",
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              { key: "1", label: "Xem Chi Tiết", onClick: () => handleViewDetails(record) },
              ...(record._originalBooking.status === bookingStatusCodes.PENDING
                ? [
                  {
                    key: "2",
                    label: "Cập Nhật Trạng Thái",
                    onClick: () => handleStatusUpdate(record),
                  },
                ]
                : []),
            ],
          }}
        >
          <MoreOutlined style={{ fontSize: 18, cursor: "pointer" }} />
        </Dropdown>
      ),
    },
  ]

  const handleViewDetails = (booking) => {
    const bookingId = booking._originalBooking._id
    setSelectedBookingId(bookingId)
    setIsBookingDetailVisible(true)
    onSelectBookingDetail?.(bookingId)
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

  const handleCustomStatusChange = async (bookingId, newStatusDisplay, cancelReason) => {
    try {
      await onStatusChange(bookingId, newStatusDisplay, cancelReason)
      handleCloseStatusModal()
    } catch (error) {
      message.error("Cập nhật trạng thái thất bại")
    }
  }

  const handlePaginationChange = (page, pageSize) => {
    setPagination({
      ...pagination,
      current: page,
      pageSize: pageSize
    })
  }

  return (
    <div className={styles.contentContainer}>
      <h2>Danh Sách Booking</h2>
      <div className={styles.listBooking}>
        <div className={styles.filterContainer}>
          <Input
            placeholder="Tìm kiếm tên khách hàng hoặc mã đặt phòng"
            value={searchTerm}
            onChange={handleSearch}
            className={styles.searchInput}
            prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
          />

          <Select
            value={sortOption}
            onChange={handleSortChange}
            options={sortOptions}
            className={styles.sortSelect}
            suffixIcon={<SortAscendingOutlined />}
            style={{ width: "180px", marginRight: "10px" }}
          />

          <Dropdown
            overlay={
              <Filter filterGroups={filterGroups} selectedValues={selectedValues} onFilterChange={handleFilterChange} />
            }
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button icon={<FilterOutlined />} className={styles.filterButton}>
              Lọc
              {(Object.values(selectedValues).flat().length > 0 || selectedValues.dateFilter) && (
                <span className={styles.filterBadge}>
                  {Object.values(selectedValues).flat().filter(Boolean).length + (selectedValues.dateFilter ? 1 : 0)}
                </span>
              )}
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
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey={(record) => record._originalBooking?._id || Math.random()}
            loading={isUpdating || isReloading}
            pagination={{
              ...pagination,
              total: filteredData.length,
              onChange: handlePaginationChange,
              showSizeChanger: false,
              className: styles.customPagination,
              itemRender: (page, type, originalElement) => {
                if (type === "prev") return <button className={styles.paginationButton}>« Trước</button>
                if (type === "next") return <button className={styles.paginationButton}>Tiếp »</button>
                return originalElement
              },
            }}
            className={styles.bookingTable}
            scroll={{ x: "max-content" }}
          />
        </div>
      </div>

      {selectedBooking && (
        <UpdateBookingStatus
          booking={selectedBooking}
          visible={statusModalVisible}
          onClose={handleCloseStatusModal}
          bookingStatusCodes={bookingStatusCodes}
          onStatusChange={handleCustomStatusChange}
          paymentStatusCodes={paymentStatusCodes}
          paymentMethodCodes={paymentMethodCodes}
          onGeneratePassword={generatePassword}
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
        bookingStatusCodes={bookingStatusCodes}
        paymentStatusCodes={paymentStatusCodes}
        paymentMethodCodes={paymentMethodCodes}
      />
    </div>
  )
}