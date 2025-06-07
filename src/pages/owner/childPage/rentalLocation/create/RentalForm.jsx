import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  message,
  Row,
  Col,
  Image,
  TimePicker,
  Checkbox,
  Card,
  Select,
} from "antd";
import { SaveOutlined, EnvironmentOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useCreateRentalLocationMutation } from "../../../../../redux/services/rentalApi";
import ImageUpload from "./ImageUpload";
import { Flex } from "antd";
import axios from "axios";
import styles from "../RentalLocation.module.scss";
import LocationMap from "../detail/components/LocationMap";

const { Option } = Select;
const { TextArea } = Input;

// Hằng số API
const PROVINCES_API_URL = "https://provinces.open-api.vn/api/p/";
const LOCATIONIQ_API_URL = "https://us1.locationiq.com/v1/search.php";
const DEFAULT_OPEN_HOUR = "06:00";
const DEFAULT_CLOSE_HOUR = "23:00";

// Hàm dịch vụ để sắp xếp các địa điểm theo alphabet Tiếng Việt
const sortByVietnameseName = (items) => {
  return items.sort((a, b) =>
    a.name.localeCompare(b.name, "vi", { sensitivity: "base" })
  );
};

export default function RentalForm({ ownerId, refetch }) {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // State cho form
  const [fileList, setFileList] = useState([]);
  const [isOverNight, setIsOverNight] = useState(true);

  useEffect(() => {
    if (isOverNight) {
      form.setFieldsValue({
        openHour: dayjs("00:00", "HH:mm"),
        closeHour: dayjs("23:59", "HH:mm"),
      });
    } else {
      form.setFieldsValue({
        openHour: dayjs(DEFAULT_OPEN_HOUR, "HH:mm"),
        closeHour: dayjs(DEFAULT_CLOSE_HOUR, "HH:mm"),
      });
    }
  }, [isOverNight, form]);

  const [locationData, setLocationData] = useState({
    provinces: [],
    districts: [],
    wards: [],
    selectedProvince: null,
    selectedDistrict: null,
    longitude: null,
    latitude: null,
    formattedAddress: "",
  });

  const [createRentalLocation, { isLoading }] =
    useCreateRentalLocationMutation();

  // Fetch tỉnh/thành phố khi component mount
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await axios.get(PROVINCES_API_URL);
        setLocationData((prev) => ({
          ...prev,
          provinces: sortByVietnameseName(response.data),
        }));
      } catch (error) {
        console.error("Lỗi khi lấy danh sách tỉnh/thành:", error);
        message.error(
          "Không thể tải danh sách tỉnh/thành. Vui lòng thử lại sau."
        );
      }
    };

    fetchProvinces();
  }, []);

  // Handler cho việc thay đổi tỉnh/thành phố
  const handleProvinceChange = useCallback(
    async (provinceCode) => {
      setLocationData((prev) => ({
        ...prev,
        selectedProvince: provinceCode,
        selectedDistrict: null,
        districts: [],
        wards: [],
      }));

      form.setFieldsValue({ district: null, ward: null });

      try {
        const response = await axios.get(
          `${PROVINCES_API_URL}${provinceCode}?depth=2`
        );

        setLocationData((prev) => ({
          ...prev,
          districts: sortByVietnameseName(response.data.districts),
        }));
      } catch (error) {
        console.error("Lỗi khi lấy danh sách quận/huyện:", error);
        message.error(
          "Không thể tải danh sách quận/huyện. Vui lòng thử lại sau."
        );
      }
    },
    [form]
  );

  // Handler cho việc thay đổi quận/huyện
  const handleDistrictChange = useCallback(
    async (districtCode) => {
      setLocationData((prev) => ({
        ...prev,
        selectedDistrict: districtCode,
      }));

      form.setFieldsValue({ ward: null });

      try {
        const response = await axios.get(
          `https://provinces.open-api.vn/api/d/${districtCode}?depth=2`
        );

        setLocationData((prev) => ({
          ...prev,
          wards: sortByVietnameseName(response.data.wards),
        }));
      } catch (error) {
        console.error("Lỗi khi lấy danh sách phường/xã:", error);
        message.error(
          "Không thể tải danh sách phường/xã. Vui lòng thử lại sau."
        );
      }
    },
    [form]
  );

  // Xử lý địa chỉ và tìm tọa độ
  const handleAddressBlur = useCallback(async () => {
    const { provinces, districts, wards } = locationData;
    const provinceCode = form.getFieldValue("province");
    const districtCode = form.getFieldValue("district");
    const wardCode = form.getFieldValue("ward");
    const detailAddress = form.getFieldValue("address")?.trim() || "";

    // Kiểm tra tính đầy đủ của dữ liệu
    if (!detailAddress || !provinceCode || !districtCode || !wardCode) {
      message.error("Vui lòng nhập đầy đủ thông tin địa chỉ.");
      return;
    }

    const provinceName =
      provinces.find((p) => p.code === provinceCode)?.name || "";
    const districtName =
      districts.find((d) => d.code === districtCode)?.name || "";
    const wardName = wards.find((w) => w.code === wardCode)?.name || "";
    const fullAddress = `${detailAddress}, ${wardName}, ${districtName}, ${provinceName}, Việt Nam`;

    try {
      const response = await axios.get(LOCATIONIQ_API_URL, {
        params: {
          key: import.meta.env.VITE_APP_LOCATIONIQ_API_KEY,
          q: fullAddress,
          format: "json",
        },
      });

      if (!response.data || response.data.length === 0) {
        message.error("Không tìm thấy địa chỉ, vui lòng kiểm tra lại.");
        return;
      }

      const location = response.data[0];

      setLocationData((prev) => ({
        ...prev,
        longitude: location.lon,
        latitude: location.lat,
        formattedAddress: location.display_name,
      }));

      form.setFieldsValue({ address: detailAddress });
      message.success("Địa chỉ đã được xác nhận thành công!");
    } catch (error) {
      console.error("Lỗi lấy tọa độ:", error);
      message.error("Không thể lấy tọa độ từ dịch vụ bản đồ.");
    }
  }, [form, locationData]);

  // Xử lý gửi form

  const handleSubmit = useCallback(
    async (values) => {
      const { provinces, districts, wards, longitude, latitude } = locationData;

      if (!ownerId) {
        message.error("Chỉ có Chủ Hộ mới được tạo địa điểm cho thuê");
        return;
      }

      // Kiểm tra dữ liệu
      if (fileList.length === 0) {
        message.error("Vui lòng tải lên ít nhất một hình ảnh.");
        return;
      }

      if (!longitude || !latitude) {
        message.error("Vui lòng kiểm tra địa chỉ để xác định tọa độ.");
        return;
      }

      const provinceName = provinces.find(
        (p) => p.code === values.province
      )?.name;
      const districtName = districts.find(
        (d) => d.code === values.district
      )?.name;
      const wardName = wards.find((w) => w.code === values.ward)?.name;

      // Kiểm tra thông tin địa chỉ
      if (!provinceName || !districtName || !wardName) {
        message.error("Lỗi khi lấy thông tin địa chỉ, vui lòng thử lại.");
        return;
      }

      const imageUrls = fileList.map((file) => file.url);

      // Chuẩn bị dữ liệu
      const formattedData = {
        ownerId,
        name: values.rentalName,
        description: values.description,
        landUsesRightsFile: null,
        image: imageUrls,
        address: values.address,
        ward: wardName,
        district: districtName,
        city: provinceName,
        longitude: parseFloat(longitude),
        latitude: parseFloat(latitude),
        openHour: values.openHour.format("HH:mm"),
        closeHour: values.closeHour.format("HH:mm"),
        isOverNight,
        status: 1,
      };

      try {
        const response = await createRentalLocation(formattedData).unwrap();
        message.success("Đã tạo địa điểm cho thuê thành công!");
        form.resetFields();
        setFileList([]);
        refetch();
        navigate(`/rental-location/${response._id}`);
      } catch (error) {
        console.error("Lỗi khi tạo địa điểm:", error);
        message.error(
          error?.data?.message ||
            "Tạo địa điểm cho thuê thất bại! Vui lòng thử lại."
        );
      }
    },
    [
      ownerId,
      fileList,
      locationData,
      createRentalLocation,
      form,
      refetch,
      navigate,
      isOverNight,
    ]
  );

  // Render các options cho Select
  const renderSelectOptions = (items) => {
    return items.map((item) => (
      <Option key={item.code} value={item.code}>
        {item.name}
      </Option>
    ));
  };

  // Format địa chỉ đầy đủ
  const getFullAddress = () => {
    const { provinces, districts, wards } = locationData;
    const provinceCode = form.getFieldValue("province");
    const districtCode = form.getFieldValue("district");
    const wardCode = form.getFieldValue("ward");
    const address = form.getFieldValue("address");

    if (!address) return "";

    const provinceName =
      provinces.find((p) => p.code === provinceCode)?.name || "";
    const districtName =
      districts.find((d) => d.code === districtCode)?.name || "";
    const wardName = wards.find((w) => w.code === wardCode)?.name || "";

    return `${address}, ${wardName}, ${districtName}, ${provinceName}`;
  };

  const {
    provinces,
    districts,
    wards,
    selectedProvince,
    selectedDistrict,
    longitude,
    latitude,
  } = locationData;

  const cardStyle = {
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    marginBottom: "24px"
  };

  const formItemStyle = {
    marginBottom: "16px"
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Flex gap={20} align="center" justify="space-between" style={formItemStyle}>
        <Button
          type="primary"
          htmlType="submit"
          icon={<SaveOutlined />}
          loading={isLoading}
          size="large"
          style={{ minWidth: "150px", marginLeft: "auto" }}
        >
          {isLoading ? "Đang lưu..." : "Lưu"}
        </Button>
      </Flex>

      {/* Thông tin cơ bản */}
      <Card title={<span style={{ fontSize: "18px", fontWeight: "600" }}>Thông tin địa điểm cho thuê</span>} 
            bordered={false} 
            style={cardStyle}
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={24} md={12}>
            <Row>
              <Col span={24}>
                <Form.Item
                  name="rentalName"
                  label={<span style={{ fontWeight: "500" }}>Tên địa điểm</span>}
                  rules={[
                    { required: true, message: "Vui lòng nhập tên địa điểm!" },
                  ]}
                  style={formItemStyle}
                >
                  <Input placeholder="Nhập tên địa điểm" size="large" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="description"
                  label={<span style={{ fontWeight: "500" }}>Mô tả</span>}
                  rules={[{ required: true, message: "Vui lòng nhập mô tả!" }]}
                  style={formItemStyle}
                >
                  <TextArea
                    rows={4}
                    placeholder="Nhập mô tả chi tiết về địa điểm"
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Col>

          {/* Thông tin địa chỉ và thời gian */}
          <Col xs={24} sm={24} md={12}>
            <Row gutter={[16, 16]}>
              {/* Địa chỉ */}
              <Col xs={24} sm={24} md={12}>
                <Form.Item
                  name="province"
                  label={<span style={{ fontWeight: "500" }}>Tỉnh/Thành phố</span>}
                  rules={[
                    { required: true, message: "Vui lòng chọn tỉnh/thành!" },
                  ]}
                  style={formItemStyle}
                >
                  <Select
                    placeholder="Chọn tỉnh/thành"
                    onChange={handleProvinceChange}
                    showSearch
                    size="large"
                    filterOption={(input, option) =>
                      option.children
                        .toLowerCase()
                        .indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {renderSelectOptions(provinces)}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={24} md={12}>
                <Form.Item
                  name="district"
                  label={<span style={{ fontWeight: "500" }}>Quận/Huyện</span>}
                  rules={[
                    { required: true, message: "Vui lòng chọn quận/huyện!" },
                  ]}
                  style={formItemStyle}
                >
                  <Select
                    placeholder="Chọn quận/huyện"
                    onChange={handleDistrictChange}
                    disabled={!selectedProvince}
                    showSearch
                    size="large"
                    filterOption={(input, option) =>
                      option.children
                        .toLowerCase()
                        .indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {renderSelectOptions(districts)}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={24} md={12}>
                <Form.Item
                  name="ward"
                  label={<span style={{ fontWeight: "500" }}>Phường/Xã</span>}
                  rules={[
                    { required: true, message: "Vui lòng chọn phường/xã!" },
                  ]}
                  style={formItemStyle}
                >
                  <Select
                    placeholder="Chọn phường/xã"
                    disabled={!selectedDistrict}
                    showSearch
                    size="large"
                    filterOption={(input, option) =>
                      option.children
                        .toLowerCase()
                        .indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {renderSelectOptions(wards)}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={24} md={12}>
                <Form.Item
                  name="address"
                  label={<span style={{ fontWeight: "500" }}>Địa chỉ chi tiết</span>}
                  rules={[
                    { required: true, message: "Vui lòng nhập địa chỉ!" },
                  ]}
                  style={formItemStyle}
                >
                  <Flex align="center" gap={8}>
                    <Input placeholder="Nhập số nhà, đường, khu vực" size="large" />
                    <Button
                      type="primary"
                      icon={<EnvironmentOutlined />}
                      onClick={handleAddressBlur}
                      title="Kiểm tra địa chỉ"
                      size="large"
                    />
                  </Flex>
                </Form.Item>
              </Col>

              {/* Thời gian hoạt động */}
              <Col xs={24} sm={24} md={12}>
                <Form.Item
                  name="openHour"
                  label={<span style={{ fontWeight: "500" }}>Giờ mở cửa</span>}
                  rules={[
                    { required: true, message: "Vui lòng chọn giờ mở cửa!" },
                  ]}
                  style={formItemStyle}
                >
                  <TimePicker
                    format="HH:mm"
                    style={{ width: "100%" }}
                    disabled={isOverNight}
                    size="large"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={24} md={12}>
                <Form.Item
                  name="closeHour"
                  label={<span style={{ fontWeight: "500" }}>Giờ đóng cửa</span>}
                  rules={[
                    { required: true, message: "Vui lòng chọn giờ đóng cửa!" },
                  ]}
                  style={formItemStyle}
                >
                  <TimePicker
                    format="HH:mm"
                    style={{ width: "100%" }}
                    disabled={isOverNight}
                    size="large"
                  />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item>
                  <Checkbox
                    checked={isOverNight}
                    onChange={(e) => setIsOverNight(e.target.checked)}
                  >
                    Hoạt động qua đêm
                  </Checkbox>
                </Form.Item>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {/* Hiển thị bản đồ và thông tin tọa độ */}
      <Card 
        title={<span style={{ fontSize: "18px", fontWeight: "600" }}>Thông tin tọa độ</span>} 
        bordered={false} 
        style={cardStyle}
      >
        <Row gutter={[24, 24]} align="middle">
          <Col md={24} xs={24}>
            <Flex vertical gap={16}>
              <Button
                type="primary"
                onClick={handleAddressBlur}
                icon={<EnvironmentOutlined />}
                size="large"
              >
                Xác nhận tọa độ từ địa chỉ
              </Button>

              <div style={{ background: "#f5f5f5", padding: "16px", borderRadius: "8px" }}>
                <p style={{ marginBottom: "8px" }}>
                  <strong>Địa chỉ đầy đủ:</strong> {getFullAddress()}
                </p>
                {longitude && latitude && (
                  <Flex gap={16}>
                    <p>
                      <strong>Tọa độ:</strong> ({longitude}, {latitude})
                      <span style={{ color: "#ff4d4f", marginLeft: "8px" }}>
                        Nếu địa chỉ trên bản đồ có sai với dự đoán, vui lòng kiểm tra kỹ thông tin trên google map
                      </span>
                    </p>
                  </Flex>
                )}
              </div>
            </Flex>
          </Col>
          <Col md={24} xs={24}>
            {latitude && longitude ? (
              <LocationMap latitude={latitude} longitude={longitude} />
            ) : (
              <div
                style={{
                  height: 300,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "8px",
                }}
              >
                <p>Vui lòng xác nhận địa chỉ để hiển thị bản đồ</p>
              </div>
            )}
          </Col>
        </Row>
      </Card>

      {/* Hình ảnh */}
      <Card
        title={<span style={{ fontSize: "18px", fontWeight: "600" }}>Hình ảnh địa điểm</span>}
        bordered={false}
        style={cardStyle}
      >
        <Form.Item
          rules={[
            {
              validator: () => {
                if (fileList.length === 0) {
                  return Promise.reject(
                    "Vui lòng tải lên ít nhất một hình ảnh"
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <ImageUpload fileList={fileList} setFileList={setFileList} />
        </Form.Item>
      </Card>
    </Form>
  );
}
