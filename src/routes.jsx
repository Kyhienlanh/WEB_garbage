// import {
//   HomeIcon,
//   UserCircleIcon,
//   TableCellsIcon,
//   InformationCircleIcon,
//   ServerStackIcon,
//   RectangleStackIcon,
// } from "@heroicons/react/24/solid";
// import { Home, Profile, Tables, Notifications, TestComponent, Hello, ScanHistory, PointsGarbage, WasteScheduleManager } from "@/pages/dashboard";

// import { SignIn, SignUp } from "@/pages/auth";

// const icon = {
//   className: "w-5 h-5 text-inherit",
// };

// export const routes = [
//   {
//     layout: "dashboard",
//     pages: [
//       {
//         icon: <HomeIcon {...icon} />,
//         name: "Trang chủ",
//         path: "/home",
//         element: <Home />,
//       },
//       // {
//       //   icon: <UserCircleIcon {...icon} />,
//       //   name: "profile",
//       //   path: "/profile",
//       //   element: <Profile />,
//       // },
//       {
//         icon: <TableCellsIcon {...icon} />,
//         name: "Phiếu giảm giá",
//         path: "/tables",
//         element: <Tables />,
//       },
//       {
//         icon: <InformationCircleIcon {...icon} />,
//         name: "Quản lý đổi thưởng",
//         path: "/notifications",
//         element: <Notifications />,
//       },
//         {
//         icon: <InformationCircleIcon {...icon} />,
//         name: "Quản lý điểm thưởng",
//         path: "/TestComponent",
//         element: <TestComponent />,
//       },
//         {
//         icon: <InformationCircleIcon {...icon} />,
//         name: "Quản lý người dùng",
//         path: "/Hello",
//         element: <Hello />,
//       },
//       {
//         icon: <InformationCircleIcon {...icon} />,
//         name: "Lịch sử quét rác",
//         path: "/ScanHistory",
//         element: <ScanHistory />,
//       },
//       {
//         icon: <InformationCircleIcon {...icon} />,
//         name: "Điểm thu gom rác",
//         path: "/PointsGarbage",
//         element: <PointsGarbage />,
//       },
//        {
//         icon: <InformationCircleIcon {...icon} />,
//         name: "Lịch thu gom rác",
//         path: "/WasteScheduleManager",
//         element: <WasteScheduleManager />,
//       },
      
//     ],
//   },
//   // {
//   //   title: "auth pages",
//   //   layout: "auth",
//   //   pages: [
//   //     {
//   //       icon: <ServerStackIcon {...icon} />,
//   //       name: "sign in",
//   //       path: "/sign-in",
//   //       element: <SignIn />,
//   //     },
//   //     {
//   //       icon: <RectangleStackIcon {...icon} />,
//   //       name: "sign up",
//   //       path: "/sign-up",
//   //       element: <SignUp />,
//   //     },
//   //   ],
//   // },
// ];

// export default routes;
import {
  HomeIcon,
  TicketIcon,
  GiftIcon,
  TrophyIcon,
  UsersIcon,
  MagnifyingGlassCircleIcon,
  MapPinIcon,
  CalendarDaysIcon,
  QrCodeIcon,
  VideoCameraIcon
} from "@heroicons/react/24/solid";


import { Home, Profile, Tables, Notifications, TestComponent, Hello, ScanHistory, PointsGarbage, WasteScheduleManager } from "@/pages/dashboard";

import { SignIn, SignUp } from "@/pages/auth";
import RenderQRCode from "./pages/dashboard/RenderQRcode";
import WebQRCodeScanner from "./pages/dashboard/WebQRCodeScanner";

const icon = {
  className: "w-5 h-5 text-inherit",
};

export const routes = [
  {
    layout: "dashboard",
    pages: [
      {
        icon: <HomeIcon {...icon} />,
        name: "Trang chủ",
        path: "/home",
        element: <Home />,
      },
      {
        icon: <TicketIcon {...icon} />,
        name: "Phiếu giảm giá",
        path: "/tables",
        element: <Tables />,
      },
      {
        icon: <GiftIcon {...icon} />,
        name: "Quản lý đổi thưởng",
        path: "/notifications",
        element: <Notifications />,
      },
      {
        icon: <TrophyIcon {...icon} />,
        name: "Quản lý điểm thưởng",
        path: "/TestComponent",
        element: <TestComponent />,
      },
      {
        icon: <UsersIcon {...icon} />,
        name: "Quản lý người dùng",
        path: "/Hello",
        element: <Hello />,
      },
      {
        icon: <MagnifyingGlassCircleIcon {...icon} />,
        name: "Lịch sử quét rác",
        path: "/ScanHistory",
        element: <ScanHistory />,
      },
      {
        icon: <MapPinIcon {...icon} />,
        name: "Điểm thu gom rác",
        path: "/PointsGarbage",
        element: <PointsGarbage />,
      },
      {
        icon: <CalendarDaysIcon {...icon} />,
        name: "Lịch thu gom rác",
        path: "/WasteScheduleManager",
        element: <WasteScheduleManager />,
      },
       {
        icon: <QrCodeIcon {...icon} />,
        name: "QR Code",
        path: "/RenderQRCode",
        element: <RenderQRCode />,
      },
       {
        icon: < VideoCameraIcon{...icon} />,
        name: "Quét QR",
        path: "/WebQRCodeScanner",
        element: <WebQRCodeScanner />,
      },
    ],
  },
];

export default routes;