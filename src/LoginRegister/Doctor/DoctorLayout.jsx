import React from "react";
import { Outlet } from "react-router-dom";
import DoctorSidebar from "./DoctorSidebar";
import DoctorHeader from "./DoctorHeader";

const DoctorLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <DoctorSidebar />

      <div className="flex-1 md:ml-64 flex flex-col">
        <DoctorHeader />

        <main className="p-4 md:p-8">   
            <Outlet/>
        </main>
      </div>
    </div>
  );
};

export default DoctorLayout;