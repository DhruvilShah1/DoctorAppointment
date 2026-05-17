import React, { useState } from "react";
import { NavLink } from "react-router-dom";

const UserSidebar = () => {
  const [open, setOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    `p-3 rounded-lg flex items-center gap-2 transition-all ${
      isActive
        ? "bg-teal-50 text-teal-700 font-semibold"
        : "text-gray-600 hover:bg-gray-100"
    }`;

  return (
    <>
      {/* ✅ TOP BAR (VISIBLE ON MOBILE ONLY) */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-white shadow px-4 py-3 flex justify-between items-center z-50">
        <h1 className="font-bold text-teal-700">VitalCare</h1>

        {/* 🔥 3 DOT BUTTON */}
        <button
          onClick={() => setOpen(true)}
          className="text-3xl leading-none"
        >
          ⋮
        </button>
      </div>

      {/* ✅ OVERLAY */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
        />
      )}

      {/* ✅ SIDEBAR */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-white border-r shadow-sm flex flex-col
          transition-transform duration-300 z-50
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:block
        `}
      >
        {/* Logo */}
        <div className="p-6 font-bold text-xl text-teal-700 mt-10 md:mt-0">
          VitalCare
        </div>

        {/* Menu */}
        <nav className="flex flex-col gap-2 px-4">
          <NavLink to="/dashboard" className={linkClass}>
            Dashboard
          </NavLink>

          <NavLink to="/appointments" className={linkClass}>
            Appointments
          </NavLink>

          <NavLink to="/queue" className={linkClass}>
            Queue
          </NavLink>

          <NavLink to="/records" className={linkClass}>
            Records
          </NavLink>
        </nav>
      </aside>
    </>
  );
};

export default UserSidebar;