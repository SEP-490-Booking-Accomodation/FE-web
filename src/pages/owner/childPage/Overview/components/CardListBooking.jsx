import styles from "./CardListBooking.module.scss"
import CardBooking from "./CardBooking.jsx"
import { CalendarX } from "lucide-react" // Assuming you have access to lucide-react icons

export default function CardListBooking({ stageLevel, bookingList, listBookingTypeName, filterDataBooking = [] }) {
  // Map booking status codes to status strings for CardBooking
  const getStatusString = (statusCode) => {
    // BOOKING_STATUS mapping:
    // CONFIRMED: 1, NEEDCHECKIN: 2, CHECKEDIN: 3, NEEDCHECKOUT: 4,
    // CHECKEDOUT: 5, CANCELLED: 6, COMPLETED: 7, PENDING: 8
    switch (statusCode) {
      case 1:
        return "processing" // CONFIRMED
      case 2:
        return "processing" // NEEDCHECKIN
      case 3:
        return "processing" // CHECKEDIN
      case 4:
        return "processing" // NEEDCHECKOUT
      case 5:
        return "processing" // CHECKEDOUT
      case 6:
        return "cancel" // CANCELLED
      case 7:
        return "complete" // COMPLETED
      case 8:
        return "pending" // PENDING
      default:
        return "processing"
    }
  }


  // Filter bookings based on stageLevel
  const getFilteredBookings = () => {
    if (!filterDataBooking || filterDataBooking.length === 0) {
      return []
    }

    // Filter logic based on stageLevel
    switch (stageLevel) {
      case "1": // Upcoming bookings
        return filterDataBooking.filter((booking) => booking.status === 1 || booking.status === 8)
      case "2": // Current bookings
        return filterDataBooking.filter(
            (booking) => booking.status === 2 || booking.status === 3 || booking.status === 4,
        )
      case "3": // Completed bookings
        return filterDataBooking.filter(
            (booking) => booking.status === 5 || booking.status === 7 || booking.status === 6,
        )
      default:
        return filterDataBooking
    }
  }

  // Map booking data to the format expected by CardBooking
  const mappedBookings = getFilteredBookings().map((booking) => ({
    placeName: booking.accommodationId?.rentalLocationId?.name || "Unknown Location",
    checkIn: booking.checkInHour,
    checkOut: booking.checkOutHour,
    price: booking.totalPrice,
    roomNo: booking.accommodationId?.roomNo || "N/A",
    guestName: booking.customerId?.userId?.fullName || "Unknown Guest",
    status: getStatusString(booking.status),
    phone : booking.customerId?.userId?.phone,
    email : booking.customerId?.userId?.email,
  }))

  return (
      <div className={styles.cardListBooking}>
        <div className={styles.header}>
          <h2 className={styles.title}>{listBookingTypeName}</h2>
          <div className={styles.badge}>{mappedBookings.length}</div>
        </div>
        <div className={styles.bookingList}>
          {mappedBookings.length > 0 ? (
              mappedBookings.map((item, index) => <CardBooking key={index} item={item} stageLevel={stageLevel} />)
          ) : (
              <div className={styles.emptyState}>
                <CalendarX size={32} className={styles.emptyIcon} />
                <p>Không có đặt phòng</p>
              </div>
          )}
        </div>
      </div>
  )
}
