import { Calendar, MapPin, Trash2, Plus, Edit, X, Table, Map, Save, Loader, Filter, Check, Mail, AlertTriangle, Info, Zap, Clock, History } from 'lucide-react';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ip from "@/data/ip";

const API_BASE_URL = `${ip}WasteCollectionSchedules`;

const wasteTypes = [
  'Hữu cơ',
  'Tái chế',
  'Nguy hại',
  'General',
];

// Danh sách trạng thái chuẩn từ Database
const statuses = ['Pending', 'Scheduled', 'Completed', 'Cancelled'];

// --- TOAST NOTIFICATION COMPONENT ---
const ToastNotification = ({ message, type, onClose }) => {
    if (!message) return null;

    // Góc trên bên phải
    const baseClasses = "fixed top-5 right-5 p-4 rounded-lg shadow-xl z-[1000] flex items-center gap-3 transition-all duration-300 transform";
    let icon;
    let colorClasses;

    switch (type) {
        case 'success':
            icon = <Check className="w-5 h-5" />;
            colorClasses = "bg-green-600 text-white";
            break;
        case 'error':
            icon = <AlertTriangle className="w-5 h-5" />;
            colorClasses = "bg-red-600 text-white";
            break;
        case 'info':
        default:
            icon = <Info className="w-5 h-5" />;
            colorClasses = "bg-blue-600 text-white";
            break;
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000); // Ẩn sau 5 giây
        return () => clearTimeout(timer);
    }, [message, onClose]);

    return (
        <div className={`${baseClasses} ${colorClasses}`}>
            {icon}
            <span className="font-medium">{message}</span>
            <button onClick={onClose} className="ml-4 opacity-75 hover:opacity-100">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};
// --- END TOAST COMPONENT ---


export default function WasteScheduleManager() {
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(1032);
  
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const showToast = (message, type = 'info') => {
      setToast({ message, type });
  };
  const closeToast = useCallback(() => {
      setToast({ message: '', type: 'info' });
  }, []);
  
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  
  const pendingSchedules = filteredSchedules.filter(s => 
    s.status === 'Pending' || s.status === 'Scheduled'
  );

  const [formData, setFormData] = useState({
    userID: 1032,
    latitude: 10.8231,
    longitude: 106.6297,
    wasteType: 'Rác sinh hoạt',
    scheduledDate: '',
    status: 'Pending',
    notes: ''
  });
  const [selectedMarker, setSelectedMarker] = useState(null);

  // --- HÀM ÁNH XẠ TRẠNG THÁI (TIẾNG ANH -> TIẾNG VIỆT) ---
  const getVietnameseStatus = (status) => {
    switch (status) {
      case 'Pending':
        return 'Đang chờ';
      case 'Scheduled':
        return 'Đã xác nhận';
      case 'Completed':
        return 'Hoàn thành';
      case 'Cancelled':
        return 'Đã hủy';
      default:
        return status; 
    }
  };

  // --- LOGIC LỌC TRẠNG THÁI CÓ THỂ CHUYỂN ĐỔI ---
  const getAvailableStatusTransitions = (currentStatus) => {
    if (currentStatus === 'Pending') {
      return ['Pending', 'Scheduled', 'Cancelled'];
    }
    if (currentStatus === 'Scheduled') {
      return ['Scheduled', 'Completed', 'Cancelled'];
    }
    return [currentStatus];
  };

  // --- LEAFLET/MAP INITIALIZATION ---
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.L) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => setLeafletLoaded(true);
      document.head.appendChild(script);
    } else if (window.L) {
      setLeafletLoaded(true);
    }
  }, []);

  const markersRef = useRef({});

  const initMap = () => {
    if (!window.L || !mapRef.current || pendingSchedules.length === 0) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markersRef.current = {};
    }

    const avgLat = pendingSchedules.reduce((sum, s) => sum + s.latitude, 0) / pendingSchedules.length;
    const avgLng = pendingSchedules.reduce((sum, s) => sum + s.longitude, 0) / pendingSchedules.length;

    const map = window.L.map(mapRef.current).setView([avgLat, avgLng], 13);

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // TRONG HÀM initMap
pendingSchedules.forEach(s => {
    // Logic xác định nút hành động trong popup (giữ nguyên)
    let popupActions = '';
    const scheduledTime = s.scheduledDate ? new Date(s.scheduledDate).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : 'N/A';
    const createdAtTime = s.createdAt ? new Date(s.createdAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : 'N/A';
    const createdAtDate = s.createdAt ? new Date(s.createdAt).toLocaleDateString('vi-VN') : 'N/A';

    if (s.status === 'Pending') {
        popupActions = `
            <button onclick="handleMarkerStatusChange(${s.scheduleID}, 'Scheduled')" 
                    class="flex-1 bg-blue-600 text-white text-xs px-2 py-1 rounded hover:bg-blue-700">
                Xác nhận lịch
            </button>
            <button onclick="handleMarkerStatusChange(${s.scheduleID}, 'Cancelled')" 
                    class="flex-1 bg-red-600 text-white text-xs px-2 py-1 rounded hover:bg-red-700">
                Hủy
            </button>
        `;
    } else if (s.status === 'Scheduled') {
        popupActions = `
            <button onclick="handleMarkerStatusChange(${s.scheduleID}, 'Completed')" 
                    class="flex-1 bg-green-600 text-white text-xs px-2 py-1 rounded hover:bg-green-700">
                Đã thu gom
            </button>
            <button onclick="handleMarkerStatusChange(${s.scheduleID}, 'Cancelled')" 
                    class="flex-1 bg-red-600 text-white text-xs px-2 py-1 rounded hover:bg-red-700">
                Hủy
            </button>
        `;
    }
    
    const marker = window.L.marker([s.latitude, s.longitude])
      .addTo(map)
      .bindPopup(`
        <div class="min-w-48 p-1 text-sm font-sans">
          <h3 class="font-bold text-base text-gray-800 mb-2">#${s.scheduleID} - ${s.wasteType}</h3>
          
          <p class="text-gray-600 mb-1">
            <strong>Số điện thoại:</strong> ${s.userEmail || 'N/A'}
          </p> 
          
          <div class="text-gray-700 space-y-0.5 mb-2 border-t pt-2 mt-2 border-gray-200">
            <p>
              <strong>Ngày thu gom:</strong> ${new Date(s.scheduledDate).toLocaleDateString('vi-VN')}
            </p>
           
            <p class="text-xs text-gray-500">
              Tạo lúc: ${createdAtDate} ${createdAtTime}
            </p>
          </div>

          <p class="mb-2">
            <strong>Trạng thái:</strong> 
            <span class="px-2 py-1 rounded text-xs font-semibold ${getStatusColor(s.status)}">
              ${getVietnameseStatus(s.status)} 
            </span>
          </p>

          ${s.notes ? `<p class="mt-2 text-xs italic text-gray-500">Ghi chú: ${s.notes}</p>` : ''}

          <div class="mt-3 flex gap-2">
            ${popupActions}
          </div>
        </div>
      `, {
        maxWidth: 300
      });

    markersRef.current[s.scheduleID] = marker;
});
    const group = new window.L.featureGroup(Object.values(markersRef.current));
    map.fitBounds(group.getBounds().pad(0.3));

    mapInstanceRef.current = map;
  };

  const focusOnSchedule = (schedule) => {
    const marker = markersRef.current[schedule.scheduleID];
    if (!marker || !mapInstanceRef.current) return;

    mapInstanceRef.current.setView(marker.getLatLng(), 16, {
      animate: true,
      duration: 1.2
    });

    marker.openPopup();
    setSelectedMarker(schedule);
  };
  
  useEffect(() => {
    if (viewMode === "map" && leafletLoaded && pendingSchedules.length > 0) {
      setTimeout(() => initMap(), 100);
    }
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [viewMode, leafletLoaded, pendingSchedules]);

  // --- END LEAFLET/MAP INITIALIZATION ---

  const fetchSchedules = async (userId = null) => {
    setLoading(true);
    setError(null);
    try {
      const url = userId 
        ? `${API_BASE_URL}/GetdataUserID/${userId}`
        : API_BASE_URL;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          setSchedules([]);
          setFilteredSchedules([]);
          setError('No schedules found');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setSchedules(data);
      setFilteredSchedules(data);
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch schedules';
      setError(errorMessage);
      console.error('Error fetching schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules(null);
  }, []);

  useEffect(() => {
    let filtered = [...schedules];

    if (filterStatus !== 'all') {
      filtered = filtered.filter(s => s.status === filterStatus);
    }

    if (filterDate) {
      filtered = filtered.filter(s => {
        const scheduleDate = new Date(s.scheduledDate).toISOString().split('T')[0];
        return scheduleDate === filterDate;
      });
    }

    setFilteredSchedules(filtered);
  }, [filterStatus, filterDate, schedules]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const scheduleData = {
      ...formData,
      userID: parseInt(formData.userID),
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      scheduledDate: new Date(formData.scheduledDate).toISOString(),
      createdAt: new Date().toISOString()
    };

    try {
      if (editingId) {
        const response = await fetch(`${API_BASE_URL}/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...scheduleData, scheduleID: editingId })
        });

        if (!response.ok) throw new Error('Failed to update schedule');
        showToast('Cập nhật lịch thành công!', 'success');
      } else {
        const response = await fetch(API_BASE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(scheduleData)
        });

        if (!response.ok) throw new Error('Failed to create schedule');
        showToast('Tạo lịch mới thành công!', 'success');
      }

      await fetchSchedules(null);
      resetForm();
    } catch (err) {
      setError(err.message);
      showToast('Lỗi: ' + (err.message || 'Không thể thực hiện thao tác.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (schedule) => {
    setFormData({
      userID: schedule.userID,
      latitude: schedule.latitude,
      longitude: schedule.longitude,
      wasteType: schedule.wasteType,
      scheduledDate: schedule.scheduledDate.split('T')[0],
      status: schedule.status,
      notes: schedule.notes || ''
    });
    setEditingId(schedule.scheduleID);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa lịch này?')) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete schedule');
      
      showToast('Xóa lịch thành công!', 'success');
      await fetchSchedules(null);
    } catch (err) {
      setError(err.message);
      showToast('Lỗi: ' + (err.message || 'Không thể xóa lịch.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  // SỬA ĐỔI: Thêm bước xác nhận cho trạng thái 'Cancelled'
  const handleStatusUpdate = async (id, newStatus) => {
    
    if (newStatus === 'Cancelled') {
        if (!window.confirm('Bạn có chắc muốn HỦY lịch thu gom này không? ')) {
            // Ngăn chặn việc cập nhật nếu người dùng không xác nhận
            return;
        }
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/updateStatus/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStatus) 
      });

      if (!response.ok) throw new Error('Failed to update status');
      
      showToast(`Cập nhật trạng thái thành công: ${getVietnameseStatus(newStatus)}`, 'success');
      await fetchSchedules(null);
    } catch (err) {
      setError(err.message);
      showToast('Lỗi: ' + (err.message || 'Không thể cập nhật trạng thái.'), 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Gắn hàm chung để xử lý trạng thái cho Leaflet Popup
  useEffect(() => {
    window.handleMarkerStatusChange = (id, newStatus) => {
        handleStatusUpdate(id, newStatus);
    };
    return () => {
      delete window.handleMarkerStatusChange;
    };
  }, [handleStatusUpdate]);


  const resetForm = () => {
    setFormData({
      userID: currentUserId,
      latitude: 10.8231,
      longitude: 106.6297,
      wasteType: 'Rác sinh hoạt',
      scheduledDate: '',
      status: 'Pending',
      notes: ''
    });
    setShowForm(false);
    setEditingId(null);
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800', 
      'Scheduled': 'bg-blue-100 text-blue-800', 
      'Completed': 'bg-green-100 text-green-800', 
      'Cancelled': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getWasteTypeColor = (type) => {
    const colors = {
      'Rác hữu cơ': 'text-green-600',
      'Hữu cơ': 'text-green-600',
      'Rác tái chế': 'text-blue-600',
      'Tái chế': 'text-blue-600',
      'Rác nguy hại': 'text-red-600',
    };
    return colors[type] || 'text-gray-600';
  };

  // Hàm helper để định dạng thời gian (HH:MM)
  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Lỗi định dạng';
    }
  };
  
  // Hàm helper để định dạng ngày (DD/MM/YYYY)
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN');
    } catch (e) {
      return 'Lỗi định dạng';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* --- HEADER --- */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Trash2 className="w-8 h-8 text-green-600" />
                Quản lý lịch thu gom rác
              </h1>
              <p className="text-gray-600 mt-1">Quản lý và theo dõi các điểm thu gom rác</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              disabled={loading}
            >
              <Plus className="w-5 h-5" />
              Thêm lịch mới
            </button>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Lỗi:</strong> {error}
          </div>
        )}

        {/* --- BỘ LỌC --- */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-700">Bộ lọc:</span>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Trạng thái:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="all">Tất cả</option>
                {statuses.map(s => (
                  <option key={s} value={s}>{getVietnameseStatus(s)}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Ngày:</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <button
              onClick={() => {
                setFilterStatus('all');
                setFilterDate('');
              }}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
            >
              Xóa bộ lọc
            </button>

            <div className="ml-auto text-sm text-gray-600">
              Hiển thị: <strong>{filteredSchedules.length}</strong> / {schedules.length} lịch
            </div>
          </div>
        </div>
        
        {/* --- CHUYỂN VIEW MODE --- */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              viewMode === 'table' 
                ? 'bg-green-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Table className="w-5 h-5" />
            Bảng
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              viewMode === 'map' 
                ? 'bg-green-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Map className="w-5 h-5" />
            Bản đồ (Chưa thu gom)
          </button>
        </div>
        
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader className="w-8 h-8 animate-spin text-green-600" />
          </div>
        )}

        {/* --- VIEW BẢNG (TABLE) --- */}
        {!loading && viewMode === 'table' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
{/*                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th> */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số điện thoại</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại rác</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vị trí</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày thu gom</th> 
                    {/* THÊM CỘT NGÀY TẠO */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
                    {/* END THÊM CỘT NGÀY TẠO */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ghi chú</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSchedules.map((schedule) => (
                    <tr key={schedule.scheduleID} className="hover:bg-gray-50">
{/*                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{schedule.scheduleID}
                      </td> */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {schedule.userID}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4 text-blue-500" />
                          {schedule.userEmail || 'N/A'} 
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${getWasteTypeColor(schedule.wasteType)}`}>
                          {schedule.wasteType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {schedule.latitude.toFixed(4)}, {schedule.longitude.toFixed(4)}
                        </div>
                      </td>
                      {/* HIỂN THỊ NGÀY VÀ THỜI GIAN THU GOM */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(schedule.scheduledDate)}
                            </div>
                            {/* <div className="flex items-center gap-1 text-xs font-medium text-gray-700">
                                <Clock className="w-4 h-4" />
                                {formatTime(schedule.scheduledDate)}
                            </div> */}
                        </div>
                      </td>
                      {/* THÊM CỘT NGÀY TẠO */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1">
                                <History className="w-4 h-4 text-gray-500" />
                                {formatDate(schedule.createdAt)}
                            </div>
                            <div className="text-xs text-gray-500 ml-5">
                                {formatTime(schedule.createdAt)}
                            </div>
                        </div>
                      </td>
                      {/* END THÊM CỘT NGÀY TẠO */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={schedule.status}
                          onChange={(e) => handleStatusUpdate(schedule.scheduleID, e.target.value)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(schedule.status)}`}
                          disabled={schedule.status === 'Completed' || schedule.status === 'Cancelled'}
                        >
                          {getAvailableStatusTransitions(schedule.status).map(status => (
                            <option key={status} value={status}>
                              {getVietnameseStatus(status)} 
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {schedule.notes || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(schedule)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Sửa"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(schedule.scheduleID)}
                            className="text-red-600 hover:text-red-800"
                            title="Xóa"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredSchedules.length === 0 && (
                    <tr>
                      <td colSpan="10" className="px-6 py-12 text-center text-gray-500"> {/* Sửa colspan */}
                        Không tìm thấy lịch thu gom nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- VIEW BẢN ĐỒ (MAP) --- */}
        {!loading && viewMode === 'map' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-4 bg-blue-50 border border-blue-200 p-3 rounded">
              <p className="text-sm text-blue-800">
                <strong>Bản đồ hiển thị:</strong> {pendingSchedules.length} điểm chưa thu gom (Đang chờ / Đã xác nhận)
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="relative bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-300" style={{ height: '600px' }}>
                
                  {leafletLoaded && (
                    <div 
                      ref={mapRef}
                      className="w-full h-full z-0"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-900 sticky top-0 bg-white pb-2 border-b">
                  Điểm chưa thu gom ({pendingSchedules.length})
                </h3>
                {pendingSchedules.map((schedule) => (
                  <div
                    key={schedule.scheduleID}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                      selectedMarker?.scheduleID === schedule.scheduleID
                        ? 'border-green-500 bg-green-50 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow'
                    }`}
                    onClick={() => focusOnSchedule(schedule)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-gray-900">#{schedule.scheduleID}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(schedule.status)}`}>
                        {getVietnameseStatus(schedule.status)} 
                      </span>
                    </div>
                    {/* HIỂN THỊ EMAIL */}
                    <div className="text-sm text-blue-600 flex items-center gap-1 mb-2">
                      <Mail className='w-3 h-3'/> {schedule.userEmail || 'N/A'}
                    </div>
                    {/* THÔNG TIN KHÁC */}
                    <div className={`font-medium mb-2 ${getWasteTypeColor(schedule.wasteType)}`}>
                      {schedule.wasteType}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1 mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {schedule.latitude.toFixed(4)}, {schedule.longitude.toFixed(4)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(schedule.scheduledDate)}
                      </div>
                      {/* HIỂN THỊ THỜI GIAN TRÊN SIDEBAR */}
                      <div className="flex items-center gap-1 text-xs font-medium text-gray-700">
                        <Clock className="w-3 h-3" />
                        {formatTime(schedule.scheduledDate)}
                      </div>
                      {/* THÊM THỜI GIAN TẠO LỊCH */}
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <History className="w-3 h-3" />
                        Tạo: {formatDate(schedule.createdAt)} {formatTime(schedule.createdAt)}
                      </div>
                      {schedule.notes && (
                        <div className="text-xs mt-2 text-gray-500 italic">
                          "{schedule.notes}"
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      
                      {/* LOGIC NÚT HÀNH ĐỘNG TRÊN BẢN ĐỒ */}
                      {schedule.status === 'Scheduled' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusUpdate(schedule.scheduleID, 'Completed');
                            }}
                            className="flex-1 px-3 py-2 bg-green-600 text-white text-xs rounded hover:bg-green-700 flex items-center justify-center gap-1 transition"
                          >
                            <Check className="w-3 h-3" />
                            Hoàn thành
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusUpdate(schedule.scheduleID, 'Cancelled');
                            }}
                            className="px-3 py-2 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition"
                          >
                            <X className="w-4 h-4" /> Hủy
                          </button>
                        </>
                      )}
                      {schedule.status === 'Pending' && (
                         <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusUpdate(schedule.scheduleID, 'Scheduled');
                            }}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 flex items-center justify-center gap-1 transition"
                          >
                            <Check className="w-3 h-3" />
                            Xác nhận lịch
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusUpdate(schedule.scheduleID, 'Cancelled');
                            }}
                            className="px-3 py-2 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition"
                          >
                            <X className="w-4 h-4" /> Hủy
                          </button>
                        </>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(schedule);
                        }}
                        className="px-3 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {pendingSchedules.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    Không có điểm nào chưa thu gom
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* --- FORM THÊM/SỬA --- */}
        {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {editingId ? 'Sửa lịch thu gom' : 'Thêm lịch thu gom mới'}
                    </h2>
                    <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* User ID */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          User ID
                        </label>
                        <input
                          type="number"
                          name="userID"
                          value={formData.userID}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                          required
                        />
                      </div>
                      
                      {/* Loại rác */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Loại rác
                        </label>
                        <select
                          name="wasteType"
                          value={formData.wasteType}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                          required
                        >
                          {wasteTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      {/* Ngày thu gom */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ngày thu gom
                        </label>
                        <input
                          type="date"
                          name="scheduledDate"
                          value={formData.scheduledDate}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                          required
                        />
                      </div>

                      {/* Trạng thái (Đã chuẩn hóa TV) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                           Trạng thái
                        </label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                            required
                        >
                            {statuses.map(status => (
                                <option key={status} value={status}>
                                    {getVietnameseStatus(status)} 
                                </option>
                            ))}
                        </select>
                      </div>

                      {/* Vĩ độ */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Vĩ độ (Latitude)
                        </label>
                        <input
                          type="number"
                          step="any"
                          name="latitude"
                          value={formData.latitude}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                          required
                        />
                      </div>

                      {/* Kinh độ */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Kinh độ (Longitude)
                        </label>
                        <input
                          type="number"
                          step="any"
                          name="longitude"
                          value={formData.longitude}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                          required
                        />
                      </div>

                      {/* Ghi chú */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ghi chú
                        </label>
                        <textarea
                          name="notes"
                          value={formData.notes}
                          onChange={handleInputChange}
                          rows="3"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                          placeholder="Thêm ghi chú..."
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        {loading ? (
                          <Loader className="w-5 h-5 animate-spin" />
                        ) : (
                          <Save className="w-5 h-5" />
                        )}
                        {editingId ? 'Cập nhật' : 'Tạo mới'}
                      </button>
                    </div>
                  </form>
                </div>
                
              </div>
            </div>
          )}

      </div>
      {/* --- HIỂN THỊ TOAST CUỐI CÙNG (GÓC TRÊN BÊN PHẢI) --- */}
      <ToastNotification 
          message={toast.message} 
          type={toast.type} 
          onClose={closeToast} 
      />
    </div>
  );
}