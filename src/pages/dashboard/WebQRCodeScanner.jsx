import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from "html5-qrcode";
import axios from 'axios';
import ip from "@/data/ip"; // Giá trị là "http://...:5000/api/"

const WebQRCodeScanner = () => {
  // --- STATES ---
  const [step, setStep] = useState("enter");
  const [points, setPoints] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState("");
  
  // Refs
  const qrRegionRef = useRef(null);
  const scannerRef = useRef(null);

  // --- API LOGIC ---
  
  // 1. Lấy thông tin người dùng
  const getUserInfo = async (uid) => {
    try {
      // SỬA: ip đã có sẵn "/api/", nên chỉ cần nối thêm phần đuôi "Users/..."
      // Result: http://192.168.1.11:5000/api/Users/firebase/{uid}
      const url = `${ip}Users/firebase/${uid}`;
      console.log("Fetching User Info:", url);

      // Nên dùng axios thống nhất thay vì fetch
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('❌ getUser lỗi:', error);
      throw new Error("Không tìm thấy người dùng hoặc lỗi mạng.");
    }
  };

  // 2. Trừ điểm người dùng
  const deductPoints = async (uid, pointsToDeduct) => {
    try {
      // SỬA: Đưa uid vào URL bên trong hàm này
      // Result: http://192.168.1.11:5000/api/users/firebase/{uid}/deduct
      const url = `${ip}users/firebase/${uid}/deduct`;
      
      const response = await axios.put(
        url,
        pointsToDeduct, // Body
        { headers: { 'Content-Type': 'application/json' } }
      );
      console.log('User sau khi trừ điểm:', response.data);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi trừ điểm:', error.response?.data || error.message);
      throw new Error("Lỗi khi trừ điểm hệ thống.");
    }
  };

  // 3. Lưu lịch sử giao dịch
  const createTransactionRecord = async (userID, pointsDeducted) => {
    try {
      // Result: http://192.168.1.11:5000/api/rewards
      const url = `${ip}rewards`;

      const response = await axios.post(url, {
        UserID: Number(userID),
        PointsEarned: -Number(pointsDeducted),
        CreatedAt: new Date().toISOString(),
      });
      console.log('Transaction đã tạo:', response.data);
    } catch (error) {
      console.error('Lỗi tạo Transaction:', error);
    }
  };

  // --- SCAN LOGIC ---
  const handleScanSuccess = async (decodedText) => {
    // Pause camera ngay
    if (scannerRef.current) {
      try { await scannerRef.current.pause(); } catch(e){}
    }
    
    setStep("processing");

    try {
      // Parse JSON an toàn
      let data;
      try {
        data = JSON.parse(decodedText);
      } catch (e) {
        throw new Error("Mã QR không đúng định dạng JSON");
      }
      
      console.log("Scanned Data:", data);

      if (!data?.uid) throw new Error("QR thiếu thông tin UID");

      // Gọi chuỗi API
      const userInfo = await getUserInfo(data.uid);
      
      const currentPoints = Number(userInfo?.points || 0);
      const pointsToPay = Number(points);

      // Kiểm tra số dư
      if (currentPoints >= pointsToPay) {
        await deductPoints(data.uid, pointsToPay);
        await createTransactionRecord(userInfo.userID, pointsToPay);
        
        setScanResult({
          status: 'success',
          title: 'Thanh toán thành công!',
          message: `Đã trừ ${pointsToPay} điểm của user ${userInfo.name || 'ẩn danh'}.`
        });
      } else {
        setScanResult({
          status: 'error',
          title: 'Thanh toán thất bại',
          message: `User chỉ còn ${currentPoints} điểm (Cần: ${pointsToPay}).`
        });
      }
    } catch (err) {
      setScanResult({
        status: 'error',
        title: 'Lỗi xử lý',
        message: err.message || "Không thể xử lý mã QR này"
      });
    }

    setStep("result");
  };

  // --- CAMERA EFFECT ---
  useEffect(() => {
    let scanner = null;
    if (step === "scan" && qrRegionRef.current) {
      // 1. Cleanup DOM cũ
      qrRegionRef.current.innerHTML = "";
      
      // 2. Init Scanner
      scanner = new Html5Qrcode(qrRegionRef.current.id);
      scannerRef.current = scanner;

      const config = {
        fps: 10,
        qrbox: (w, h) => ({ width: w * 0.7, height: h * 0.7 }),
        aspectRatio: 1.0,
        videoConstraints: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 }
        }
      };

      // 3. Start Scanner
      scanner.start(
        { facingMode: "environment" },
        config,
        handleScanSuccess,
        () => {} // ignore frame errors
      ).catch(err => {
        console.error("Camera Start Error:", err);
        setError("Không thể mở camera. Vui lòng cấp quyền.");
        setStep("enter");
      });
    }

    // 4. Cleanup
    return () => {
      if (scanner && scanner.isScanning) {
        scanner.stop().then(() => scanner.clear()).catch(() => {});
      }
    };
  }, [step]);

  // --- UI HANDLERS ---
  const handleProceedToScan = () => {
    const val = Number(points);
    if (isNaN(val) || val <= 0) {
      alert("Vui lòng nhập số điểm hợp lệ");
      return;
    }
    setStep("scan");
    setScanResult(null);
    setError("");
  };

  const handleReset = () => {
    setStep("enter");
    setPoints("");
    setScanResult(null);
  };

  return (
    <div className="min-h-screen bg-[#F0F5F1] flex flex-col items-center justify-center font-sans p-4">
      
      {/* HEADER */}
      <div className="w-full max-w-md bg-[#2E7D32] text-white p-4 rounded-t-xl flex items-center shadow-lg">
        {step !== "enter" && (
          <button onClick={() => setStep("enter")} className="mr-4 text-2xl hover:bg-white/20 rounded-full p-1 transition">
            ⬅️
          </button>
        )}
        <h1 className="text-xl font-bold flex-1 text-center">Thanh toán điểm</h1>
      </div>

      <div className="w-full max-w-md bg-white p-6 rounded-b-xl shadow-xl border border-[#A5D6A7]">
        
        {/* STEP 1: NHẬP ĐIỂM */}
        {step === "enter" && (
          <div className="flex flex-col items-center space-y-6 py-8">
            <h2 className="text-gray-700 text-lg font-bold">Nhập số điểm cần thu</h2>
            <div className="relative w-full">
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
  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-bold">Điểm</span>
</div>
            <button
              onClick={handleProceedToScan}
              className="w-full py-4 bg-[#2E7D32] hover:bg-[#1b5e20] text-white font-bold rounded-xl text-lg transition-all transform hover:scale-[1.02] shadow-md"
            >
              📷 Tiến hành quét QR
            </button>
          </div>
        )}

        {/* STEP 2: SCANNING */}
        {step === "scan" && (
          <div className="flex flex-col items-center">
            <p className="mb-4 text-gray-600 font-medium">Đang thu: <b className="text-[#2E7D32] text-xl">{points} điểm</b></p>
            <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden border-4 border-[#2E7D32]">
               <div id="qr-region-payment" ref={qrRegionRef} className="w-full h-full"></div>
               <div className="absolute inset-0 pointer-events-none border-[50px] border-black/50"></div>
            </div>
            <p className="mt-4 text-sm text-gray-500 animate-pulse">Di chuyển camera vào mã QR...</p>
          </div>
        )}

        {/* STEP 3: LOADING */}
        {step === "processing" && (
          <div className="py-12 flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-[#2E7D32] border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600 font-bold">Đang xử lý giao dịch...</p>
          </div>
        )}

        {/* STEP 4: RESULT */}
        {step === "result" && scanResult && (
          <div className="py-6 flex flex-col items-center text-center">
            <div className={`text-6xl mb-4 ${scanResult.status === 'success' ? 'animate-bounce' : ''}`}>
              {scanResult.status === 'success' ? '✅' : '❌'}
            </div>
            <h3 className={`text-2xl font-bold mb-2 ${scanResult.status === 'success' ? 'text-green-700' : 'text-red-600'}`}>
              {scanResult.title}
            </h3>
            <p className="text-gray-600 mb-8 px-4">
              {scanResult.message}
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => { setStep("scan"); setScanResult(null); }}
                className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-lg transition"
              >
                Quét tiếp
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-3 bg-[#2E7D32] hover:bg-[#1b5e20] text-white font-bold rounded-lg transition"
              >
                Về trang chủ
              </button>
            </div>
          </div>
        )}
      </div>
      
      {error && <p className="mt-4 text-red-600 bg-red-100 px-4 py-2 rounded-lg text-center font-bold">{error}</p>}
    </div>
  );
};

export default WebQRCodeScanner;