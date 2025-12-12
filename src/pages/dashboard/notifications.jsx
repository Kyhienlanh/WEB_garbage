import {
  Typography,
  Alert,
  Card,
  CardHeader,
  CardBody,
} from "@material-tailwind/react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import ip from "@/data/ip";
import React, { useState, useEffect, useMemo } from "react";
const API_VOUCHER_USERS = `${ip}VoucherUsers`;
const API_USERS = `${ip}Users`;
const API_VOUCHERS = `${ip}Vouchers`;

export function Notifications() {
 const [voucherUsers, setVoucherUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentVoucherUser, setCurrentVoucherUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    idUserVoucher: 0,
    userID: "",
    voucherID: "",
  });

  useEffect(() => {
    fetchVoucherUsers();
    fetchUsers();
    fetchVouchers();
  }, []);

  // Fetch all voucher users
  const fetchVoucherUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_VOUCHER_USERS);
      if (!response.ok) throw new Error("Không thể tải dữ liệu voucher users");
      const data = await response.json();
      setVoucherUsers(data);
    } catch (error) {
      console.error("Lỗi khi tải voucher users:", error);
      alert("Không thể tải danh sách voucher users!");
    } finally {
      setLoading(false);
    }
  };

  // Fetch users for dropdown
  const fetchUsers = async () => {
    try {
      const response = await fetch(API_USERS);
      if (!response.ok) throw new Error("Không thể tải users");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Lỗi khi tải users:", error);
    }
  };

  // Fetch vouchers for dropdown
  const fetchVouchers = async () => {
    try {
      const response = await fetch(API_VOUCHERS);
      if (!response.ok) throw new Error("Không thể tải vouchers");
      const data = await response.json();
      setVouchers(data);
    } catch (error) {
      console.error("Lỗi khi tải vouchers:", error);
    }
  };

  const handleOpenDialog = (voucherUser = null) => {
    if (voucherUser) {
      setFormData({
        idUserVoucher: voucherUser.idUserVoucher,
        userID: voucherUser.userID || "",
        voucherID: voucherUser.voucherID || "",
      });
      setCurrentVoucherUser(voucherUser);
    } else {
      setFormData({
        idUserVoucher: 0,
        userID: "",
        voucherID: "",
      });
      setCurrentVoucherUser(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentVoucherUser(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.userID || !formData.voucherID) {
      alert("Vui lòng chọn User và Voucher!");
      return;
    }

    try {
      const payload = {
        ...formData,
        userID: parseInt(formData.userID),
        voucherID: parseInt(formData.voucherID),
      };

      if (currentVoucherUser) {
        // UPDATE
        const response = await fetch(`${API_VOUCHER_USERS}/${currentVoucherUser.idUserVoucher}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error("Không thể cập nhật voucher user");
        alert("Cập nhật voucher user thành công!");
      } else {
        // CREATE
        const response = await fetch(API_VOUCHER_USERS, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error("Không thể tạo voucher user");
        alert("Tạo voucher user thành công!");
      }

      fetchVoucherUsers();
      handleCloseDialog();
    } catch (error) {
      console.error("Lỗi:", error);
      alert(error.message);
    }
  };

  const handleDelete = async () => {
    if (!currentVoucherUser) return;

    try {
      const response = await fetch(`${API_VOUCHER_USERS}/${currentVoucherUser.idUserVoucher}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Không thể xóa voucher user");
      
      alert("Xóa voucher user thành công!");
      fetchVoucherUsers();
      setOpenDeleteDialog(false);
      setCurrentVoucherUser(null);
    } catch (error) {
      console.error("Lỗi:", error);
      alert(error.message);
    }
  };

  // Get user name by ID
  const getUserName = (userID) => {
    const user = users.find(u => u.userID === userID);
    return user ? user.fullName || user.email || `User #${userID}` : `User #${userID}`;
  };

  // Get voucher name by ID
  const getVoucherName = (voucherID) => {
    const voucher = vouchers.find(v => v.voucherID === voucherID);
    return voucher ? voucher.nameVoucher || `Voucher #${voucherID}` : `Voucher #${voucherID}`;
  };

  const filteredVoucherUsers = voucherUsers.filter((vu) => {
    const userName = getUserName(vu.userID).toLowerCase();
    const voucherName = getVoucherName(vu.voucherID).toLowerCase();
    const search = searchTerm.toLowerCase();
    return userName.includes(search) || voucherName.includes(search);
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Quản lý Voucher của người dùng</h1>
            <button
              onClick={() => handleOpenDialog()}
              className="flex items-center gap-2 bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors font-medium"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Gán Voucher
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên người dùng hoặc voucher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-y border-gray-200">
              <tr>
                {["ID", "Tên người dùng", "Voucher", "Mã người dùng", " Mã Voucher", "Hành động"].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredVoucherUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                filteredVoucherUsers.map((voucherUser) => (
                  <tr key={voucherUser.idUserVoucher} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      #{voucherUser.idUserVoucher}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {getUserName(voucherUser.userID)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-900">
                          {getVoucherName(voucherUser.voucherID)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {voucherUser.userID}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {voucherUser.voucherID}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenDialog(voucherUser)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            setCurrentVoucherUser(voucherUser);
                            setOpenDeleteDialog(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      {openDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {currentVoucherUser ? "Chỉnh sửa Voucher User" : "Gán Voucher cho User"}
              </h2>
              <button
                onClick={handleCloseDialog}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chọn User *
                </label>
                <select
                  name="userID"
                  value={formData.userID}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">-- Chọn User --</option>
                  {users.map((user) => (
                    <option key={user.userID} value={user.userID}>
                      {user.fullName || user.email || `User #${user.userID}`} (ID: {user.userID})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chọn Voucher *
                </label>
                <select
                  name="voucherID"
                  value={formData.voucherID}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">-- Chọn Voucher --</option>
                  {vouchers.map((voucher) => (
                    <option key={voucher.voucherID} value={voucher.voucherID}>
                      {voucher.nameVoucher || `Voucher #${voucher.voucherID}`} (ID: {voucher.voucherID})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={handleCloseDialog}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                {currentVoucherUser ? "Cập nhật" : "Tạo mới"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {openDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Xác nhận xóa</h2>
            </div>

            <div className="p-6">
              <p className="text-gray-700">
                Bạn có chắc chắn muốn xóa voucher user <strong>#{currentVoucherUser?.idUserVoucher}</strong>? 
                Hành động này không thể hoàn tác.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setOpenDeleteDialog(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default Notifications;
