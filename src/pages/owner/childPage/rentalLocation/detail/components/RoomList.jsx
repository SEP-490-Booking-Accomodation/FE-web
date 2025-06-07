import { useState, useEffect } from "react";
import { Table, Button, message, Spin } from "antd";
import { IoMdAdd } from "react-icons/io";
import { ReloadOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import RoomTableColumns from "./RoomTable";
import RoomTypeFilter from "./RoomTypeFilter";
import SearchAndFilter from "./SearchAndFilter";
import {
  useGetAccommodationsByRentalLocationQuery,
  useGetAccommodationByIdQuery,
} from "../../../../../../redux/services/accommodationApi";
import AccommodationCreate from "../../../accomodation/childPage/AccomodationCreate/AccomodationCreate";
import AccomodationEdit from "../../../accomodation/childPage/AccomodationEdit/AccomodationEdit";
import AccommodationDetail from "../../../accomodation/childPage/AccomodationDetail/AccomodationDetail";
import styles from "./RoomList.module.scss";

export default function RoomList({ canEdit }) {
  const { id: rentalLocationId } = useParams();
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedRoomType, setSelectedRoomType] = useState("all");
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [selectedAccommodationId, setSelectedAccommodationId] = useState(null);
  const [accommodationData, setAccommodationData] = useState(null);
  const [roomTypes, setRoomTypes] = useState([]);
  const [isReloading, setIsReloading] = useState(false);
  const [existingRoomNumbers, setExistingRoomNumbers] = useState([]);

  const {
    data: accommodations,
    isLoading,
    isError,
    refetch,
  } = useGetAccommodationsByRentalLocationQuery(rentalLocationId);

  const {
    data: accommodationDetailResponse,
    isLoading: isLoadingDetail,
    refetch: refetchDetail,
  } = useGetAccommodationByIdQuery(selectedAccommodationId, {
    skip: !selectedAccommodationId,
  });

  useEffect(() => {
    if (accommodationDetailResponse) {
      setAccommodationData(accommodationDetailResponse);
    }
  }, [accommodationDetailResponse]);

  useEffect(() => {
    if (accommodations) {
      const uniqueRoomTypes = new Map();
      const roomNumbers = accommodations.map(
        (accommodation) => accommodation.roomNo
      );
      setExistingRoomNumbers(roomNumbers);

      accommodations.forEach((accommodation) => {
        if (accommodation.accommodationTypeId) {
          const typeId = accommodation.accommodationTypeId._id;
          if (!uniqueRoomTypes.has(typeId)) {
            uniqueRoomTypes.set(typeId, accommodation.accommodationTypeId);
          }
        }
      });

      setRoomTypes(Array.from(uniqueRoomTypes.values()));
    }
  }, [accommodations]);

  const handleDetailClick = (record) => {
    setSelectedAccommodationId(record.id);
    setAccommodationData(record);
    setDetailModalVisible(true);
    if (record.id) {
      refetchDetail();
    }
  };

  const handleEditClick = (record) => {
    setSelectedAccommodationId(record.id);
    setAccommodationData(record);
    refetchDetail();
    setUpdateModalVisible(true);
  };

  const handleEditFromDetail = (data) => {
    setAccommodationData(data);
    setUpdateModalVisible(true);
    setDetailModalVisible(false);
  };

  const handleCreateSuccess = () => {
    setCreateModalVisible(false);
    refetch();
  };

  const handleUpdateSuccess = () => {
    setUpdateModalVisible(false);
    refetch();
    if (detailModalVisible) {
      refetchDetail();
    }
  };

  const handleRoomTypeSelect = (typeId) => {
    setSelectedRoomType(typeId);
  };

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleReload = async () => {
    try {
      setIsReloading(true);
      await refetch();
      message.success("Dữ liệu đã được làm mới");
    } catch (error) {
      message.error("Làm mới dữ liệu thất bại");
    } finally {
      setIsReloading(false);
    }
  };

  if (isLoading)
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
        <p>Đang tải dữ liệu...</p>
      </div>
    );

  if (isError) {
    message.error("Tải danh sách phòng thất bại");
    return null;
  }

  const filteredData =
    accommodations?.filter((item) => {
      const matchesSearch =
        item.accommodationTypeId?.name
          ?.toLowerCase()
          ?.includes(searchText.toLowerCase()) ||
        item.roomNo?.toLowerCase()?.includes(searchText.toLowerCase()) ||
        false;

      const matchesRoomType =
        selectedRoomType === "all" ||
        (item.accommodationTypeId &&
          item.accommodationTypeId._id === selectedRoomType);

      const matchesStatus =
        filterStatus === "all" || item.status?.toString() === filterStatus;

      return matchesSearch && matchesRoomType && matchesStatus;
    }) || [];

  const sortedData = [...filteredData].sort((a, b) => {
    const roomA = a.roomNo.replace(/\D/g, "");
    const roomB = b.roomNo.replace(/\D/g, "");
    return Number.parseInt(roomA) - Number.parseInt(roomB);
  });

  return (
    <div className={styles.roomDashboard}>
      <RoomTypeFilter
        roomTypes={roomTypes}
        onSelectRoomType={handleRoomTypeSelect}
        selectedRoomType={selectedRoomType}
      />

      <div className={styles.contentContainer}>
        <div className={styles.headerContainer}>
          <h2>Danh Sách Phòng</h2>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <SearchAndFilter
              onSearch={handleSearch}
              onFilterChange={setFilterStatus}
            />
            <Button
              icon={<ReloadOutlined spin={isReloading} />}
              onClick={handleReload}
              loading={isReloading}
            >
              Làm mới
            </Button>
            {canEdit && (
              <Button
                type="primary"
                icon={<IoMdAdd />}
                onClick={() => setCreateModalVisible(true)}
              >
                Thêm Phòng
              </Button>
            )}
          </div>
        </div>

        <div className={styles.tableContainer}>
          <Table
            columns={RoomTableColumns({
              canEdit: canEdit,
              onDetailClick: handleDetailClick,
              onEditClick: handleEditClick,
            })}
            dataSource={sortedData}
            rowKey="id"
            loading={isLoading || isReloading}
            pagination={{
              total: sortedData.length,
              pageSize: 7,
              showSizeChanger: false,
              className: styles.customPagination,
              itemRender: (page, type, originalElement) => {
                const totalPages = Math.ceil(sortedData.length / 7);
                if (type === "prev") {
                  return (
                    <button
                      className={styles.paginationButton}
                      disabled={page === 0}
                    >
                      « Trước
                    </button>
                  );
                }
                if (type === "next") {
                  return (
                    <button
                      className={styles.paginationButton}
                      disabled={page >= totalPages}
                    >
                      Tiếp »
                    </button>
                  );
                }
                return originalElement;
              },
            }}
            className={styles.roomTable}
            scroll={{ x: "max-content" }}
          />
        </div>
      </div>

      <AccommodationCreate
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={handleCreateSuccess}
        rentalLocationId={rentalLocationId}
        existingRoomNumbers={existingRoomNumbers}
      />

      <AccommodationDetail
        canEdit={canEdit}
        visible={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        loading={isLoadingDetail}
        accommodationData={accommodationData}
        onEdit={handleEditFromDetail}
      />

      <AccomodationEdit
        visible={updateModalVisible}
        onCancel={() => setUpdateModalVisible(false)}
        onSuccess={handleUpdateSuccess}
        accommodationId={selectedAccommodationId}
        accommodationData={accommodationData}
        isLoading={isLoadingDetail}
        rentalLocationId={rentalLocationId}
        existingRoomNumbers={existingRoomNumbers}
      />
    </div>
  );
}
