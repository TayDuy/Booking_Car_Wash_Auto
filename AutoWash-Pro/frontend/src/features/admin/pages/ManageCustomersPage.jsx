import React, { useEffect, useMemo, useState } from "react";
import { Search, Eye } from "lucide-react";
import customerApi from "../../../api/customerApi";
import "./ManageCustomersPage.css";

export default function ManageCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState("");
  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    try {
      const response = await customerApi.list();

      console.log("CUSTOMER API:", response.data);

      const result = response.data?.data || response.data || [];

      if (Array.isArray(result))
        setCustomers(result);
      else if (Array.isArray(result.content))
        setCustomers(result.content);
      else
        setCustomers([]);
    } catch (e) {
      console.error(e);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const text = [
        customer.fullName,
        customer.email,
        customer.phone,
        customer.customerId
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(keyword.toLowerCase());
    });
  }, [customers, keyword]);

  function handleViewCustomer(customer){
    alert(
      `ID: ${customer.customerId || "N/A"}\n` +
      `Họ và tên: ${customer.fullName || "N/A"}\n` +
      `Email: ${customer.email || "N/A"}\n` +
      `SĐT: ${customer.phone || "N/A"}\n` +
      `Điểm: ${customer.totalPoints ?? customer.loyaltyPoints ?? customer.points ?? 0}`
    );
  }
  return (
    <div className="manage-page">
      <div className="manage-header">
        <div>
          <h1>Quản lý khách hàng</h1>
          <p>Theo dõi thông tin khách hàng trong hệ thống.</p>
        </div>

        <button className="refresh-btn" onClick={loadCustomers}>
          Làm mới
        </button>
      </div>

      <div className="manage-toolbar">
        <div className="manage-search">
          <Search size={18} />

          <input
            placeholder="Tìm theo tên, email, số điện thoại..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
      </div>

      <div className="manage-card">
        {loading ? (
          <div className="empty-state">Đang tải danh sách khách hàng...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="empty-state">Không có khách hàng phù hợp.</div>
        ) : (
          <div className="booking-table-wrap">
            <table className="booking-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>ID</th>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>Số điện thoại</th>
                  <th>Điểm</th>
                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map((customer, index) => (
                  <tr key={customer.customerId || customer.id || index}>
                    <td>{index + 1}</td>
                    <td>{customer.customerId || "N/A"}</td>
                    <td>{customer.fullName || customer.name || "N/A"}</td>
                    <td>{customer.email || customer.user?.email || "N/A"}</td>
                    <td>{customer.phone || customer.user?.phone || "N/A"}</td>
                    <td>{customer.totalPoints ?? customer.loyaltyPoints ?? customer.points ?? 0}</td>
                    <td>
                      <button
                        className="action-btn view"
                        title="Xem chi tiết"
                        onClick={() => handleViewCustomer(customer)}
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
