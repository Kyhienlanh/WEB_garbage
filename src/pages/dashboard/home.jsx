import React, { useState, useEffect, useMemo } from "react";
import {
  Typography,
  Card,
  CardHeader,
  CardBody,
  IconButton,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
  Avatar,
  Tooltip,
  Progress,
} from "@material-tailwind/react";
import {
  EllipsisVerticalIcon,
  ArrowUpIcon,
} from "@heroicons/react/24/outline";
import {
  CheckCircleIcon,
  ClockIcon,
  BanknotesIcon,
  UsersIcon,
  UserPlusIcon,
  ChartBarIcon,
} from "@heroicons/react/24/solid";
import { StatisticsCard } from "@/widgets/cards";
import { StatisticsChart } from "@/widgets/charts";
import {
  statisticsChartsData,
  projectsTableData,
} from "@/data";
import { chartsConfig } from "@/configs";
import ip from "@/data/ip";

const API_BASE_URL = `${ip}Users`;
const API_URL = `${ip}ScanHistories`;
const API_URL2 = `${ip}WasteCollectionSchedules`;
const API_REWARDS = `${ip}Rewards`;
const API_WASTE_TYPES = `${ip}WasteTypes`;

export function Home() {
  const [users, setUsers] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [totaluser, setTotaluser] = useState(0);
  const [loading, setLoading] = useState(false);
  const [scanHistories, setScanHistories] = useState([]);
  const [scanError, setScanError] = useState("");
  const [WasteCollectionSchedules, setWasteCollectionSchedules] = useState([]);
  const [recentRewards, setRecentRewards] = useState([]);
  const [wasteTypes, setWasteTypes] = useState([]);

  useEffect(() => {
    fetchUsers();
    fetchScanHistories();
    fetchWasteScheduleManager();
    fetchRecentRewards();
    fetchWasteTypes();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_BASE_URL);
      const json = await response.json();
      setUsers(json);

      const sum = json.reduce((acc, u) => acc + Number(u.points || 0), 0);
      const length = json.length;
      setTotaluser(length);
      setTotalPoints(sum);
    } catch (error) {
      console.error("Lỗi khi tải users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchScanHistories = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Không thể tải dữ liệu");
      const data = await response.json();
      setScanHistories(data);
    } catch (err) {
      setScanError(err.message);
      console.error(err);
    }
  };

  const fetchWasteScheduleManager = async () => {
    try {
      const response = await fetch(API_URL2);
      if (!response.ok) throw new Error("Không thể tải dữ liệu");
      const data = await response.json();
      setWasteCollectionSchedules(data);
    } catch (err) {
      setScanError(err.message);
      console.error(err);
    }
  };

  const fetchRecentRewards = async () => {
    try {
      const response = await fetch(API_REWARDS);
      if (!response.ok) throw new Error("Không thể tải dữ liệu rewards");
      const data = await response.json();
      
      // Sắp xếp theo createdAt giảm dần và lấy 5 giao dịch gần nhất
      const sortedRewards = data
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      
      setRecentRewards(sortedRewards);
    } catch (err) {
      console.error("Lỗi khi tải rewards:", err);
    }
  };

  const fetchWasteTypes = async () => {
    try {
      const response = await fetch(API_WASTE_TYPES);
      if (!response.ok) throw new Error("Không thể tải dữ liệu waste types");
      const data = await response.json();
      setWasteTypes(data);
    } catch (err) {
      console.error("Lỗi khi tải waste types:", err);
    }
  };

  const statisticsCardsData = useMemo(
    () => [
      {
        color: "gray",
        icon: BanknotesIcon,
        title: "Tổng điểm của tất cả người dùng",
        value: totalPoints.toLocaleString(),
        footer: { color: "text-green-500", value: "", label: "" },
      },
      {
        color: "gray",
        icon: UsersIcon,
        title: "Tổng số người dùng",
        value: users.length.toString(),
        footer: { color: "text-green-500", value: "", label: "" },
      },
      {
        color: "gray",
        icon: UserPlusIcon,
        title: "Số lượt sử dụng AI phân loại rác",
        value: scanHistories.length.toString(),
        footer: { color: "text-red-500", value: "", label: "" },
      },
      {
        color: "gray",
        icon: ChartBarIcon,
        title: "Số lượt thu gom rác",
        value: WasteCollectionSchedules.length.toString(),
        footer: { color: "text-green-500", value: "", label: "" },
      },
    ],
    [totalPoints, users, scanHistories, WasteCollectionSchedules]
  );

  const statisticsChartsDataDynamic = useMemo(() => {
    // Biểu đồ 1: Phân bổ độ tin cậy AI theo nhóm
    const confidenceRanges = {
      "Rất tốt (≥90%)": 0,
      "Tốt (70-89%)": 0,
      "Trung bình (50-69%)": 0,
      "Thấp (<50%)": 0,
    };

    scanHistories.forEach((scan) => {
      const conf = Number(scan.confidence || 0) * 100;
      if (conf >= 90) confidenceRanges["Rất tốt (≥90%)"]++;
      else if (conf >= 70) confidenceRanges["Tốt (70-89%)"]++;
      else if (conf >= 50) confidenceRanges["Trung bình (50-69%)"]++;
      else confidenceRanges["Thấp (<50%)"]++;
    });

    const aiConfidenceChart = {
      type: "bar",
      height: 220,
      series: [
        {
          name: "Số lượt quét",
          data: Object.values(confidenceRanges),
        },
      ],
      options: {
        ...chartsConfig,
        colors: ["#388e3c", "#66bb6a", "#ffa726", "#ef5350"],
        plotOptions: {
          bar: {
            columnWidth: "50%",
            borderRadius: 8,
            distributed: true,
          },
        },
        xaxis: {
          ...chartsConfig.xaxis,
          categories: Object.keys(confidenceRanges),
        },
        legend: {
          show: false,
        },
        dataLabels: {
          enabled: true,
          style: {
            fontSize: "12px",
            fontWeight: "bold",
          },
        },
      },
    };

    // Biểu đồ 2: Top 10 loại rác được phát hiện nhiều nhất
    const labelCount = scanHistories.reduce((acc, scan) => {
      const label = scan.label || "Không xác định";
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});

    const sortedLabels = Object.entries(labelCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const objectClassificationChart = {
      type: "bar",
      height: 220,
      series: [
        {
          name: "Số lần phát hiện",
          data: sortedLabels.map(([_, count]) => count),
        },
      ],
      options: {
        ...chartsConfig,
        colors: ["#0288d1"],
        plotOptions: {
          bar: {
            columnWidth: "60%",
            borderRadius: 6,
            horizontal: true,
          },
        },
        xaxis: {
          categories: sortedLabels.map(([label]) => label),
        },
        dataLabels: { enabled: true },
      },
    };

    // Biểu đồ 3: Phân loại theo Category (Organic, Recyclable, etc.)
    const categoryCount = WasteCollectionSchedules.reduce((acc, schedule) => {
      const cat = schedule.wasteType || schedule.category || "Khác";
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    const sortedCategories = Object.entries(categoryCount).sort(
      (a, b) => b[1] - a[1]
    );

    const wasteCollectionChart = {
      type: "pie",
      height: 220,
      series: sortedCategories.map(([_, count]) => count),
      options: {
        ...chartsConfig,
        labels: sortedCategories.map(([cat]) => cat),
        colors: ["#388e3c", "#0288d1", "#ffa726", "#ef5350", "#ab47bc"],
        legend: {
          position: "bottom",
        },
        dataLabels: {
          enabled: true,
          formatter: function (val) {
            return val.toFixed(1) + "%";
          },
        },
      },
    };

    return [
      {
        color: "white",
        title: "Chất lượng dự đoán AI",
        description: "Phân bổ độ tin cậy của các lượt quét",
        footer: `Tổng: ${scanHistories.length} lượt quét`,
        chart: aiConfidenceChart,
      },
      {
        color: "white",
        title: "Top 10 loại rác phổ biến",
        description: "Các loại rác được phát hiện nhiều nhất",
        footer: `Đã phân loại ${sortedLabels.length} loại khác nhau`,
        chart: objectClassificationChart,
      },
      {
        color: "white",
        title: "Phân loại rác thu gom",
        description: "Tỷ lệ các danh mục rác được thu gom",
        footer: `${sortedCategories.length} danh mục`,
        chart: wasteCollectionChart,
      },
    ];
  }, [scanHistories, WasteCollectionSchedules]);

  return (
    <div className="mt-12">
      {/* Statistics Cards */}
      <div className="mb-12 grid gap-y-10 gap-x-6 md:grid-cols-2 xl:grid-cols-4">
        {statisticsCardsData.map(({ icon, title, footer, ...rest }) => (
          <StatisticsCard
            key={title}
            {...rest}
            title={title}
            icon={React.createElement(icon, {
              className: "w-6 h-6 text-white",
            })}
            footer={
              <Typography className="font-normal text-blue-gray-600">
                <strong className={footer.color}>{footer.value}</strong>
                &nbsp;{footer.label}
              </Typography>
            }
          />
        ))}
      </div>

      {/* Statistics Charts */}
      <div className="mb-6 grid grid-cols-1 gap-y-12 gap-x-6 md:grid-cols-2 xl:grid-cols-3">
        {statisticsChartsDataDynamic.map((props) => (
          <StatisticsChart
            key={props.title}
            {...props}
            footer={
              <Typography
                variant="small"
                className="flex items-center font-normal text-blue-gray-600"
              >
                <ClockIcon
                  strokeWidth={2}
                  className="h-4 w-4 text-blue-gray-400"
                />
                &nbsp;{props.footer}
              </Typography>
            }
          />
        ))}
      </div>

      {/* Projects + Orders */}
      <div className="mb-4 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Rewards Table */}
        <Card className="overflow-hidden xl:col-span-2 border border-blue-gray-100 shadow-sm">
          <CardHeader
            floated={false}
            shadow={false}
            color="transparent"
            className="m-0 flex items-center justify-between p-6"
          >
            <div>
              <Typography variant="h6" color="blue-gray" className="mb-1">
                Giao dịch phần thưởng gần đây
              </Typography>
              <Typography
                variant="small"
                className="flex items-center gap-1 font-normal text-blue-gray-600"
              >
                <CheckCircleIcon
                  strokeWidth={3}
                  className="h-4 w-4 text-blue-gray-200"
                />
                <strong>{recentRewards.length} giao dịch</strong> gần nhất
              </Typography>
            </div>
            <Menu placement="left-start">
              <MenuHandler>
                <IconButton size="sm" variant="text" color="blue-gray">
                  <EllipsisVerticalIcon
                    strokeWidth={3}
                    fill="currentColor"
                    className="h-6 w-6"
                  />
                </IconButton>
              </MenuHandler>
              <MenuList>
                <MenuItem>Làm mới</MenuItem>
                <MenuItem>Xem tất cả</MenuItem>
                <MenuItem>Xuất báo cáo</MenuItem>
              </MenuList>
            </Menu>
          </CardHeader>
          <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
            <table className="w-full min-w-[640px] table-auto">
              <thead>
                <tr>
                  {["Người dùng", "Danh mục", "Điểm nhận", "Ngày tạo"].map(
                    (el) => (
                      <th
                        key={el}
                        className="border-b border-blue-gray-50 py-3 px-6 text-left"
                      >
                        <Typography
                          variant="small"
                          className="text-[11px] font-medium uppercase text-blue-gray-400"
                        >
                          {el}
                        </Typography>
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {recentRewards.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-6 px-5 text-center">
                      <Typography
                        variant="small"
                        className="text-blue-gray-400"
                      >
                        Chưa có giao dịch nào
                      </Typography>
                    </td>
                  </tr>
                ) : (
                  recentRewards.map((reward, key) => {
                    const className = `py-3 px-5 ${
                      key === recentRewards.length - 1
                        ? ""
                        : "border-b border-blue-gray-50"
                    }`;

                    const createdDate = new Date(reward.createdAt).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <tr key={reward.rewardID}>
                        <td className={className}>
                          <div className="flex items-center gap-4">
                            <Avatar 
                              src={`https://ui-avatars.com/api/?name=${reward.user?.fullName || 'User'}&background=random`}
                              alt={reward.user?.fullName || 'User'} 
                              size="sm" 
                            />
                            <div>
                              <Typography
                                variant="small"
                                color="blue-gray"
                                className="font-bold"
                              >
                                {reward.userID || 'N/A'}
                              </Typography>
                              <Typography
                                variant="small"
                                className="text-xs text-blue-gray-400"
                              >
                                {reward.user?.email || ''}
                              </Typography>
                            </div>
                          </div>
                        </td>
                        <td className={className}>
                          <Typography
                            variant="small"
                            className="text-xs font-medium text-blue-gray-600"
                          >
                            {reward.category || 'Chưa phân loại'}
                          </Typography>
                        </td>
                        <td className={className}>
                          <Typography
                            variant="small"
                            className="text-xs font-bold text-green-600"
                          >
                            +{reward.pointsEarned} điểm
                          </Typography>
                        </td>
                        <td className={className}>
                          <Typography
                            variant="small"
                            className="text-xs font-medium text-blue-gray-600"
                          >
                            {createdDate}
                          </Typography>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </CardBody>
        </Card>

        {/* Orders Overview - Waste Types */}
        <Card className="border border-blue-gray-100 shadow-sm">
          <CardHeader
            floated={false}
            shadow={false}
            color="transparent"
            className="m-0 p-6"
          >
            <Typography variant="h6" color="blue-gray" className="mb-2">
              Danh mục loại rác
            </Typography>
            <Typography
              variant="small"
              className="flex items-center gap-1 font-normal text-blue-gray-600"
            >
              <ChartBarIcon
                strokeWidth={3}
                className="h-3.5 w-3.5 text-blue-500"
              />
              <strong>{wasteTypes.length} loại</strong> đang quản lý
            </Typography>
          </CardHeader>
          <CardBody className="pt-0">
            {wasteTypes.length === 0 ? (
              <div className="py-4 text-center">
                <Typography variant="small" className="text-blue-gray-400">
                  Chưa có loại rác nào
                </Typography>
              </div>
            ) : (
              wasteTypes.map((wasteType, key) => {
                // Định nghĩa icon và màu sắc cho từng loại rác
                const getWasteTypeStyle = (name) => {
                  const lowerName = name.toLowerCase();
                  if (lowerName.includes('tái chế') || lowerName.includes('recycle')) {
                    return { icon: ArrowUpIcon, color: 'text-blue-500' };
                  } else if (lowerName.includes('hữu cơ') || lowerName.includes('organic')) {
                    return { icon: CheckCircleIcon, color: 'text-green-500' };
                  } else if (lowerName.includes('nguy hại') || lowerName.includes('hazard')) {
                    return { icon: ClockIcon, color: 'text-red-500' };
                  } else {
                    return { icon: BanknotesIcon, color: 'text-gray-500' };
                  }
                };

                const { icon, color } = getWasteTypeStyle(wasteType.name);

                return (
                  <div key={wasteType.wasteID} className="flex items-start gap-4 py-3">
                    <div
                      className={`relative p-1 after:absolute after:-bottom-6 after:left-2/4 after:w-0.5 after:-translate-x-2/4 after:bg-blue-gray-50 after:content-[''] ${
                        key === wasteTypes.length - 1
                          ? "after:h-0"
                          : "after:h-4/6"
                      }`}
                    >
                      {React.createElement(icon, {
                        className: `!w-5 !h-5 ${color}`,
                      })}
                    </div>
                    <div>
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="block font-medium"
                      >
                        {wasteType.name}
                      </Typography>
                      <Typography
                        as="span"
                        variant="small"
                        className="text-xs font-medium text-blue-gray-500"
                      >
                        {wasteType.description || `Loại rác ${wasteType.name.toLowerCase()}`}
                      </Typography>
                    </div>
                  </div>
                );
              })
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default Home;