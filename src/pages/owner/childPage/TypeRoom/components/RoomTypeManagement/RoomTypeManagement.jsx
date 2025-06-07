import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Input,
  Dropdown,
  message,
  Tooltip,
  Select,
  InputNumber,
} from "antd";
import {
  MoreOutlined,
  PlusOutlined,
  FilterOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import styles from "./RoomTypeManagement.module.scss";
import DeleteRoomTypeModal from "./components/DeleteRoomTypeModal/DeleteRoomTypeModal";
import AddRoomTypeModal from "./components/AddRoomTypeModal/AddRoomTypeModal";
import UpdateRoomTypeModal from "./components/UpdateRoomTypeModal/UpdateRoomTypeModal";
import DetailRoomTypeModal from "./components/DetailRoomTypeModal/DetailRoomTypeModal";
import Filter from "./components/Filter/Filter";
import debounce from "lodash/debounce";
import {
  useGetAccommodationTypesByOwnerQuery,
  useCreateAccommodationTypeMutation,
  useUpdateAccommodationTypeMutation,
  useDeleteAccommodationTypeMutation,
} from "../../../../../../redux/services/accommodationTypeApi";
import {
  useGetAllAmenitiesQuery,
  useGetAmenityByIdQuery,
} from "../../../../../../redux/services/serviceApi";
import { Tag } from "antd";
import { useGetOwnerDetailByUserIdQuery } from "../../../../../../redux/services/ownerApi";
import { useParams } from "react-router-dom";
import { useMemo } from "react";

const RoomTypeManagement = ({ isOwner }) => {
  const { id } = useParams();
  const [selectedValues, setSelectedValues] = useState({
    maxOccupancy: [],
    priceRange: { min: null, max: null },
    serviceTypes: [],
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [serviceNames, setServiceNames] = useState({});
  const [isReloading, setIsReloading] = useState(false);

  const getOwnerIdFromStorage = () => {
    try {
      const storedOwnerId = localStorage.getItem("ownerId");
      return storedOwnerId;
    } catch (error) {
      console.error("Error getting ownerId from localStorage:", error);
      return null;
    }
  };

  const { data: ownerDetailData, isLoading: isOwnerDetailLoading } =
    useGetOwnerDetailByUserIdQuery(id);
  const ownerId = ownerDetailData?.id;

  const {
    data: roomTypesData,
    isLoading: isRoomTypesLoading,
    refetch,
  } = useGetAccommodationTypesByOwnerQuery(ownerId, {
    skip: !ownerId,
  });

  const storageOwnerId = getOwnerIdFromStorage();
  const { data: servicesData, isLoading: isServicesLoading } =
    useGetAllAmenitiesQuery(
      { ownerId: storageOwnerId },
      {
        skip: !storageOwnerId,
      }
    );

  const [createAccommodationType] = useCreateAccommodationTypeMutation();
  const [updateAccommodationType] = useUpdateAccommodationTypeMutation();
  const [deleteAccommodationType] = useDeleteAccommodationTypeMutation();

  const roomTypes = Array.isArray(roomTypesData?.data)
    ? roomTypesData.data
    : Array.isArray(roomTypesData)
    ? roomTypesData
    : [];
  const services = Array.isArray(servicesData?.data)
    ? servicesData.data
    : Array.isArray(servicesData)
    ? servicesData
    : [];

  useEffect(() => {
    const fetchServiceNames = async () => {
      const uniqueServiceIds = [
        ...new Set(filteredData.map((room) => room.serviceId)),
      ];
      const newServiceNames = { ...serviceNames };
      let hasChanges = false;

      for (const serviceId of uniqueServiceIds) {
        if (!serviceNames[serviceId]) {
          try {
            const response = await fetch(`/service/${serviceId}`);
            const data = await response.json();
            newServiceNames[serviceId] = data.name;
            hasChanges = true;
          } catch (error) {
            console.error(
              `Error fetching service name for ID ${serviceId}:`,
              error
            );
            newServiceNames[serviceId] = "Unknown Service";
          }
        }
      }

      if (hasChanges) {
        setServiceNames(newServiceNames);
      }
    };

    if (filteredData.length > 0) {
      fetchServiceNames();
    }
  }, [filteredData]);

  const filterGroups = useMemo(() => {
    if (!roomTypes.length) return [];

    const uniqueMaxPeople = [
      ...new Set(roomTypes.map((room) => room.maxPeopleNumber)),
    ]
      .filter((num) => num != null)
      .sort((a, b) => a - b)
      .map((num) => ({
        label: `${num} người`,
        value: num,
      }));

    return [
      {
        name: "maxOccupancy",
        title: "Số người tối đa",
        type: "checkbox",
        options: uniqueMaxPeople,
      },
      {
        name: "priceRange",
        title: "Khoảng giá",
        type: "range",
      },
      {
        name: "serviceTypes",
        title: "Loại dịch vụ",
        type: "checkbox",
        options: services.map((service) => ({
          label: service.name,
          value: service._id,
        })),
      },
    ];
  }, [roomTypes, services]);

  const handleFilterChange = (filterType, value) => {
    setSelectedValues((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    count += selectedValues.maxOccupancy.length;
    count += selectedValues.serviceTypes.length;
    if (selectedValues.priceRange.min || selectedValues.priceRange.max) {
      count += 1;
    }
    return count;
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRoomType?._id) {
      message.error("Không tìm thấy ID loại phòng");
      return;
    }

    try {
      await deleteAccommodationType(selectedRoomType._id).unwrap();
      message.success("Xóa loại phòng thành công");
      setIsDeleteModalOpen(false);
      setSelectedRoomType(null);
    } catch (error) {
      message.error(error?.data?.message || "Xóa loại phòng thất bại");
    }
  };

  const handleAddRoomType = async (values) => {
    try {
      const formattedValues = { ...values };
      if (formattedValues.serviceIds && formattedValues.serviceIds.length > 0) {
        formattedValues.serviceId = formattedValues.serviceIds[0];
      }

      console.log("Sending to API:", formattedValues);
      await createAccommodationType(formattedValues).unwrap();
      message.success("Thêm loại phòng thành công");
      setIsAddModalOpen(false);

      return Promise.resolve();
    } catch (error) {
      console.error("Error details:", error);

      return Promise.reject(error);
    }
  };

  const handleUpdateRoomType = async (values) => {
    try {
      await updateAccommodationType({
        id: selectedRoomType._id,
        ...values,
      }).unwrap();
      message.success("Cập nhật loại phòng thành công");
      setIsUpdateModalOpen(false);
      setSelectedRoomType(null);
    } catch (error) {
      message.error("Cập nhật loại phòng thất bại");
    }
  };

  const handleReload = async () => {
    try {
      setIsReloading(true);
      await refetch();
      message.success("Đã làm mới dữ liệu");
    } catch (error) {
      message.error("Làm mới thất bại");
    } finally {
      setIsReloading(false);
    }
  };

  const debouncedSearch = debounce((value) => {
    setSearchTerm(value);
  }, 500);

  useEffect(() => {
    if (!roomTypes.length) {
      setFilteredData([]);
      return;
    }

    let filtered = [...roomTypes];

    if (searchTerm) {
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedValues.maxOccupancy.length > 0) {
      filtered = filtered.filter((item) =>
        selectedValues.maxOccupancy.includes(item.maxPeopleNumber)
      );
    }

    if (
      selectedValues.priceRange.min !== null ||
      selectedValues.priceRange.max !== null
    ) {
      filtered = filtered.filter((item) => {
        const price = item.basePrice;
        const min = selectedValues.priceRange.min;
        const max = selectedValues.priceRange.max;

        if (min !== null && max !== null) {
          return price >= min && price <= max;
        } else if (min !== null) {
          return price >= min;
        } else if (max !== null) {
          return price <= max;
        }
        return true;
      });
    }

    if (selectedValues.serviceTypes.length > 0) {
      filtered = filtered.filter((item) => {
        if (item.serviceIds && Array.isArray(item.serviceIds)) {
          const serviceIdsInRoom = item.serviceIds.map((service) =>
            typeof service === "string" ? service : service._id
          );
          return selectedValues.serviceTypes.some((id) =>
            serviceIdsInRoom.includes(id)
          );
        } else if (item.serviceId) {
          return selectedValues.serviceTypes.includes(item.serviceId);
        }
        return false;
      });
    }

    setFilteredData(filtered);
  }, [searchTerm, selectedValues, roomTypes]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const customTagStyle = {
    borderRadius: "16px",
    padding: "4px 12px",
    fontSize: "12px",
    background: "#e2e3e5",
    color: "#343a40",
  };

  const menuItems = [
    {
      key: "1",
      label: "Chi tiết",
      onClick: (record) => {
        setSelectedRoomType(record);
        setIsDetailModalOpen(true);
      },
    },
    ...(isOwner
      ? [
          {
            key: "2",
            label: "Chỉnh sửa",
            onClick: (record) => {
              setSelectedRoomType(record);
              setIsUpdateModalOpen(true);
            },
          },
          {
            key: "3",
            label: "Xoá",
            danger: true,
            onClick: (record) => {
              setSelectedRoomType(record);
              setIsDeleteModalOpen(true);
            },
          },
        ]
      : []),
  ];

  const columns = [
    {
      title: "STT",
      dataIndex: "_id",
      key: "_id",
      align: "center",
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Tên loại phòng",
      dataIndex: "name",
      key: "name",
      align: "left",
      width: 150,
    },
    // {
    //   title: "Mô tả",
    //   dataIndex: "description",
    //   key: "description",
    //   align: "left",
    //   width: 200,
    //   ellipsis: true,
    //   render: (description) => (
    //     <Tooltip placement="topLeft" title={description}>
    //       {description || "N/A"}
    //     </Tooltip>
    //   ),
    // },
    {
      title: "Số người tối đa",
      dataIndex: "maxPeopleNumber",
      key: "maxPeopleNumber",
      align: "center",
      width: 120,
      render: (value) => value || "N/A",
    },
    {
      title: "Giá cơ bản",
      dataIndex: "basePrice",
      key: "basePrice",
      align: "center",
      width: 120,
      render: (price) => (price ? `${price.toLocaleString()}đ` : "N/A"),
    },
    {
      title: "Giá theo giờ",
      dataIndex: "overtimeHourlyPrice",
      key: "overtimeHourlyPrice",
      align: "center",
      width: 120,
      render: (price) => (price ? `${price.toLocaleString()}đ/giờ` : "N/A"),
    },
    {
      title: "Dịch vụ",
      dataIndex: "serviceIds",
      key: "serviceIds",
      align: "center",
      width: 100,
      render: (serviceIds, record) => {
        if (serviceIds && Array.isArray(serviceIds) && serviceIds.length > 0) {
          return <div style={customTagStyle}>{serviceIds.length} dịch vụ</div>;
        }
        if (record.serviceId) {
          return <div style={customTagStyle}>1 dịch vụ</div>;
        }
        return "N/A";
      },
    },
    {
      title: "",
      key: "operation",
      align: "center",
      width: 60,
      fixed: "right",
      render: (_, record) => (
        <Dropdown
          trigger={["click"]}
          menu={{
            items: menuItems.map((item) => ({
              ...item,
              onClick: () => item.onClick(record),
            })),
          }}
        >
          <MoreOutlined onClick={(e) => e.preventDefault()} />
        </Dropdown>
      ),
    },
  ];

  const isLoading =
    isRoomTypesLoading ||
    isServicesLoading ||
    isOwnerDetailLoading ||
    isReloading;

  return (
    <div className={styles.contentContainer}>
      <h1>Quản lý Loại Phòng</h1>
      <div className={styles.contentTable}>
        <div className={styles.tool}>
          <div className={styles.searchFilter}>
            <Input
              placeholder="Tìm kiếm tên loại phòng"
              onChange={(e) => debouncedSearch(e.target.value)}
              style={{ width: "250px" }}
            />
            <Dropdown
              trigger={["click"]}
              dropdownRender={() => (
                <Filter
                  filterGroups={filterGroups}
                  selectedValues={selectedValues}
                  onFilterChange={handleFilterChange}
                />
              )}
            >
              <Button icon={<FilterOutlined />}>
                Lọc
                {getActiveFiltersCount() > 0 && ` (${getActiveFiltersCount()})`}
              </Button>
            </Dropdown>
            <Button
              icon={<ReloadOutlined spin={isReloading} />}
              onClick={handleReload}
              loading={isReloading}
            >
              Làm mới
            </Button>
          </div>
          {isOwner && (
            <Button
              type="primary"
              onClick={() => setIsAddModalOpen(true)}
              icon={<PlusOutlined />}
              className={styles.addRoomButton}
            >
              Thêm loại phòng
            </Button>
          )}
        </div>

        <Table
          loading={isLoading}
          columns={columns}
          dataSource={filteredData}
          rowKey="_id"
          pagination={{
            total: filteredData.length,
            pageSize: 7,
            showSizeChanger: false,
            className: styles.customPagination,
          }}
          className={styles.reportTable}
        />

        <AddRoomTypeModal
          isOpen={isAddModalOpen}
          onCancel={() => setIsAddModalOpen(false)}
          onConfirm={handleAddRoomType}
          services={services}
        />

        <UpdateRoomTypeModal
          isOpen={isUpdateModalOpen}
          onCancel={() => {
            setIsUpdateModalOpen(false);
            setSelectedRoomType(null);
          }}
          onConfirm={handleUpdateRoomType}
          initialValues={{ _id: selectedRoomType?._id }}
          services={services}
        />

        <DetailRoomTypeModal
          isOpen={isDetailModalOpen}
          roomType={selectedRoomType}
          service={services.find((s) => s._id === selectedRoomType?.serviceId)}
          onCancel={() => {
            setIsDetailModalOpen(false);
            setSelectedRoomType(null);
          }}
        />

        <DeleteRoomTypeModal
          isOpen={isDeleteModalOpen}
          onCancel={() => {
            setIsDeleteModalOpen(false);
            setSelectedRoomType(null);
          }}
          onConfirm={handleDeleteConfirm}
          roomTypeName={selectedRoomType?.name}
        />
      </div>
    </div>
  );
};

export default RoomTypeManagement;
