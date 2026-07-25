import React from "react";
import { Outlet } from "react-router-dom";
import UserHeader from "./UserHeader";
import UserSidebar from "./UseSidebar";
import Chatbot from "./Chatbot";

const MainLayout = () => {

  
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <UserSidebar />
      

      <div className="flex-1 md:ml-64 flex flex-col">
        <UserHeader />

        <main className="p-4 md:p-8">
            <Outlet/>
        </main>
      </div>
      <Chatbot/>
    </div>
  );
};

export default MainLayout;