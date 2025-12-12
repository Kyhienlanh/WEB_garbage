import { useState, useEffect, useRef } from "react";
import { Trash2, Edit, Plus, X, CheckCircle, XCircle, Table, MapPin } from "lucide-react";
import ip from "@/data/ip";
const API_URL = `${ip}pointsGarbages`;

export default function PointsGarbage() {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });
  const [viewMode, setViewMode] = useState("table");
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    opentime: "",
    img: "",
    latitude: "",
    longitude: "",
    address: ""
  });

  // Load Leaflet
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.L) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => {
        console.log('Leaflet loaded successfully');
        setLeafletLoaded(true);
      };
      document.head.appendChild(script);
    } else if (window.L) {
      setLeafletLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchPoints();
  }, []);

  useEffect(() => {
    if (viewMode === "map" && leafletLoaded && points.length > 0) {
      // Delay to ensure DOM is ready
      setTimeout(() => {
        initMap();
      }, 100);
    }
    
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [viewMode, leafletLoaded, points]);

  const initMap = () => {
    if (!window.L || !mapRef.current || points.length === 0) {
      console.log('Cannot init map:', { leaflet: !!window.L, mapRef: !!mapRef.current, points: points.length });
      return;
    }

    // Clear existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      // Calculate center from all points
      const avgLat = points.reduce((sum, p) => sum + (p.latitude || 0), 0) / points.length;
      const avgLng = points.reduce((sum, p) => sum + (p.longitude || 0), 0) / points.length;

      console.log('Creating map at:', avgLat, avgLng);

      // Create map
      const map = window.L.map(mapRef.current, {
        center: [avgLat, avgLng],
        zoom: 13,
        scrollWheelZoom: true
      });

      // Add tile layer
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      // Add markers
      const bounds = [];
      points.forEach(point => {
        if (point.latitude && point.longitude) {
          const marker = window.L.marker([point.latitude, point.longitude]).addTo(map);
          bounds.push([point.latitude, point.longitude]);
          
          const popupContent = `
            <div style="min-width: 200px; max-width: 300px;">
              <h3 style="font-weight: bold; margin-bottom: 8px; color: #16a34a; font-size: 16px;">${point.name}</h3>
              ${point.img ? `<img src="${point.img}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px; margin-bottom: 8px;" onerror="this.style.display='none'"/>` : ''}
              <p style="margin: 4px 0; font-size: 13px;"><strong>📞 SĐT:</strong> ${point.phone}</p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>🕒 Giờ mở:</strong> ${point.opentime}</p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>📍 Địa chỉ:</strong> ${point.address}</p>
              <div style="margin-top: 10px; display: flex; gap: 8px;">
                <button onclick="window.editPoint(${point.id})" style="flex: 1; padding: 8px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500;">Sửa</button>
                <button onclick="window.deletePoint(${point.id})" style="flex: 1; padding: 8px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500;">Xóa</button>
              </div>
            </div>
          `;
          
          marker.bindPopup(popupContent, { maxWidth: 300 });
        }
      });

      mapInstanceRef.current = map;

      // Fit bounds to show all markers
      if (bounds.length > 0) {
        const latLngBounds = window.L.latLngBounds(bounds);
        map.fitBounds(latLngBounds, { padding: [50, 50] });
      }

      // Force map to recalculate size
      setTimeout(() => {
        map.invalidateSize();
      }, 100);

      console.log('Map initialized successfully');
    } catch (error) {
      console.error('Error initializing map:', error);
      setError('Không thể khởi tạo bản đồ');
    }
  };

  useEffect(() => {
    window.editPoint = (id) => {
      const point = points.find(p => p.id === id);
      if (point) openModal(point);
    };

    window.deletePoint = (id) => {
      handleDelete(id);
    };

    return () => {
      delete window.editPoint;
      delete window.deletePoint;
    };
  }, [points]);

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000);
  };

  const fetchPoints = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Không thể tải dữ liệu");
      const data = await res.json();
      console.log('Fetched points:', data);
      setPoints(data);
    } catch (err) {
      setError(err.message);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const submitData = {
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude)
      };

      if (editingPoint) {
        const res = await fetch(`${API_URL}/${editingPoint.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...submitData, id: editingPoint.id })
        });
        if (!res.ok) throw new Error("Không thể cập nhật");
        showNotification("Cập nhật thành công!");
      } else {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitData)
        });
        if (!res.ok) throw new Error("Không thể thêm mới");
        showNotification("Thêm mới thành công!");
      }
      closeModal();
      await fetchPoints();
    } catch (err) {
      showNotification(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Bạn có chắc muốn xóa điểm này?")) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Không thể xóa");
      showNotification("Xóa thành công!");
      await fetchPoints();
    } catch (err) {
      showNotification(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (point = null) => {
    if (point) {
      setEditingPoint(point);
      setFormData({
        name: point.name || "",
        phone: point.phone || "",
        opentime: point.opentime || "",
        img: point.img || "",
        latitude: point.latitude?.toString() || "",
        longitude: point.longitude?.toString() || "",
        address: point.address || ""
      });
    } else {
      setEditingPoint(null);
      setFormData({ name: "", phone: "", opentime: "", img: "", latitude: "", longitude: "", address: "" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPoint(null);
    setFormData({ name: "", phone: "", opentime: "", img: "", latitude: "", longitude: "", address: "" });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {notification.show && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg ${
            notification.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
          }`}
        >
          {notification.type === "success" ? <CheckCircle size={24} /> : <XCircle size={24} />}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Điểm thu gom rác</h1>
          <div className="flex gap-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  viewMode === "table" ? "bg-white shadow text-green-600" : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <Table size={20} />
                Bảng
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  viewMode === "map" ? "bg-white shadow text-green-600" : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <MapPin size={20} />
                Bản đồ
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  viewMode === "cards" ? "bg-white shadow text-green-600" : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <MapPin size={20} />
                Thẻ
              </button>
            </div>
            
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus size={20} /> Thêm mới
            </button>
          </div>
        </div>

        {error && <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}
        {loading && <div className="text-center py-8 text-gray-600">Đang tải...</div>}

        {/* Table View */}
        {viewMode === "table" && !loading && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tên</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">SĐT</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Giờ mở cửa</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Địa chỉ</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Vị trí</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ảnh</th>

                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {points.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm">{p.id}</td>
                    <td className="px-4 py-3 text-sm font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-sm">{p.phone}</td>
                    <td className="px-4 py-3 text-sm">{p.opentime}</td>
                    <td className="px-4 py-3 text-sm">{p.address}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {p.latitude?.toFixed(6)}, {p.longitude?.toFixed(6)}
                    </td>
                    <td className="px-4 py-3 text-sm">
  {p.img ? (
    <img 
      src={p.img} 
      alt={p.name} 
      className="w-16 h-16 object-cover rounded" 
      onError={(e) => e.target.style.display = 'none'} 
    />
  ) : (
    <span className="text-gray-400 italic">Không có ảnh</span>
  )}
</td>

                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-center">
                        <button 
                          onClick={() => openModal(p)} 
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id)} 
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
            {points.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <MapPin size={48} className="mx-auto mb-3 text-gray-300" />
                <p>Chưa có điểm thu gom rác nào</p>
              </div>
            )}
          </div>
        )}

        {/* Map View with Leaflet */}
        {viewMode === "map" && !loading && (
          <div className="space-y-4">
            {!leafletLoaded && (
              <div className="text-center py-8 text-gray-600">Đang tải bản đồ...</div>
            )}
            {leafletLoaded && points.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <MapPin size={48} className="mx-auto mb-3 text-gray-300" />
                <p>Chưa có điểm thu gom rác nào để hiển thị trên bản đồ</p>
              </div>
            )}
            {leafletLoaded && points.length > 0 && (
              <>
                <div 
                  ref={mapRef}
                  className="w-full h-[800px] rounded-lg border-2 border-gray-200 bg-gray-100"
                  style={{ zIndex: 1 }}
                />
                <div className="text-sm text-gray-500 text-center">
                  Hiển thị {points.length} điểm thu gom rác trên bản đồ
                </div>
              </>
            )}
          </div>
        )}

        {/* Cards View */}
        {viewMode === "cards" && !loading && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-8 min-h-[500px] relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-full h-full" 
                     style={{
                       backgroundImage: `repeating-linear-gradient(0deg, #ccc, #ccc 1px, transparent 1px, transparent 40px),
                                        repeating-linear-gradient(90deg, #ccc, #ccc 1px, transparent 1px, transparent 40px)`
                     }}>
                </div>
              </div>
              
              <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {points.map((p) => (
                  <div key={p.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                          {p.id}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{p.name}</h3>
                          <p className="text-xs text-gray-500">📍 Điểm thu gom</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => openModal(p)} 
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id)} 
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    {p.img && (
                      <img 
                        src={p.img} 
                        alt={p.name}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="font-medium">📞</span>
                        <span>{p.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="font-medium">🕒</span>
                        <span>{p.opentime}</span>
                      </div>
                      <div className="flex items-start gap-2 text-gray-600">
                        <span className="font-medium">📍</span>
                        <span className="flex-1">{p.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500 text-xs pt-2 border-t">
                        <span className="font-medium">GPS:</span>
                        <span>{p.latitude?.toFixed(6)}, {p.longitude?.toFixed(6)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {points.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin size={64} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 text-lg">Chưa có điểm thu gom rác nào</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-sm text-gray-500 text-center">
              Hiển thị {points.length} điểm thu gom rác
            </div>
          </div>
        )}
      </div>

      {/* Modal thêm/sửa */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {editingPoint ? "Cập nhật điểm thu gom" : "Thêm điểm thu gom mới"}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên điểm thu gom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Nhập tên điểm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Nhập số điện thoại"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giờ mở cửa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.opentime}
                    onChange={(e) => setFormData({ ...formData, opentime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="VD: 8:00 - 17:00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL hình ảnh</label>
                  <input
                    type="text"
                    value={formData.img}
                    onChange={(e) => setFormData({ ...formData, img: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vĩ độ (Latitude) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="VD: 10.486532"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kinh độ (Longitude) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="VD: 105.624221"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa chỉ <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows="3"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Nhập địa chỉ đầy đủ"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={closeModal} 
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Đang xử lý..." : editingPoint ? "Cập nhật" : "Thêm mới"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}