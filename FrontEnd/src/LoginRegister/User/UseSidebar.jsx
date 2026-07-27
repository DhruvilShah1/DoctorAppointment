import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";

const UserSidebar = () => {
  const [open, setOpen] = useState(false);

  const closeSidebar = () => setOpen(false);

  const linkClass = ({ isActive }) =>
    `p-3 rounded-xl flex items-center gap-2 transition-all duration-200 ${
      isActive
        ? "bg-teal-100 text-teal-700 font-semibold"
        : "text-gray-600 hover:bg-gray-100"
    }`;

  return (
    <>
      {/* MOBILE TOPBAR */}
      <div className="md:hidden fixed top-0 left-0 w-full h-16 bg-white shadow-sm border-b px-4 flex justify-between items-center z-[60]">
        <h1 className="font-bold text-lg text-teal-700">
          VitalCare
        </h1>

        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <Menu size={28} />
        </button>
      </div>

      {/* OVERLAY */}
      {open && (
        <div
          onClick={closeSidebar}
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed left-0 top-0
          h-[100vh] md:h-screen
          w-64 bg-white border-r shadow-lg
          z-50 flex flex-col
          transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-5 border-b">
          <h1 className="font-bold text-2xl text-teal-700">
            VitalCare
          </h1>

          <button onClick={closeSidebar} className="md:hidden">
            <X size={24} />
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="flex flex-col gap-2 p-4">
          <NavLink
            to="/dashboard"
            className={linkClass}
            onClick={closeSidebar}
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/appointments"
            className={linkClass}
            onClick={closeSidebar}
          >
            Appointments
          </NavLink>

          <NavLink
            to="/queue"
            className={linkClass}
            onClick={closeSidebar}
          >
            Queue
          </NavLink>

          <NavLink
            to="/records"
            className={linkClass}
            onClick={closeSidebar}
          >
            Records
          </NavLink>

          <NavLink
          to="/setting"
          className={linkClass}
          onClick={closeSidebar}
          >
            Setting
          </NavLink>
        </nav>
      </aside>
    </>
  );
};

export default UserSidebar;