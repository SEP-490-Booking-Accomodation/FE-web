import { useState, useEffect } from "react";
import styles from "./Overview.module.scss";
import CardDashboard from "../../../../components/Card/CardDashboard";
import { Spin, Select, Button } from "antd";
import {
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  CalendarOutlined,
  RiseOutlined,
  BarChartOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import ReviewList from "./components/ReviewList.jsx";
import CardListBooking from "./components/CardListBooking.jsx";
import { useGetBookingsByOwnerIdQuery } from "../../../../redux/services/bookingApi.js";
import { useGetOwnerDetailByUserIdQuery } from "../../../../redux/services/ownerApi.js";
import { useGetFeedbackByOwnerIdQuery } from "../../../../redux/services/feedbackApi.js";
import { useGetBoookingStatsWeeklyQuery, useGetBookingStatsMonthlyQuery, useGetStatsRevenueWeeklyQuery, useGetStatsRevenueMonthlyQuery} from "../../../../redux/services/bookingApi.js"
import { useGetRentalLocationByOwnerIdQuery } from "../../../../redux/services/rentalApi.js";
import { useParams } from "react-router-dom";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function Overview() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("weekly");
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState([]);
  const [selectedRentalLocation, setSelectedRentalLocation] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(90); // 90 seconds = 1.5 minutes

  const { data: ownerDetail } = useGetOwnerDetailByUserIdQuery(id);
  const { data: rentalLocations } = useGetRentalLocationByOwnerIdQuery(ownerDetail?.id, {
    skip: !ownerDetail?.id
  });

  const { data: weeklyBookingStats, refetch: refetchWeeklyStats } =
    useGetBoookingStatsWeeklyQuery(id);
  const { data: monthlyBookingStats, refetch: refetchMonthlyStats } =
    useGetBookingStatsMonthlyQuery(id);
  const { data: weeklyRevenueStats, refetch: refetchWeeklyRevenue } =
    useGetStatsRevenueWeeklyQuery(id);
  const { data: monthlyRevenueStats, refetch: refetchMonthlyRevenue } =
    useGetStatsRevenueMonthlyQuery(id);

  const { data: bookingDetail, refetch: refetchBookings } = useGetBookingsByOwnerIdQuery(
    ownerDetail?.id,
    {
      skip: !ownerDetail?.id,
    }
  );

  const { data: feebackData, isLoadingFeedback, refetch: refetchFeedback } = useGetFeedbackByOwnerIdQuery(
    ownerDetail?.id,
    {
      skip: !ownerDetail?.id,
    }
  );

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 90; // Reset to 90 without clearing interval
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto refresh every 1.5 minutes
  useEffect(() => {
    const refreshData = async () => {
      await Promise.all([
        refetchBookings(),
        refetchWeeklyStats(),
        refetchMonthlyStats(),
        refetchWeeklyRevenue(),
        refetchMonthlyRevenue(),
        refetchFeedback()
      ]);
    };

    const intervalId = setInterval(refreshData, 90000); // 1.5 minutes = 90000ms

    return () => clearInterval(intervalId);
  }, [refetchBookings, refetchWeeklyStats, refetchMonthlyStats, refetchWeeklyRevenue, refetchMonthlyRevenue, refetchFeedback]);

  // Manual refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchBookings(),
        refetchWeeklyStats(),
        refetchMonthlyStats(),
        refetchWeeklyRevenue(),
        refetchMonthlyRevenue(),
        refetchFeedback()
      ]);
      setCountdown(90); // Reset countdown after manual refresh
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isLoadingFeedback) {
      setIsLoading(true);
    } else {
      setFeedback(feebackData?.data);
      setIsLoading(false);
    }
  }, [feebackData, isLoadingFeedback]);

  const parseDate = (dateStr) => {
    const [datePart, timePart] = dateStr.split(" ");
    const [day, month, year] = datePart.split("/");
    return new Date(`${year}-${month}-${day}T${timePart}`);
  };

  const filterDataBooking =
    bookingDetail?.filter((booking) => {
      const checkInDate = parseDate(booking.checkInHour);
      const checkOutDate = parseDate(booking.checkOutHour);
      const now = new Date();
      
      // Show if booking is current or future
      const isCurrentOrFuture = checkInDate <= now && checkOutDate >= now || checkInDate > now;
      
      const matchLocation =
        selectedRentalLocation === "all" ||
        booking.accommodationId?.rentalLocationId?._id === selectedRentalLocation;
      return isCurrentOrFuture && matchLocation;
    }) || [];

  // Calculate statistics
  const totalBookings = bookingDetail?.length || 0;
  const completedBookings =
    bookingDetail?.filter((booking) => booking.status === 7).length || 0;
  const cancelledBookings =
    bookingDetail?.filter((booking) => booking.status === 6).length || 0;
  const totalRevenue =
    bookingDetail?.filter((booking) => booking.paymentStatus === 3).  
    reduce(
      (sum, booking) => sum + (booking.totalPrice || 0)
      ,
      0
    ) || 0;

  const transformStatsData = (bookingStats, revenueStats) => {
    const mergedData = [];

    if (activeTab === "weekly") {
      for (const key in bookingStats || {}) {
        mergedData.push({
          name: key,
          bookings: bookingStats[key] || 0,
          revenue: revenueStats?.[key] || 0,
        });
      }
    } else {
      // Xử lý dữ liệu theo tháng
      const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const dayKey = `Ngày ${day}`;
        mergedData.push({
          name: dayKey,
          bookings: bookingStats?.[dayKey] || 0,
          revenue: revenueStats?.[dayKey] || 0,
        });
      }
    }

    return mergedData;
  };

  const chartData =
    activeTab === "weekly"
      ? transformStatsData(weeklyBookingStats, weeklyRevenueStats)
      : transformStatsData(monthlyBookingStats, monthlyRevenueStats);

  return (
    <div className={styles.contentContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <CalendarOutlined className={styles.headerIcon} />
          Tổng quan đặt phòng
        </h1>
        <p className={styles.pageSubtitle}>
          Xem thông tin đặt phòng và thống kê doanh thu
        </p>
      </div>

      <div className={styles.statsCards}>
        <CardDashboard
          title="Tổng đặt phòng"
          value={totalBookings.toString()}
          iconName={<TeamOutlined />}
          backgroundColorIcon="#e6f7ff"
          colorIcon="#1890ff"
          height="120"
          width="100%"
        />

        <CardDashboard
          title="Hoàn tất"
          value={completedBookings.toString()}
          iconName={<CheckCircleOutlined />}
          backgroundColorIcon="#f6ffed"
          colorIcon="#52c41a"
          height="120"
          width="100%"
        />

        <CardDashboard
          title="Huỷ"
          value={cancelledBookings.toString()}
          iconName={<CloseCircleOutlined />}
          backgroundColorIcon="#fff2f0"
          colorIcon="#ff4d4f"
          height="120"
          width="100%"
        />

        <CardDashboard
          title="Doanh thu"
          value={`${totalRevenue.toLocaleString("vi-VN")}đ`}
          iconName={<DollarOutlined />}
          backgroundColorIcon="#f9f0ff"
          colorIcon="#722ed1"
          height="120"
          width="100%"
        />
      </div>

      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleContainer}>
          <h2 className={styles.sectionTitle}>
            <RiseOutlined className={styles.sectionIcon} />
            Đặt phòng hôm nay
          </h2>
        </div>
        <div className={styles.filterContainer}>
          <Select
            className={styles.locationFilter}
            value={selectedRentalLocation}
            onChange={setSelectedRentalLocation}
            style={{ width: 200 }}
          >
            <Select.Option value="all">Tất cả địa điểm</Select.Option>
            {rentalLocations?.data?.filter(location => 
              !location.isDeleted && location.status === 3
            ).map((location) => (
              <Select.Option key={location._id} value={location._id}>
                {location.name}
              </Select.Option>
            ))}
          </Select>
          <div className={styles.refreshContainer}>
            <span className={styles.countdownText}>
              Tự động làm mới sau: {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
            </span>
            <Button
              icon={<ReloadOutlined spin={isRefreshing} />}
              onClick={handleRefresh}
              loading={isRefreshing}
            >
              Làm mới
            </Button>
          </div>
        </div>
      </div>

      <div className={styles.bookingOverview}>
        <CardListBooking
          stageLevel="1"
          filterDataBooking={filterDataBooking}
          listBookingTypeName="Đặt phòng sắp tới"
        />
        <CardListBooking
          stageLevel="2"
          filterDataBooking={filterDataBooking}
          listBookingTypeName="Đang đặt phòng"
        />
        <CardListBooking
          stageLevel="3"
          filterDataBooking={filterDataBooking}
          listBookingTypeName="Đặt phòng hoàn tất"
        />
      </div>

      <h2 className={styles.sectionTitle}>
        <BarChartOutlined className={styles.sectionIcon} />
        Thống kê & Phân tích
      </h2>

      <div className={styles.chartControls}>
        <div className={styles.tabButtons}>
          <button
            className={`${styles.tabButton} ${
              activeTab === "weekly" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("weekly")}
          >
            Tuần này
          </button>
          <button
            className={`${styles.tabButton} ${
              activeTab === "monthly" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("monthly")}
          >
            Tháng này
          </button>
        </div>
      </div>

      <div className={styles.chartsContainer}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>
            {activeTab === "weekly" ? "Số lượng đặt phòng theo tuần" : "Số lượng đặt phòng theo ngày trong tháng"}
          </h3>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={70}
                  interval={activeTab === "monthly" ? 2 : 0}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value}`, "Đặt phòng"]}
                  labelStyle={{ color: "#1890ff" }}
                />
                <Legend />
                <Bar dataKey="bookings" fill="#1890ff" name="Số đặt phòng" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>
            {activeTab === "weekly" ? "Doanh thu theo tuần" : "Doanh thu theo ngày trong tháng"}
          </h3>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={70}
                  interval={activeTab === "monthly" ? 2 : 0}
                />
                <YAxis />
                <Tooltip
                  formatter={(value) => [
                    `${value.toLocaleString("vi-VN")}đ`,
                    "Doanh thu",
                  ]}
                  labelStyle={{ color: "#722ed1" }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#722ed1"
                  fill="#f9f0ff"
                  name="Doanh thu (VNĐ)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className={styles.bottomSection}>
        <div className={styles.reviewsCard}>
          <h3 className={styles.chartTitle}>Đánh giá gần đây</h3>
          <div className={styles.reviewsWrapper}>
            {!isLoading && feedback ? (
              <ReviewList reviews={feedback} />
            ) : (
              <Spin size="large" className={styles.loadingSpinner} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}