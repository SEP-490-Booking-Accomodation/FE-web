import { useState, useEffect } from "react";
import { Form, Input, Button, Modal, message, Select, Spin } from "antd";
import {
  useCreateBankMutation,
  useUpdateBankMutation,
} from "../../../../../../redux/services/paymentInfoApi";

export default function BankInfo({ bankData, refetch }) {
  const userRole = localStorage.getItem("user_role")?.toLowerCase();
  const canEdit = userRole === `"owner"`;

  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();
  const [updateBank] = useUpdateBankMutation();
  const [createBank] = useCreateBankMutation();
  const [loading, setLoading] = useState(false);
  const [bankOptions, setBankOptions] = useState([]);

  useEffect(() => {
    fetchBanks();
  }, []);

  useEffect(() => {
    if (bankData) {
      form.setFieldsValue({
        bankName: bankData.bankName,
        bankNo: bankData.bankNo,
        bankAccountName: bankData.bankAccountName,
      });
    }
  }, [bankData, form]);

  const fetchBanks = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://api.vietqr.io/v2/banks");
      const json = await res.json();
      const options = json.data.map((bank) => ({
        label: bank.name,
        value: bank.name,
      }));
      setBankOptions(options);
    } catch (err) {
      console.error("Lỗi khi fetch ngân hàng:", err);
    }
    setLoading(false);
  };

  const hasBankInfo = bankData && bankData.bankName;

  if (!hasBankInfo && canEdit) {
    return (
      <NotHaveBank
        ownerId={bankData?.ownerId}
        createBank={createBank}
        refetch={refetch}
      />
    );
  } else if (!hasBankInfo) {
    return (
      <div>
        <p>Chưa có thông tin ngân hàng</p>
      </div>
    );
  }

  const handleSave = async () => {
    const values = await form.validateFields();

    const formUpdate = {
      ownerId: bankData.ownerId,
      bankName: values.bankName,
      bankNo: values.bankNo,
      bankAccountName: values.bankAccountName,
    };
    console.log(formUpdate);

    try {
      const result = await updateBank({
        id: bankData.bankId,
        data: formUpdate,
      }).unwrap();
      console.log(result);

      message.success("Cập nhật thông tin thành công!");
      setIsEditing(false);
      await refetch();
    } catch (error) {
      console.error("Update error:", error);
      message.error("Cập nhật thất bại, vui lòng thử lại!");
    }
  };

  const handleCancel = () => {
    form.setFieldsValue({
      bankName: bankData.bankName,
      bankNo: bankData.bankNo,
      bankAccountName: bankData.bankAccountName,
    });
    setIsEditing(false);
  };

  return (
    <div>
      <h3>Thông tin Tài Khoản Ngân Hàng</h3>
      <Form form={form} layout="vertical">
        <Form.Item
          label="Tên ngân hàng"
          name="bankName"
          rules={[{ required: true }]}
        >
          {isEditing ? (
            <Select
              loading={loading}
              showSearch
              placeholder="Chọn ngân hàng"
              optionFilterProp="label"
              options={bankOptions}
              filterOption={(input, option) =>
                option.label.toLowerCase().includes(input.toLowerCase())
              }
              notFoundContent={
                loading ? <Spin size="small" /> : "Không có kết quả"
              }
            />
          ) : (
            <Input readOnly />
          )}
        </Form.Item>

        <Form.Item
          label="Số tài khoản"
          name="bankNo"
          rules={[
            {
              required: true,
              pattern: /^[0-9]+$/,
              message: "Số tài khoản chỉ được chứa số!",
            },
          ]}
        >
          <Input readOnly={!isEditing} />
        </Form.Item>

        <Form.Item
          label="Tên chủ tài khoản"
          name="bankAccountName"
          rules={[
            { required: true, message: "Vui lòng nhập tên chủ tài khoản!" },
            {
              pattern: /^[A-Z\s]+$/,
              message: "Chỉ được nhập chữ in hoa không dấu!",
            },
          ]}
        >
          <Input
            readOnly={!isEditing}
            onChange={(e) => {
              const value = e.target.value
                .normalize("NFD") // Tách dấu ra khỏi ký tự
                .replace(/[\u0300-\u036f]/g, "") // Xóa dấu
                .toUpperCase(); // Chuyển thành in hoa
              form.setFieldsValue({ bankAccountName: value });
            }}
          />
        </Form.Item>
      </Form>

      <div
        style={{
          display: "flex",
          justifyContent: "end",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        {canEdit ? (
          isEditing ? (
            <>
              <Button type="primary" onClick={handleSave}>
                Lưu
              </Button>
              <Button onClick={handleCancel}>Thoát</Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Chỉnh sửa</Button>
          )
        ) : null}
      </div>
    </div>
  );
}

function NotHaveBank({ ownerId, createBank, refetch }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bankOptions, setBankOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://api.vietqr.io/v2/banks");
      const json = await res.json();
      const options = json.data.map((bank) => ({
        label: bank.name,
        value: bank.name,
      }));
      setBankOptions(options);
    } catch (err) {
      console.error("Lỗi khi fetch ngân hàng:", err);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      const bankDataSubmit = {
        ownerId: ownerId,
        bankName: values.bankName,
        bankNo: values.accountNumber,
        bankAccountName: values.accountHolder,
      };

      await createBank({ data: bankDataSubmit }).unwrap();
      message.success("Tạo tài khoản ngân hàng thành công!");
      setIsModalOpen(false);
      form.resetFields();
      await refetch();
    } catch (error) {
      message.error("Tạo tài khoản thất bại, vui lòng thử lại!");
    }
  };

  return (
    <div>
      <p>Bạn chưa thêm thông tin tài khoản ngân hàng.</p>
      <Button type="primary" onClick={() => setIsModalOpen(true)}>
        Thêm tài khoản ngân hàng
      </Button>
      <Modal
        title="Thêm tài khoản ngân hàng"
        open={isModalOpen}
        onOk={handleCreate}
        onCancel={() => setIsModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Tên ngân hàng"
            name="bankName"
            rules={[{ required: true, message: "Vui lòng chọn ngân hàng!" }]}
          >
            <Select
              loading={loading}
              showSearch
              placeholder="Chọn ngân hàng"
              optionFilterProp="label"
              options={bankOptions}
              filterOption={(input, option) =>
                option.label.toLowerCase().includes(input.toLowerCase())
              }
              notFoundContent={
                loading ? <Spin size="small" /> : "Không có kết quả"
              }
            />
          </Form.Item>
          <Form.Item
            label="Số tài khoản"
            name="accountNumber"
            rules={[
              { required: true, message: "Vui lòng nhập số tài khoản!" },
              {
                pattern: /^[0-9]+$/,
                message: "Số tài khoản chỉ được chứa chữ số!",
              },
            ]}
          >
            <Input />
          </Form.Item>
          {console.log("aaa")}
          <Form.Item
            label="Tên chủ tài khoản"
            name="accountHolder"
            rules={[
              { required: true, message: "Vui lòng nhập tên chủ tài khoản!" },
              {
                pattern: /^[A-Z\s]+$/,
                message: "Chỉ được nhập chữ in hoa không dấu và không có số!",
              },
            ]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
