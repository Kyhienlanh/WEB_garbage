import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'react-qr-code';

// Cấu hình màu sắc và icon
const WASTE_CONFIG = {
  'Tái chế': { icon: '♻️', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  'Hữu cơ': { icon: '🍂', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
  'Nguy hại': { icon: '☠️', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
  'General': { icon: '🗑️', color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200' },
};

const WASTE_TYPES = Object.keys(WASTE_CONFIG);
const QR_SIZE = 200;
const COUNTDOWN_TIME = 60;

const RenderQRCode = () => {
  const [qrValue, setQrValue] = useState('');
  const [points, setPoints] = useState('');
  const [wasteType, setWasteType] = useState('Tái chế');
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_TIME);
  const [isGenerated, setIsGenerated] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const intervalRef = useRef(null);

  const user = { uid: 'demo-user' };

 // Web / React
const generatePayload = (points, category) => {
  const nonce = Math.random().toString(36).slice(2, 10);
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + COUNTDOWN_TIME * 1000).toISOString();
  return { 
    uid: user.uid, 
    points, 
    category: btoa(unescape(encodeURIComponent(category))), // encode tiếng Việt
    nonce, 
    createdAt, 
    expiresAt 
  };
};


  const generateQr = () => {
    const numericPoints = Number(points);
    if (!points || isNaN(numericPoints)) {
      alert('Vui lòng nhập số điểm hợp lệ!');
      return;
    }

    setQrValue(JSON.stringify(generatePayload(numericPoints, wasteType)));
    setIsGenerated(true);
    setSecondsLeft(COUNTDOWN_TIME);

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setQrValue('');
          setIsGenerated(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const progressPercentage = (secondsLeft / COUNTDOWN_TIME) * 100;
  const currentTheme = WASTE_CONFIG[wasteType];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-visible border border-white/50 relative">
        
        {/* Header */}
        <div className="bg-green-700 p-6 text-center relative overflow-hidden rounded-t-3xl">
          <div className="absolute top-0 left-0 w-full h-full bg-white opacity-10 transform -skew-y-6 origin-top-left"></div>
          <h2 className="text-2xl font-bold text-white relative z-10">Phân loại rác thải thông minh</h2>
          <p className="text-green-100 text-sm mt-1 relative z-10">Tạo mã QR để tích</p>
        </div>

        <div className="p-8">
          
          <div className="space-y-6">
            
            {/* 1. Chọn loại rác - Đã sửa lỗi Z-Index */}
            {/* Thêm 'z-20' vào div cha để nó nằm đè lên ô input bên dưới */}
            <div className="relative z-20">
              <label className="block text-sm font-bold text-gray-700 mb-2">Loại rác thải</label>
              <button
                className={`w-full py-3 px-4 border rounded-xl flex justify-between items-center shadow-sm transition-all duration-200 hover:ring-2 hover:ring-offset-1 ${currentTheme.bg} ${currentTheme.border} ${currentTheme.color}`}
                onClick={() => setModalVisible(!modalVisible)}
              >
                <span className="flex items-center gap-3 font-bold">
                  <span className="text-2xl">{currentTheme.icon}</span> {wasteType}
                </span>
                <svg className={`w-5 h-5 transition-transform duration-300 ${modalVisible ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>

              {/* Dropdown Menu */}
              {modalVisible && (
                <div className="absolute w-full bg-white border border-gray-200 rounded-xl mt-2 shadow-2xl overflow-hidden animate-fade-in-down z-50">
                  {WASTE_TYPES.map((type) => (
                    <div
                      key={type}
                      className="px-4 py-3 cursor-pointer hover:bg-gray-100 flex items-center gap-3 transition-colors border-b last:border-0 border-gray-100"
                      onClick={() => {
                        setWasteType(type);
                        setModalVisible(false);
                      }}
                    >
                      <span className="text-xl">{WASTE_CONFIG[type].icon}</span>
                      <span className="text-gray-800 font-semibold">{type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Nhập điểm - Z-index thấp hơn */}
            <div className="relative z-10">
              <label className="block text-sm font-bold text-gray-700 mb-2">Số điểm cộng</label>
              <div className="relative group">
               <input
    type="number"
    value={points}
    onChange={(e) => {
      const val = e.target.value;
      // Logic: Chỉ cập nhật nếu là chuỗi rỗng (để xóa hết) hoặc là số >= 0
      // Lưu ý: type="number" vẫn cho phép gõ 'e', nên cần check kỹ
      if (val === '' || (Number(val) >= 0 && !val.includes('-'))) {
        setPoints(val);
      }
    }}
    // Chặn các ký tự đặc biệt của input number: dấu trừ (-), dấu cộng (+), chữ e (exponent)
    onKeyDown={(e) => {
      if (["-", "+", "e", "E"].includes(e.key)) {
        e.preventDefault();
      }
    }}
    placeholder="VD: 100"
    min="0" // Gợi ý cho trình duyệt không cho giảm xuống dưới 0
    className="w-full p-4 text-center text-3xl font-bold border-2 border-[#A5D6A7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E7D32] text-[#2E7D32]"
  />
                
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold text-sm bg-gray-100 px-2 py-1 rounded">
                  Điểm
                </div>
              </div>
            </div>

            {/* Action Button - Đã sửa màu sắc đậm hơn */}
            <button
              onClick={generateQr}
              className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transform transition-all duration-200 hover:-translate-y-1 active:translate-y-0 active:shadow-md
                ${isGenerated 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:shadow-blue-500/40 ring-2 ring-blue-200' // Màu xanh dương đậm khi Tạo Lại
                  : 'bg-gradient-to-r from-green-700 to-emerald-800 hover:shadow-green-600/40 ring-2 ring-green-200' // Màu xanh lá đậm khi Tạo Mới
                }
              `}
            >
              {isGenerated ? (
                <span className="flex items-center justify-center gap-2">
                  🔄 Tạo mã mới
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  🚀 Tạo mã QR
                </span>
              )}
            </button>
          </div>

          {/* QR Display Section */}
          <div className={`mt-8 transition-all duration-500 ease-in-out ${qrValue ? 'opacity-100 max-h-[500px]' : 'opacity-0 max-h-0 overflow-hidden'}`}>
            <div className="flex flex-col items-center">
              <div className="relative p-5 bg-white rounded-2xl shadow-xl border border-gray-200">
                {/* Góc trang trí */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-600 rounded-tl-xl -mt-1 -ml-1"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-600 rounded-tr-xl -mt-1 -mr-1"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-600 rounded-bl-xl -mb-1 -ml-1"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-600 rounded-br-xl -mb-1 -mr-1"></div>
                
                <QRCode value={qrValue} size={QR_SIZE} viewBox={`0 0 256 256`} className="rounded-lg" />
              </div>
              
              {/* Countdown & Progress */}
              <div className="w-full mt-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex justify-between text-sm font-bold text-gray-600 mb-2">
                  <span>Hết hạn trong:</span>
                  <span className={`font-mono ${secondsLeft < 10 ? 'text-red-600 animate-pulse' : 'text-green-700'}`}>{secondsLeft}s</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                  <div 
                    className={`h-3 rounded-full transition-all duration-1000 ease-linear shadow-sm ${secondsLeft < 10 ? 'bg-red-500' : 'bg-gradient-to-r from-green-500 to-emerald-600'}`} 
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Trạng thái chưa có QR */}
          {!qrValue && (
            <div className="mt-6 text-center">
               <p className="text-gray-400 text-sm italic">Sẵn sàng tạo mã...</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default RenderQRCode;