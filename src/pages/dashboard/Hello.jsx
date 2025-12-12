import { useState, useEffect } from 'react';

// Custom Icons (không cần lucide-react)
const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const XIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);
import ip from "@/data/ip";
export function Hello() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    userID: 0,
    fullName: '',
    email: '',
    passwordHash: '',
    points: 0,
    userIDfireBase: '',
    otp: ''
  });

  // Thay đổi URL API của bạn ở đây
  const API_BASE_URL = `${ip}Users`;

  // READ - Lấy danh sách users khi component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_BASE_URL);
      const json = await response.json();
      setUsers(json);
      console.log('Danh sách users:', json);
    } catch (error) {
      console.error('Lỗi khi tải users:', error);
      alert('Không thể tải danh sách users. Kiểm tra console để xem chi tiết lỗi.');
    } finally {
      setLoading(false);
    }
  };

  // CREATE - Thêm user mới
  const createUser = async () => {
    if (!formData.fullName || !formData.email || !formData.passwordHash) {
      alert('Vui lòng điền đầy đủ họ tên, số điện thoại và mật khẩu!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          passwordHash: formData.passwordHash,
          points: formData.points,
          userIDfireBase: formData.userIDfireBase,
          otp: formData.otp
        }),
      });

      if (response.ok) {
        const newUser = await response.json();
        console.log('User mới được tạo:', newUser);
        alert('✅ Thêm user thành công!');
        fetchUsers();
        closeModal();
      } else {
        const errorText = await response.text();
        console.error('Lỗi:', errorText);
        alert('❌ Có lỗi xảy ra khi thêm user');
      }
    } catch (error) {
      console.error('Lỗi khi tạo user:', error);
      alert('❌ Không thể kết nối đến API');
    } finally {
      setLoading(false);
    }
  };

  // UPDATE - Cập nhật user
  const updateUser = async () => {
    if (!formData.fullName || !formData.email || !formData.passwordHash) {
      alert('Vui lòng điền đầy đủ họ tên, số điện thoại và mật khẩu!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/${formData.userID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok || response.status === 204) {
        console.log('User đã được cập nhật:', formData);
        alert('✅ Cập nhật user thành công!');
        fetchUsers();
        closeModal();
      } else {
        const errorText = await response.text();
        console.error('Lỗi:', errorText);
        alert('❌ Có lỗi xảy ra khi cập nhật user');
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật user:', error);
      alert('❌ Không thể kết nối đến API');
    } finally {
      setLoading(false);
    }
  };

  // DELETE - Xóa user
  const deleteUser = async (id) => {
    if (!window.confirm('⚠️ Bạn có chắc chắn muốn xóa user này?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      });

      if (response.ok || response.status === 204) {
        console.log('User đã được xóa, ID:', id);
        alert('✅ Xóa user thành công!');
        fetchUsers();
      } else {
        const errorText = await response.text();
        console.error('Lỗi:', errorText);
        alert('❌ Có lỗi xảy ra khi xóa user');
      }
    } catch (error) {
      console.error('Lỗi khi xóa user:', error);
      alert('❌ Không thể kết nối đến API');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditMode(false);
    setFormData({
      userID: 0,
      fullName: '',
      email: '',
      passwordHash: '',
      points: 0,
      userIDfireBase: '',
      otp: ''
    });
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditMode(true);
    setFormData({
      userID: user.userID,
      fullName: user.fullName,
      email: user.email,
      passwordHash: user.passwordHash,
      points: user.points,
      userIDfireBase: user.userIDfireBase || '',
      otp: user.otp || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      userID: 0,
      fullName: '',
      email: '',
      passwordHash: '',
      points: 0,
      userIDfireBase: '',
      otp: ''
    });
  };

  const handleSubmit = () => {
    if (editMode) {
      updateUser();
    } else {
      createUser();
    }
  };

  const filteredUsers = users.filter(user =>
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mt-12 mb-8 flex flex-col gap-12">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">🧑‍💼 Quản lý người dùng</h1>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            {/* Search */}
            <div className="relative w-full sm:w-96">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc số điện thoại..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={fetchUsers}
                className="flex-1 sm:flex-initial bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RefreshIcon />
                Tải lại
              </button>
              <button
                onClick={openCreateModal}
                className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <PlusIcon />
                Thêm User
              </button>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Tổng số người dùng: <span className="font-semibold text-blue-600">{filteredUsers.length}</span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Họ tên</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số điện thoại</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Điểm</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Firebase UID</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                        {users.length === 0 ? '📭 Chưa có user nào' : '🔍 Không tìm thấy kết quả'}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.userID} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                          #{user.userID}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.fullName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ⭐ {user.points} điểm
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 max-w-xs truncate">
                          {user.userIDfireBase || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <button
                            onClick={() => openEditModal(user)}
                            className="text-blue-600 hover:text-blue-900 mr-4 inline-flex items-center gap-1 transition-colors"
                          >
                            <EditIcon />
                            Sửa
                          </button>
                          <button
                            onClick={() => deleteUser(user.userID)}
                            className="text-red-600 hover:text-red-900 inline-flex items-center gap-1 transition-colors"
                          >
                            <TrashIcon />
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-50 to-blue-100">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editMode ? '✏️ Chỉnh sửa User' : '➕ Thêm User mới'}
                </h2>
                <button 
                  onClick={closeModal} 
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XIcon />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Họ tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Nguyễn Văn A"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="+84123456789"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      placeholder="********"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.passwordHash}
                      onChange={(e) => setFormData({...formData, passwordHash: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Điểm
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.points}
                      onChange={(e) => setFormData({...formData, points: parseInt(e.target.value) || 0})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Firebase UID
                    </label>
                    <input
                      type="text"
                      placeholder="firebase_uid_123"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.userIDfireBase}
                      onChange={(e) => setFormData({...formData, userIDfireBase: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      OTP
                    </label>
                    <input
                      type="text"
                      placeholder="123456"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.otp}
                      onChange={(e) => setFormData({...formData, otp: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '⏳ Đang xử lý...' : (editMode ? '💾 Cập nhật' : '➕ Thêm mới')}
                  </button>
                  <button
                    onClick={closeModal}
                    disabled={loading}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    ❌ Hủy
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Hello;