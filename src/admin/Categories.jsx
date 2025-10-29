import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Popconfirm,
  message,
  Card,
  Typography,
  Flex, // Import Flex for better layout control
  Tooltip, // For helpful hints
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  QuestionCircleOutlined, // For Tooltip icon
} from "@ant-design/icons";
import { categoryAPI } from "../api"; // Đảm bảo đường dẫn này đúng

const { Title } = Typography;

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [editingCategory, setEditingCategory] = useState(null);

  // 🔄 Lấy danh sách category
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await categoryAPI.getAll();
      setCategories(res.data.data || res.data); // Xử lý cả paginate và non-paginate
    } catch (error) {
      console.error("Lỗi khi tải danh mục:", error);
      message.error("Không thể tải danh mục!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // 🧾 Mở modal thêm/sửa
  const openModal = (category = null) => {
    setEditingCategory(category);
    form.resetFields(); // Reset trước khi set
    if (category) {
      form.setFieldsValue(category);
    }
    setModalOpen(true);
  };

  // 💾 Submit form (thêm hoặc sửa)
  const handleSubmit = async (values) => {
    try {
      setLoading(true); // Bắt đầu loading khi submit
      if (editingCategory) {
        await categoryAPI.update(editingCategory.id, values);
        message.success("Cập nhật danh mục thành công!");
      } else {
        await categoryAPI.create(values);
        message.success("Thêm danh mục thành công!");
      }
      await fetchCategories(); // Chờ fetchCategories hoàn thành
      setModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error("Lỗi khi gửi form:", error);
      // Hiển thị thông báo lỗi chi tiết hơn nếu có từ API
      message.error(error.response?.data?.message || "Có lỗi xảy ra!");
    } finally {
      setLoading(false); // Kết thúc loading sau khi submit xong
    }
  };

  // 🗑️ Xoá danh mục
  const handleDelete = async (id) => {
    try {
      setLoading(true); // Bắt đầu loading khi xóa
      await categoryAPI.delete(id);
      message.success("Đã xóa danh mục!");
      await fetchCategories(); // Chờ fetchCategories hoàn thành
    } catch (error) {
      console.error("Lỗi khi xóa danh mục:", error);
      message.error(error.response?.data?.message || "Xóa thất bại!");
    } finally {
      setLoading(false); // Kết thúc loading sau khi xóa xong
    }
  };

  // 🧱 Cấu hình bảng
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 70,
      sorter: (a, b) => a.id - b.id, // Có thể thêm sắp xếp
    },
    {
      title: "Tên danh mục",
      dataIndex: "name",
      key: "name",
      // Có thể thêm filter
      // filters: categories.map(cat => ({ text: cat.name, value: cat.name })),
      // onFilter: (value, record) => record.name.indexOf(value) === 0,
      ellipsis: true, // Thêm dấu ... nếu tên quá dài
    },
    {
      title: "Slug",
      dataIndex: "slug",
      key: "slug",
      ellipsis: true,
    },
    {
      title: "Hành động",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            icon={<EditOutlined />}
            onClick={() => openModal(record)}
            aria-label="Sửa danh mục" // Thêm aria-label cho accessibility
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa danh mục này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            placement="topRight"
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              aria-label="Xóa danh mục"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          Quản lý danh mục
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
          Thêm danh mục mới
        </Button>
      </Flex>

      <Card bordered={false}>
        <Table
          columns={columns}
          dataSource={categories}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSizeOptions: ["10", "20", "50"], // Tùy chọn số lượng hàng trên mỗi trang
            showSizeChanger: true, // Cho phép người dùng thay đổi số lượng hàng
            showTotal: (total, range) => `${range[0]}-${range[1]} trên ${total} mục`, // Hiển thị tổng số mục
          }}
          scroll={{ x: 'max-content' }} // Đảm bảo bảng cuộn ngang nếu nội dung quá dài
          size="middle" // Kích thước bảng vừa phải
        />
      </Card>

      <Modal
        open={modalOpen}
        title={editingCategory ? "Cập nhật danh mục" : "Thêm danh mục mới"}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields(); // Reset form khi đóng modal bằng nút cancel
        }}
        onOk={() => form.submit()}
        okText={editingCategory ? "Cập nhật" : "Thêm mới"}
        cancelText="Hủy"
        confirmLoading={loading} // Hiển thị loading trên nút OK khi đang submit
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Tên danh mục"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập tên danh mục!" }]}
          >
            <Input placeholder="Ví dụ: Điện thoại, Laptop, Thời trang..." />
          </Form.Item>

          <Form.Item
            label={
              <Space>
                <span>Slug</span>
                <Tooltip title="Slug là phiên bản thân thiện với URL của tên danh mục. Chỉ chứa chữ thường, số và dấu gạch ngang (-). Nếu để trống, hệ thống sẽ tự động tạo.">
                  <QuestionCircleOutlined />
                </Tooltip>
              </Space>
            }
            name="slug"
            rules={[
              {
                pattern: /^[a-z0-9-]+$/,
                message: "Slug chỉ chứa chữ thường, số và dấu gạch ngang (-)",
              },
            ]}
          >
            <Input placeholder="Ví dụ: dien-thoai, thoi-trang-nam" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
    
  );
};

export default Categories;