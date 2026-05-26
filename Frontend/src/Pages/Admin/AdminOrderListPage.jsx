// /*
//  * Copyright (c) - All Rights Reserved.
//  *
//  * See the LICENSE file for more information.
//  */

// import { useMemo, useState } from "react";
// import { Link } from "react-router-dom";

// const AdminOrderListPage = () => {
//   const initialOrders = useMemo(
//     () => [
//       {
//         _id: "order1",
//         createdAt: new Date(),
//         isPaid: false,
//         isDelivered: false,
//         paymentMethod: "Cash on Delivery",
//         user: { name: "John Doe" },
//         orderItems: [
//           { name: "Stylish Jacket", quantity: 1 },
//           { name: "Shirt", quantity: 2 },
//         ],
//         totalPrice: 71.97,
//       },
//       {
//         _id: "order2",
//         createdAt: new Date(),
//         isPaid: false,
//         isDelivered: true,
//         paymentMethod: "Cash on Delivery",
//         user: { name: "Jane Smith" },
//         orderItems: [{ name: "Product A", quantity: 1 }],
//         totalPrice: 29.99,
//       },
//     ],
//     [],
//   );

//   const [orders, setOrders] = useState(initialOrders);

//   return (
//     <div className="max-w-7xl mx-auto p-4 sm:p-6">
//       <h2 className="text-2xl md:text-3xl font-bold mb-6">All Orders</h2>
//       <div className="overflow-x-auto">
//         <table className="min-w-full text-gray-600">
//           <thead className="bg-gray-100">
//             <tr>
//               <th className="px-4 py-2">Order ID</th>
//               <th className="px-4 py-2">Date</th>
//               <th className="px-4 py-2">Customer</th>
//               <th className="px-4 py-2">Total</th>
//               <th className="px-4 py-2">Paid</th>
//               <th className="px-4 py-2">Delivered</th>
//               <th className="px-4 py-2">Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {orders.map((order) => (
//               <tr key={order._id} className="border-b">
//                 <td className="px-4 py-2">#{order._id}</td>
//                 <td className="px-4 py-2">
//                   {new Date(order.createdAt).toLocaleDateString()}
//                 </td>
//                 <td className="px-4 py-2">{order.user.name}</td>
//                 <td className="px-4 py-2">${order.totalPrice.toFixed(2)}</td>
//                 <td className="px-4 py-2">
//                   <span
//                     className={`${order.isPaid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"} px-3 py-1 rounded-full text-sm font-medium`}
//                   >
//                     {order.isPaid ? "Yes" : "No"}
//                   </span>
//                 </td>
//                 <td className="px-4 py-2">
//                   <span
//                     className={`${order.isDelivered ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"} px-3 py-1 rounded-full text-sm font-medium`}
//                   >
//                     {order.isDelivered ? "Yes" : "No"}
//                   </span>
//                 </td>
//                 <td className="px-4 py-2">
//                   <Link
//                     to={`/admin/order/${order._id}`}
//                     className="text-blue-500 hover:underline"
//                   >
//                     Details
//                   </Link>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// export default AdminOrderListPage;
