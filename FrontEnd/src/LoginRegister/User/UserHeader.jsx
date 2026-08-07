import React from "react";

const UserHeader = () => {
  return (
    <header className="w-full bg-white shadow-sm flex items-center justify-between px-4 md:px-6 py-3 sticky top-0 z-50">

      {/* Left */}
      <h1 className="text-lg font-bold text-teal-700">
        VitalCare Dashboard
      </h1>

      {/* Search */}
      <div className="hidden md:block w-1/3">
        <input
          type="text"
          placeholder="Search health records..."
          className="w-full px-4 py-2 bg-slate-100 rounded-xl outline-none"
        />
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-full hover:bg-gray-100">
          🔔
        </button>
        <div className="w-9 h-9 rounded-full bg-teal-200" />
      </div>
    </header>
  );
};

export default UserHeader;