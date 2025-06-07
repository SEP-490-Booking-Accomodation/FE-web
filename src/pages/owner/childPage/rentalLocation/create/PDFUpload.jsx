import { Upload, Button, message, Spin, Card, Typography } from "antd";
import { useState, useEffect } from "react";
import { supabase } from "../../../../../redux/services/supabase";
import { FilePdfOutlined, UploadOutlined } from "@ant-design/icons";

const { Text } = Typography;

export default function PDFUpload({ setPdfFile }) {
  const [uploading, setUploading] = useState(false);
  const [existingFile, setExistingFile] = useState(null);

  useEffect(() => {
    const fetchFiles = async () => {
      const { data, error } = await supabase.storage.from("business").list();
      if (error) {
        console.error("Lỗi khi lấy danh sách file:", error);
      } else if (data.length > 0) {
        setExistingFile(data[0].name);
      }
    };
    fetchFiles();
  }, []);

  // Hàm chuẩn hóa tên file (loại bỏ ký tự đặc biệt và giới hạn độ dài)
  const sanitizeFileName = (fileName) => {
    return fileName
      .replace(/[^a-zA-Z0-9.\-_]/g, "") // Chỉ giữ lại chữ, số, ".", "-", "_"
      .slice(-50); // Giới hạn tối đa 50 ký tự từ cuối file name
  };

  const uploadProps = {
    name: "file",
    accept: ".pdf",
    maxCount: 1,
    showUploadList: true,
    beforeUpload: (file) => {
      if (file.type !== "application/pdf") {
        message.error("Chỉ cho phép tải lên file PDF!");
        return Upload.LIST_IGNORE;
      }
      return true;
    },
    customRequest: async ({ file, onSuccess, onError }) => {
      setUploading(true);

      if (existingFile) {
        await supabase.storage.from("business").remove([existingFile]);
      }

      const fileName = sanitizeFileName(`${Date.now()}-${file.name}`);

      const { data, error } = await supabase.storage
        .from("business")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        message.error(
          "Tải file lên thất bại! Tên file có thể chứa ký tự không hợp lệ."
        );
        onError(error);
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("business")
        .getPublicUrl(data.path);

      if (urlData) {
        setPdfFile({ url: urlData.publicUrl, name: fileName });
        setExistingFile(fileName);
        message.success("Tải file lên thành công!");
        onSuccess("ok");
      } else {
        message.error("Không lấy được URL file!");
        onError("Lỗi lấy URL");
      }

      setUploading(false);
    },
    onRemove: async () => {
      if (existingFile) {
        await supabase.storage.from("pdf").remove([existingFile]);
        setExistingFile(null);
      }
      setPdfFile(null);
      message.success("Đã xóa file!");
    },
  };

  return (
    <Card style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
      <Spin spinning={uploading} tip="Đang tải file lên...">
        <div style={{ textAlign: "center", padding: "24px" }}>
          <FilePdfOutlined style={{ fontSize: "48px", color: "#1890ff", marginBottom: "16px" }} />
          <Text style={{ display: "block", marginBottom: "16px" }}>
            Tải lên file PDF giấy tờ pháp lý
          </Text>
          <Upload {...uploadProps} style={{ width: "100%" }}>
            <Button 
              type="primary" 
              icon={<UploadOutlined />}
              size="large"
              style={{ minWidth: "200px" }}
            >
              Chọn File PDF
            </Button>
          </Upload>
          <Text type="secondary" style={{ display: "block", marginTop: "16px", fontSize: "12px" }}>
            Chỉ chấp nhận file PDF, dung lượng tối đa 10MB
          </Text>
        </div>
      </Spin>
    </Card>
  );
}
