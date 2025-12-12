import { useState, useEffect, useCallback } from 'react';
import { Trash2, Edit, Plus, X, Search, CheckCircle, XCircle } from 'lucide-react';
import ip from "@/data/ip";
const API_URL = `${ip}Rewards`;

// Danh sách các tùy chọn Category
const CATEGORY_OPTIONS = [
  { value: 'Hữu cơ', label: 'Hữu cơ' },
  { value: 'Tái chế', label: 'Tái chế' },
  { value: 'Nguy hại', label: 'Nguy hại' },
  { value: 'General', label: 'General' }
];

export default function RewardsCRUD() {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchUserId, setSearchUserId] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  
  const [formData, setFormData] = useState({
    userID: '',
    collectorID: '',
    pointsEarned: '',
    category: CATEGORY_OPTIONS[0].value // Thiết lập giá trị mặc định ban đầu
  });

  // --- Notification Logic (Top Right) ---
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };
  // ----------------------------------------

  useEffect(() => {
    fetchRewards();
  }, []);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchUserId.trim()) {
        searchRewardsByUser();
      } else {
        fetchRewards();
      }
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchUserId]);

  const fetchRewards = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Không thể tải dữ liệu');
      const data = await response.json();
      setRewards(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const searchRewardsByUser = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/user/${searchUserId}`);
      if (!response.ok) throw new Error('Không tìm thấy reward cho user này');
      const data = await response.json();
      setRewards(data);
    } catch (err) {
      setError(err.message);
      setRewards([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      userID: formData.userID ? parseInt(formData.userID) : null,
      collectorID: formData.collectorID ? parseInt(formData.collectorID) : null,
      pointsEarned: formData.pointsEarned ? parseInt(formData.pointsEarned) : null,
      category: formData.category || null,
      createdAt: new Date().toISOString()
    };

    try {
      if (editingReward) {
        payload.rewardID = editingReward.rewardID;
        const response = await fetch(`${API_URL}/${editingReward.rewardID}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Không thể cập nhật');
      } else {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Không thể thêm mới');
      }
      
      closeModal();
      showNotification(editingReward ? 'Cập nhật thành công!' : 'Thêm mới thành công!', 'success');
      if (searchUserId.trim()) {
        searchRewardsByUser();
      } else {
        fetchRewards();
      }
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Không thể xóa');
      showNotification('Xóa thành công!', 'success');
      if (searchUserId.trim()) {
        searchRewardsByUser();
      } else {
        fetchRewards();
      }
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (reward = null) => {
    if (reward) {
      setEditingReward(reward);
      setFormData({
        userID: reward.userID || '',
        collectorID: reward.collectorID || '',
        pointsEarned: reward.pointsEarned || '',
        category: reward.category || CATEGORY_OPTIONS[0].value // Giữ category hoặc giá trị mặc định
      });
    } else {
      setEditingReward(null);
      setFormData({ 
          userID: '', 
          collectorID: '', 
          pointsEarned: '', 
          category: CATEGORY_OPTIONS[0].value // Giá trị mặc định khi thêm mới
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingReward(null);
    setFormData({ userID: '', collectorID: '', pointsEarned: '', category: CATEGORY_OPTIONS[0].value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle size={24} />
          ) : (
            <XCircle size={24} />
          )}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Quản lý điểm thưởng</h1>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-md hover:shadow-lg"
            >
              <Plus size={20} />
              Thêm mới
            </button>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="number"
                placeholder="Tìm kiếm theo mã người dùng..."
                value={searchUserId}
                onChange={(e) => setSearchUserId(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              />
            </div>
            {searchUserId && (
              <p className="text-sm text-gray-600 mt-2">
                Đang tìm kiếm cho mã người dùng: <span className="font-semibold">{searchUserId}</span>
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {loading && <div className="text-center py-4">Đang tải...</div>}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Mã người dùng</th>
                  {/* <th className="px-4 py-3 text-left">Collector ID</th> */}
                  <th className="px-4 py-3 text-left">Điểm</th>
                  <th className="px-4 py-3 text-left">Loại</th>
                  <th className="px-4 py-3 text-left">Thời gian tạo</th>
                  <th className="px-4 py-3 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {rewards.map((reward) => (
                  <tr key={reward.rewardID} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{reward.rewardID}</td>
                    <td className="px-4 py-3">{reward.userID || 'N/A'}</td>
                    {/* <td className="px-4 py-3">{reward.collectorID || 'N/A'}</td> */}
                    <td className="px-4 py-3">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                        {reward.pointsEarned || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">{reward.category || 'N/A'}</td>
                    <td className="px-4 py-3">
                      {new Date(reward.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openModal(reward)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Chỉnh sửa"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(reward)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Xóa"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rewards.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">Không có dữ liệu</div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingReward ? 'Cập nhật Reward' : 'Thêm Reward mới'}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã người dùng
                </label>
                <input
                  type="number"
                  value={formData.userID}
                  onChange={(e) => setFormData({ ...formData, userID: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Collector ID
                </label>
                <input
                  type="number"
                  value={formData.collectorID}
                  onChange={(e) => setFormData({ ...formData, collectorID: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div> */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Điểm thưởng
                </label>
                <input
                  type="number"
                  value={formData.pointsEarned}
                  onChange={(e) => setFormData({ ...formData, pointsEarned: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                {/* SỬA ĐỔI: DÙNG SELECT VỚI CATEGORY_OPTIONS */}
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    {CATEGORY_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                {/* KẾT THÚC SỬA ĐỔI */}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 shadow-md"
              >
                {loading ? 'Đang xử lý...' : editingReward ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Xác nhận xóa</h3>
                <p className="text-sm text-gray-600">Bạn có chắc muốn xóa reward này?</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Mã điểm thưởng:</span> {deleteConfirm.rewardID}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Mã người dùng:</span> {deleteConfirm.userID || 'N/A'}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Điểm:</span> {deleteConfirm.pointsEarned || 0}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  handleDelete(deleteConfirm.rewardID);
                  setDeleteConfirm(null);
                }}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 shadow-md"
              >
                {loading ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}