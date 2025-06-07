import React, { useState, useEffect } from "react";
import {
  Button,
  Form,
  Select,
  Modal,
  message,
  Typography,
  Divider,
  Input,
  Radio,
  Space,
  Tooltip,
  Alert,
} from "antd";
import {
  SaveOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import TextArea from "antd/es/input/TextArea";
import { useLocation } from "react-router-dom";
import ImageUpload from "../../../rentalLocation/create/ImageUpload";
import {
  useCreateAccommodationMutation,
  useGetAccommodationsByRentalLocationQuery,
} from "../../../../../../redux/services/accommodationApi";
import { useGetAllAccommodationTypesQuery } from "../../../../../../redux/services/accommodationTypeApi";
import styles from "./AccomodationCreate.module.scss";
import AddRoomTypeModal from "../../../TypeRoom/components/RoomTypeManagement/components/AddRoomTypeModal/AddRoomTypeModal";
import { useCreateAccommodationTypeMutation } from "../../../../../../redux/services/accommodationTypeApi";
import { useGetOwnerDetailByUserIdQuery } from "../../../../../../redux/services/ownerApi";
import { useParams } from "react-router-dom";

const { Title, Text } = Typography;
const { Option } = Select;

export default function AccommodationCreate({
  visible,
  onCancel,
  onSuccess,
  existingRoomNumbers = [],
}) {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [isAddTypeModalOpen, setIsAddTypeModalOpen] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const [createMode, setCreateMode] = useState("single");
  const [isCreating, setIsCreating] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [filteredOutRooms, setFilteredOutRooms] = useState([]);
  const { id } = useParams();

  const location = useLocation();
  const pathnameParts = location.pathname.split("/");
  const rentalLocationId =
    pathnameParts[pathnameParts.indexOf("rental-location") + 1];

  const [createAccommodation, { isLoading }] = useCreateAccommodationMutation();
  const [createAccommodationType] = useCreateAccommodationTypeMutation();
  const { data: accommodationTypes, refetch: accommodationTypesRefetch } =
    useGetAllAccommodationTypesQuery(rentalLocationId);
  const { data: existingAccommodations } =
    useGetAccommodationsByRentalLocationQuery(rentalLocationId);
  const { data: ownerDetailData } = useGetOwnerDetailByUserIdQuery(id);

  const ownerId = ownerDetailData?.id;

  useEffect(() => {
    if (visible) {
      form.resetFields();
      setFileList([]);
      setCreateMode("single");
      setDuplicateWarning(null);
      setFilteredOutRooms([]);
    }
  }, [visible, form]);

  useEffect(() => {
    if (createMode === "single") {
      const roomNo = form.getFieldValue("roomNo");
      if (roomNo && existingRoomNumbers.includes(roomNo)) {
        setDuplicateWarning(`Số phòng "${roomNo}" đã tồn tại!`);
      } else {
        setDuplicateWarning(null);
      }
    }
  }, [form.getFieldValue("roomNo"), createMode, existingRoomNumbers]);

  const padRoomNumber = (num, length = 3) => {
    return String(num).padStart(length, "0");
  };

  const handleSaveAction = async (values) => {
    setIsCreating(true);
    try {
      if (createMode === "single") {
        // Check for duplicate room number
        if (existingRoomNumbers.includes(values.roomNo)) {
          message.error(`Số phòng "${values.roomNo}" đã tồn tại!`);
          setIsCreating(false);
          return;
        }

        const accommodationData = {
          rentalLocationId: rentalLocationId,
          accommodationTypeId: values.accommodationTypeId,
          roomNo: values.roomNo,
          description: values.description || "",
          image: fileList.length > 0 ? fileList[0].url : "",
          status: 1,
        };

        await createAccommodation(accommodationData).unwrap();
        message.success({
          content: "Tạo phòng thành công!",
          style: { marginTop: "20px" },
        });
      } else {
        const start = parseInt(values.startRoom, 10);
        const end = parseInt(values.endRoom, 10);
        const roomLength = Math.max(
          values.startRoom.length,
          values.endRoom.length
        );

        // Validate các điều kiện đầu vào
        if (isNaN(start) || isNaN(end)) {
          message.error("Số phòng không hợp lệ!");
          return;
        }

        if (start === end) {
          message.error("Số bắt đầu và kết thúc không được trùng nhau!");
          return;
        }

        const totalRooms = Math.abs(end - start) + 1;
        if (totalRooms > 20) {
          message.error("Chỉ được tạo tối đa 20 phòng mỗi lần!");
          return;
        }

        if (end > 999 || start > 999) {
          message.error("Số phòng không được vượt quá 999!");
          return;
        }

        // Tạo mảng các phòng cần tạo và lọc trùng
        const accommodations = [];
        const filteredOut = [];
        const [actualStart, actualEnd] =
          start < end ? [start, end] : [end, start];

        // Tạo Set các phòng đã tồn tại để tối ưu tốc độ kiểm tra
        const existingRoomsSet = new Set(existingRoomNumbers);

        for (let i = actualStart; i <= actualEnd; i++) {
          const paddedNumber = padRoomNumber(i, roomLength);

          // Kiểm tra trùng lặp và ghi nhớ các phòng bị loại bỏ
          if (existingRoomsSet.has(paddedNumber)) {
            filteredOut.push(paddedNumber);
          } else {
            accommodations.push({
              rentalLocationId: rentalLocationId,
              accommodationTypeId: values.accommodationTypeId,
              roomNo: paddedNumber,
              description: values.description || "",
              image: fileList.length > 0 ? fileList[0].url : "",
              status: 1,
            });
          }
        }

        setFilteredOutRooms(filteredOut);

        if (accommodations.length === 0) {
          message.warning("Tất cả các phòng trong dải này đã tồn tại!");
          setIsCreating(false);
          return;
        }

        try {
          await createAccommodation(accommodations).unwrap();

          if (filteredOut.length > 0) {
            message.success({
              content: `Đã tạo thành công ${accommodations.length} phòng! ${filteredOut.length} phòng đã bị bỏ qua do trùng lặp.`,
              style: { marginTop: "20px" },
            });
          } else {
            message.success({
              content: `Đã tạo thành công ${accommodations.length} phòng!`,
              style: { marginTop: "20px" },
            });
          }
        } catch (error) {
          console.error("Error creating accommodation:", error);
          message.error({
            content: "Có lỗi xảy ra khi tạo phòng!",
            style: { marginTop: "20px" },
          });
        }
      }

      onSuccess();
      form.resetFields();
      setFileList([]);
      setCreateMode("single");
      setDuplicateWarning(null);
      setFilteredOutRooms([]);
    } catch (error) {
      console.error("Error creating accommodation:", error);
      message.error({
        content: "Có lỗi xảy ra khi tạo phòng!",
        style: { marginTop: "20px" },
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddRoomType = async (values) => {
    try {
      const valuesWithLocation = {
        ...values,
        rentalLocationId: rentalLocationId,
      };

      await createAccommodationType(valuesWithLocation).unwrap();
      message.success("Loại phòng đã được thêm thành công!");

      setIsAddTypeModalOpen(false);

      await accommodationTypesRefetch();
    } catch (error) {
      message.error("Thêm loại phòng thất bại!");
    }
  };

  const formatPrice = (price) => {
    return price?.toLocaleString("vi-VN") || 0;
  };

  const checkRoomRangeDuplicates = () => {
    const startRoom = form.getFieldValue("startRoom");
    const endRoom = form.getFieldValue("endRoom");

    if (!startRoom || !endRoom) return;

    const start = parseInt(startRoom, 10);
    const end = parseInt(endRoom, 10);
    if (isNaN(start) || isNaN(end)) return;

    const roomLength = Math.max(startRoom.length, endRoom.length);
    const [actualStart, actualEnd] = start < end ? [start, end] : [end, start];

    const duplicates = [];

    for (let i = actualStart; i <= actualEnd; i++) {
      const paddedNumber = padRoomNumber(i, roomLength);
      if (existingRoomNumbers.includes(paddedNumber)) {
        duplicates.push(paddedNumber);
      }
    }

    if (duplicates.length > 0) {
      setFilteredOutRooms(duplicates);
      setDuplicateWarning(
        `${
          duplicates.length
        } phòng trong dải này đã tồn tại và sẽ bị bỏ qua: ${duplicates
          .slice(0, 5)
          .join(", ")}${duplicates.length > 5 ? "..." : ""}`
      );
    } else {
      setFilteredOutRooms([]);
      setDuplicateWarning(null);
    }
  };

  return (
    <>
      <Modal
        title={
          <Title level={4} className={styles.modalTitle}>
            Tạo thông tin phòng
          </Title>
        }
        open={visible}
        onCancel={onCancel}
        width={800}
        footer={null}
        destroyOnClose
        bodyStyle={{ padding: "20px" }}
      >
        <Divider className={styles.modalDivider} />

        <Form
          form={form}
          onFinish={handleSaveAction}
          initialValues={{ status: true, createMode: "single" }}
          layout="vertical"
          className={styles.formContainer}
        >
          <div className={styles.createModeSelector}>
            <Form.Item
              name="createMode"
              label={
                <Space>
                  <Text strong>Chế độ tạo phòng</Text>
                  <Tooltip title="Chọn 'Tạo nhiều phòng' để tạo một loạt các phòng có cùng tính năng với số phòng liên tiếp">
                    <QuestionCircleOutlined />
                  </Tooltip>
                </Space>
              }
            >
              <Radio.Group
                onChange={(e) => {
                  setCreateMode(e.target.value);
                  setDuplicateWarning(null);
                  setFilteredOutRooms([]);
                }}
                value={createMode}
              >
                <Radio value="single">Tạo một phòng</Radio>
                <Radio value="batch">Tạo nhiều phòng</Radio>
              </Radio.Group>
            </Form.Item>
          </div>

          <div className={styles.formSection}>
            <Form.Item
              name="accommodationTypeId"
              label={<Text strong>Loại phòng</Text>}
              rules={[{ required: true, message: "Vui lòng chọn loại phòng!" }]}
            >
              <Select
                placeholder="Chọn loại phòng"
                size="large"
                style={{ width: "100%" }}
                optionLabelProp="label"
                dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
                open={selectOpen}
                onDropdownVisibleChange={(open) => setSelectOpen(open)}
                dropdownRender={(menu) => (
                  <>
                    {menu}
                    <Divider style={{ margin: "4px 0" }} />
                    <div
                      style={{
                        padding: "8px",
                        cursor: "pointer",
                        color: "#1890ff",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                      onClick={() => {
                        setSelectOpen(false);
                        setIsAddTypeModalOpen(true);
                      }}
                    >
                      <PlusOutlined />
                      <Text strong>Thêm loại phòng mới</Text>
                    </div>
                  </>
                )}
              >
                {accommodationTypes?.data?.map((type) => (
                  <Option key={type._id} value={type._id} label={type.name}>
                    <div className={styles.optionContent}>
                      <div className={styles.optionHeader}>
                        <span className={styles.typeName}>{type.name}</span>
                        <span className={styles.prices}>
                          Base Price: {formatPrice(type.basePrice)}đ - Overtime
                          Hourly Price: {formatPrice(type.overtimeHourlyPrice)}
                          đ/giờ
                        </span>
                      </div>
                      {type.serviceIds?.length > 0 && (
                        <div className={styles.services}>
                          <Text type="secondary">
                            Dịch vụ:{" "}
                            {type.serviceIds.map((s) => s.name).join(", ")}
                          </Text>
                        </div>
                      )}
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {createMode === "single" ? (
              <Form.Item
                name="roomNo"
                label={<Text strong>Số phòng</Text>}
                rules={[
                  { required: true, message: "Vui lòng nhập số phòng!" },
                  {
                    pattern: /^\d+$/,
                    message: "Chỉ được nhập số nguyên dương!",
                  },
                  {
                    validator: (_, value) => {
                      // Kiểm tra số âm
                      if (value && parseInt(value) < 0) {
                        return Promise.reject(
                          new Error("Không được nhập số âm!")
                        );
                      }
                      // Kiểm tra trùng lặp
                      if (existingRoomNumbers.includes(value)) {
                        return Promise.reject(
                          new Error("Số phòng này đã tồn tại!")
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input
                  placeholder="Nhập số phòng (vd: 001)"
                  size="large"
                  className={styles.inputField}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (existingRoomNumbers.includes(value)) {
                      setDuplicateWarning(`Số phòng "${value}" đã tồn tại!`);
                    } else {
                      setDuplicateWarning(null);
                    }
                  }}
                />
              </Form.Item>
            ) : (
              <div className={styles.batchRoomNumbers}>
                <Form.Item
                  name="startRoom"
                  label={<Text strong>Từ số phòng</Text>}
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng nhập số phòng bắt đầu!",
                    },
                    {
                      pattern: /^\d+$/,
                      message: "Chỉ được nhập số nguyên dương!",
                    },
                    {
                      validator: (_, value) => {
                        const numValue = parseInt(value, 10);
                        if (numValue < 0) {
                          return Promise.reject(
                            new Error("Không được nhập số âm!")
                          );
                        }
                        if (numValue > 999) {
                          return Promise.reject(
                            new Error("Số phòng tối đa là 999!")
                          );
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                  style={{
                    display: "inline-block",
                    width: "calc(50% - 12px)",
                    marginRight: "24px",
                  }}
                >
                  <Input
                    placeholder="Vd: 001"
                    size="large"
                    onBlur={(e) => {
                      const value = e.target.value;
                      if (value) {
                        const padded = value.padStart(value.length, "0");
                        form.setFieldsValue({ startRoom: padded });
                        checkRoomRangeDuplicates();
                      }
                    }}
                  />
                </Form.Item>

                <Form.Item
                  name="endRoom"
                  label={<Text strong>Đến số phòng</Text>}
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng nhập số phòng kết thúc!",
                    },
                    {
                      pattern: /^\d+$/,
                      message: "Chỉ được nhập số nguyên dương!",
                    },
                    {
                      validator: (_, value) => {
                        const start = form.getFieldValue("startRoom");
                        const numValue = parseInt(value, 10);
                        if (numValue < 0) {
                          return Promise.reject(
                            new Error("Không được nhập số âm!")
                          );
                        }
                        if (numValue > 999) {
                          return Promise.reject(
                            new Error("Số phòng tối đa là 999!")
                          );
                        }
                        if (start && numValue === parseInt(start, 10)) {
                          return Promise.reject(
                            new Error(
                              "Số bắt đầu và kết thúc không được trùng nhau!"
                            )
                          );
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                  style={{ display: "inline-block", width: "calc(50% - 12px)" }}
                >
                  <Input
                    placeholder="Vd: 010"
                    size="large"
                    onBlur={(e) => {
                      const value = e.target.value;
                      if (value) {
                        const padded = value.padStart(value.length, "0");
                        form.setFieldsValue({ endRoom: padded });
                        checkRoomRangeDuplicates();
                      }
                    }}
                  />
                </Form.Item>

                <Alert
                  message={
                    <div className={styles.batchHint}>
                      <Text>
                        Hệ thống sẽ tự động bỏ qua các phòng đã tồn tại. <br />
                        Số phòng cho phép nhập số 0 ở đầu (vd: 001). <br />
                        Tối đa 20 phòng/lần, số phòng không vượt quá 999.
                      </Text>
                    </div>
                  }
                  type="info"
                  showIcon
                  icon={<InfoCircleOutlined />}
                  style={{ marginBottom: "16px", marginTop: "8px" }}
                />
              </div>
            )}

            {duplicateWarning && (
              <Alert
                message="Cảnh báo trùng lặp"
                description={duplicateWarning}
                type="warning"
                showIcon
                style={{ marginBottom: "16px" }}
              />
            )}

            <Form.Item name="description" label={<Text strong>Mô tả</Text>}>
              <TextArea
                rows={4}
                placeholder="Tối đa 255 ký tự"
                maxLength={255}
                showCount
                className={styles.textArea}
              />
            </Form.Item>
          </div>

          <div className={styles.imageUploadSection}>
            <Form.Item label={<Text strong>Hình ảnh phòng</Text>}>
              <ImageUpload fileList={fileList} setFileList={setFileList} />
              <Alert
                message={
                  <Text type="secondary">
                    {createMode === "single"
                      ? "Ảnh đầu tiên sẽ được sử dụng làm ảnh chính"
                      : "Tất cả các phòng sẽ sử dụng cùng một hình ảnh"}
                  </Text>
                }
                type="info"
                showIcon
                icon={<InfoCircleOutlined />}
                style={{ marginTop: "8px" }}
              />
            </Form.Item>
          </div>

          <div className={styles.footerButtons}>
            <Button
              onClick={onCancel}
              size="large"
              className={styles.cancelButton}
              disabled={isCreating}
            >
              Huỷ
            </Button>
            <Button
              icon={<SaveOutlined />}
              htmlType="submit"
              loading={isLoading || isCreating}
              className={styles.saveButton}
              size="large"
            >
              {createMode === "single" ? "Lưu lại" : "Tạo phòng hàng loạt"}
            </Button>
          </div>
        </Form>
      </Modal>

      <AddRoomTypeModal
        isOpen={isAddTypeModalOpen}
        onCancel={() => setIsAddTypeModalOpen(false)}
        onConfirm={handleAddRoomType}
        rentalLocationId={rentalLocationId}
        ownerId={ownerId}
        forceRender
      />
    </>
  );
}
