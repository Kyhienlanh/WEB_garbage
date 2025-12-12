import { useState, useEffect } from 'react';
import { Trash2, Edit, Plus, X, Search, CheckCircle, XCircle, Eye, Calendar, TrendingUp } from 'lucide-react';
import ip from "@/data/ip";
const API_URL = `${ip}ScanHistories`;

export function ScanHistory() {
  const [scanHistories, setScanHistories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHistory, setEditingHistory] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchUserId, setSearchUserId] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [viewDetail, setViewDetail] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [formData, setFormData] = useState({
    userID: '',
    wasteID: '',
    img: '',
    base64: '',
    confidence: '',
    label: '',
    category: '',
    email:''
  });

  useEffect(() => {
    fetchScanHistories();
  }, []);

useEffect(() => {
  const delaySearch = setTimeout(() => {
    if (searchKeyword.trim()) {
      searchHistoriesByKeyword();
    } else {
      fetchScanHistories();
      setMonthlyStats(null);
    }
  }, 500);

  return () => clearTimeout(delaySearch);
}, [searchKeyword]);

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };
  const searchHistoriesByKeyword = async () => {
  setLoading(true);
  setError('');
  try {
    const response = await fetch(`${API_URL}/search?keyword=${encodeURIComponent(searchKeyword)}`);
    if (!response.ok) throw new Error('Không tìm thấy lịch sử cho từ khóa này');
    const data = await response.json();
    setScanHistories(data);
    setMonthlyStats(null);
  } catch (err) {
    setError(err.message);
    setScanHistories([]);
    setMonthlyStats(null);
  } finally {
    setLoading(false);
  }
};

  const fetchScanHistories = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Không thể tải dữ liệu');
      const data = await response.json();
      setScanHistories(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const searchHistoriesByUser = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/user/${searchUserId}`);
      if (!response.ok) throw new Error('Không tìm thấy lịch sử cho user này');
      const data = await response.json();
      const transformedData = data.map(item => ({
        scanID: item.historyscan.scanID,
        userID: searchUserId,
        wasteID: item.historyscan.wasteID,
        img: item.historyscan.img,
        label: item.historyscan.label,
        category: item.historyscan.category,
        confidence: item.historyscan.confidence,
        scannedAt: item.historyscan.scannedAt,
        wasteName: item.historyscan.name,
        wasteDescription: item.historyscan.description
      }));
      setScanHistories(transformedData);
      
      // Fetch monthly stats
      fetchMonthlyStats(searchUserId);
    } catch (err) {
      setError(err.message);
      setScanHistories([]);
      setMonthlyStats(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyStats = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/GetMonthlyStats/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setMonthlyStats(data);
      }
    } catch (err) {
      console.error('Error fetching monthly stats:', err);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      userID: formData.userID ? parseInt(formData.userID) : null,
      wasteID: formData.wasteID ? parseInt(formData.wasteID) : null,
      img: formData.img || null,
      base64: formData.base64 || null,
      confidence: formData.confidence || null,
      label: formData.label || null,
      category: formData.category || null,
      scannedAt: new Date().toISOString(),
      email: formData.email || null
    };

    try {
      if (editingHistory) {
        payload.scanID = editingHistory.scanID;
        const response = await fetch(`${API_URL}/${editingHistory.scanID}`, {
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
      showNotification(editingHistory ? 'Cập nhật thành công!' : 'Thêm mới thành công!', 'success');
      if (searchUserId.trim()) {
        searchHistoriesByUser();
      } else {
        fetchScanHistories();
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
        searchHistoriesByUser();
      } else {
        fetchScanHistories();
      }
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (history = null) => {
    if (history) {
      setEditingHistory(history);
      setFormData({
        userID: history.userID || '',
        wasteID: history.wasteID || '',
        img: history.img || '',
        base64: history.base64 || '',
        confidence: history.confidence || '',
        label: history.label || '',
        category: history.category || ''
      });
    } else {
      setEditingHistory(null);
      setFormData({ userID: '', wasteID: '', img: '', base64: '', confidence: '', label: '', category: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingHistory(null);
    setFormData({ userID: '', wasteID: '', img: '', base64: '', confidence: '', label: '', category: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6">
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

      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Quản lý Lịch sử phân loại rác</h1>
              <p className="text-gray-600 mt-1">Theo dõi lịch sử quét rác thải</p>
            </div>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition shadow-md hover:shadow-lg"
            >
              <Plus size={20} />
              Thêm mới
            </button>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              {/* <input
                type="number"
                placeholder="Tìm kiếm theo User ID..."
                value={searchUserId}
                onChange={(e) => setSearchUserId(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm"
              /> */}
              <input
                type="text"
                placeholder="Tìm kiếm theo User ID hoặc số đi"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm"
              />
            </div>
            <div className="flex gap-4 mt-3">
              {searchUserId && (
                <p className="text-sm text-gray-600">
                  Đang tìm kiếm cho User ID: <span className="font-semibold">{searchUserId}</span>
                </p>
              )}
              {monthlyStats && (
                <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
                  <TrendingUp className="text-blue-600" size={18} />
                  <span className="text-sm font-medium text-blue-800">
                    {monthlyStats.month}: {monthlyStats.scanCount} lượt scan
                  </span>
                </div>
              )}
            </div>
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
                  <th className="px-4 py-3 text-left">Mã quét rác</th>
                  <th className="px-4 py-3 text-left">Mã người dùng</th>
                   <th className="px-4 py-3 text-left">Số điện thoại</th>
                  <th className="px-4 py-3 text-left">Nhãn</th>
                  <th className="px-4 py-3 text-left">Loại</th>
                  <th className="px-4 py-3 text-left">Độ chính xác</th>
                  <th className="px-4 py-3 text-left">Thời gian </th>
                  <th className="px-4 py-3 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {scanHistories.map((history) => (
                  <tr key={history.scanID} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{history.scanID}</td>
                    <td className="px-4 py-3">{history.userID || 'N/A'}</td>
                     <td className="px-4 py-3">{history.email || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {history.label || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                        <span
                            className={`px-2 py-1 rounded text-sm ${
                            history.category === 'Tái chế'
                                ? 'bg-green-100 text-green-800'
                                : history.category === 'Hữu cơ'
                                ? 'bg-yellow-100 text-yellow-800'
                                : history.category === 'Nguy hại'
                                ? 'bg-red-100 text-red-800'
                                : history.category === 'General'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                        >
                            {history.category || 'N/A'}
                        </span>
                        </td>

                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-sm ${
                        parseFloat(history.confidence) > 0.8
                          ? 'bg-green-100 text-green-800' 
                          : parseFloat(history.confidence) > 0.5
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {history.confidence*100 ? `${history.confidence*100}%` : 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {new Date(history.scannedAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => setViewDetail(history)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                          title="Xem chi tiết"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => openModal(history)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Chỉnh sửa"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(history)}
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
            {scanHistories.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">Không có dữ liệu</div>
            )}
          </div>
        </div>
      </div>

      {/* View Detail Modal */}
      {viewDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Chi tiết Scan History</h2>
              <button onClick={() => setViewDetail(null)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {viewDetail.img && (
                <div className="mb-4">
                  <img 
                    src={viewDetail.img} 
                    alt="Scan" 
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Mã quét</label>
                  <p className="text-gray-900 font-semibold">{viewDetail.scanID}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Mã người dùng</label>
                  <p className="text-gray-900 font-semibold">{viewDetail.userID || 'N/A'}</p>
                </div>
                {/* <div>
                  <label className="text-sm font-medium text-gray-600">Waste ID</label>
                  <p className="text-gray-900 font-semibold">{viewDetail.wasteID || 'N/A'}</p>
                </div> */}
                <div>
                  <label className="text-sm font-medium text-gray-600">Nhãn</label>
                  <p className="text-gray-900 font-semibold">{viewDetail.label || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Loại</label>
                  <p className="text-gray-900 font-semibold">{viewDetail.category || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Độ chính xác</label>
                  <p className="text-gray-900 font-semibold">{viewDetail.confidence*100 || 'N/A'}%</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-600">Thời gian quét</label>
                  <p className="text-gray-900 font-semibold">
                    {new Date(viewDetail.scannedAt).toLocaleString('vi-VN')}
                  </p>
                </div>
                {viewDetail.wasteName && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-600">Waste Name</label>
                    <p className="text-gray-900 font-semibold">{viewDetail.wasteName}</p>
                  </div>
                )}
                {viewDetail.wasteDescription && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-600">Description</label>
                    <p className="text-gray-900">{viewDetail.wasteDescription}</p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setViewDetail(null)}
              className="w-full mt-6 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingHistory ? 'Cập nhật lịch sử quét' : 'Thêm mới lịch sử quét'}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã người dùng
                </label>
                <input
                  type="number"
                  value={formData.userID}
                  onChange={(e) => setFormData({ ...formData, userID: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Waste ID
                </label>
                <input
                  type="number"
                  value={formData.wasteID}
                  onChange={(e) => setFormData({ ...formData, wasteID: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div> */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nhãn
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Độ chính xác (0.1--0.99)
                </label>
                <input
                  type="text"
                  value={formData.confidence}
                  onChange={(e) => setFormData({ ...formData, confidence: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                   URL hình ảnh
                </label>
                <input
                  type="text"
                  value={formData.img}
                  onChange={(e) => setFormData({ ...formData, img: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base64 (Optional)
                </label>
                <textarea
                  value={formData.base64}
                  onChange={(e) => setFormData({ ...formData, base64: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div> */}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 shadow-md"
              >
                {loading ? 'Đang xử lý...' : editingHistory ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Xác nhận xóa</h3>
                <p className="text-sm text-gray-600">Bạn có chắc muốn xóa lịch sử scan này?</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Mã người dùng:</span> {deleteConfirm.scanID}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Nhãn:</span> {deleteConfirm.label || 'N/A'}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Loại:</span> {deleteConfirm.category || 'N/A'}
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
                  handleDelete(deleteConfirm.scanID);
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

export default ScanHistory;