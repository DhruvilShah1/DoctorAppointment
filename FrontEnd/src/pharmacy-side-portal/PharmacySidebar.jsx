import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Package, ClipboardList, Menu, X } from "lucide-react";

const PharmacySidebar = () => {
  const [open, setOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      isActive
        ? "bg-teal-100 text-teal-700 font-semibold shadow-sm"
        : "text-gray-600 hover:bg-gray-100"
    }`;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Topbar */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-white shadow-md px-4 py-3 flex justify-between items-center z-50">
        <h1 className="font-bold text-xl text-teal-700">
          VitalCare
        </h1>

        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static top-0 left-0 h-screen w-64 bg-white border-r shadow-sm z-50
          transform transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b mt-12 md:mt-0">
          <h1 className="text-2xl font-bold text-teal-700">
            VitalCare
          </h1>
          <p className="text-sm text-gray-500">
            Pharmacy Panel
          </p>
        </div>

        {/* Navigation */}
        <nav className="p-4 flex flex-col gap-2">

<NavLink
            to="/dashboard/pharmacy/profile"
            className={linkClass}
            onClick={() => setOpen(false)}
          >
            <LayoutDashboard size={20} />
            Profile
          </NavLink>


          <NavLink
            to="/dashboard/pharmacy/orders"
            className={linkClass}
            onClick={() => setOpen(false)}
          >
            <LayoutDashboard size={20} />
            Scanner & Orders
          </NavLink>

          <NavLink
            to="/dashboard/pharmacy/orders"
            className={linkClass}
            onClick={() => setOpen(false)}
          >
            <ClipboardList size={20} />
            Inventory
          </NavLink>

          <NavLink
            to="/dashboard/pharmacy/inventory"
            className={linkClass}
            onClick={() => setOpen(false)}
          >
            <Package size={20} />
            Inventory
          </NavLink>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-0 pt-20 md:pt-0 p-4 md:p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default PharmacySidebar;