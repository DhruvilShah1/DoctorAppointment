import BASE_URL from "../../config/api";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const ViewDoctorProfile = () => {
  const { doctorId } = useParams();

  const [data, setData] = useState(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Fetch Profile
  const getProfile = async () => {
    try {
      const res = await fetch(
        `${BASE_URL}/api/doctor/profile/${doctorId}`
      );

      const result = await res.json();

      console.log(result);

      // Save doctor object
      setData(result.doctor);

    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (doctorId) {
      getProfile();
    }
  }, [doctorId]);

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-3xl font-bold">
        Loading...
      </div>
    );
  }

  // No Data
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-3xl font-bold text-red-500">
        Doctor Not Found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-gray-800">

      {/* HERO HEADER */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#312e81]">

        <div className="absolute top-[-120px] right-[-80px] w-[350px] h-[350px] bg-cyan-400/20 rounded-full blur-3xl"></div>

        <div className="absolute bottom-[-100px] left-[-50px] w-[300px] h-[300px] bg-purple-500/20 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-12 pb-28 relative z-10">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

            {/* LEFT */}
            <div>

              <p className="text-cyan-300 uppercase tracking-[5px] text-sm font-semibold">
                Professional Healthcare Specialist
              </p>

              <h1 className="text-5xl lg:text-7xl font-black text-white mt-3 leading-tight">
                Dr. {data?.doctorId?.name}
              </h1>

              <p className="text-2xl text-blue-100 mt-4">
                {data?.title}
              </p>

              <p className="text-lg text-blue-200 mt-4 max-w-2xl leading-relaxed">
                Dedicated to compassionate care, modern treatment, and helping patients live healthier lives with advanced medical expertise.


              </p>

              {/* INFO */}
              <div className="flex flex-wrap items-center gap-5 mt-8">

                <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-5 py-3 rounded-2xl border border-white/10">
                  <span className="text-green-300 text-lg">✔</span>

                  <div>
                    <p className="text-white font-bold">
                      {data?.experience}+ Years
                    </p>

                    <p className="text-blue-100 text-sm">
                      Experience
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-5 py-3 rounded-2xl border border-white/10">
                  <span className="text-pink-300 text-lg">📍</span>

                  <div>
                    <p className="text-white font-bold">
                      {data?.address}
                    </p>

                    <p className="text-blue-100 text-sm">
                      Clinic Address
                    </p>
                  </div>
                </div>

              </div>

              {/* BUTTONS */}
              <div className="flex flex-wrap gap-4 mt-10">
                <button 
                 onClick={()=> {
                navigate('/appointments')
              }}
                className="px-8 py-4 rounded-2xl bg-white text-indigo-700 font-bold shadow-2xl hover:scale-105 transition-all duration-300">
                  Book Appointment
                </button>

                <button className="px-8 py-4 rounded-2xl border border-white/20 bg-white/10 backdrop-blur text-white font-semibold hover:bg-white/20 transition">
                  Contact Doctor
                </button>
              </div>
            </div>

            {/* IMAGE */}
            <div className="relative flex justify-center lg:justify-end">

              <div className="absolute inset-0 bg-cyan-400/20 blur-3xl rounded-full"></div>

              <div className="relative">
                <img
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${data?.doctorId?.name}`}
                  alt="doctor"
                  className="w-[320px] h-[320px] rounded-[40px] border-[6px] border-white/20 bg-white shadow-[0_20px_80px_rgba(0,0,0,0.4)]"
                />

                {/* Floating Badge */}
                <div className="absolute -bottom-6 -left-6 bg-white shadow-2xl rounded-3xl px-6 py-4 border border-gray-100">
                  <p className="text-sm text-gray-500">
                    Experience
                  </p>

                  <h2 className="text-3xl font-black text-indigo-700">
                    {data?.experience}+
                  </h2>
                </div>

                {/* Available */}
                <div className="absolute top-5 right-5 bg-emerald-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>

                  Available
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 -mt-16 relative z-20">

        <div className="grid lg:grid-cols-3 gap-8">

          {/* LEFT */}
          <div className="lg:col-span-2 space-y-8">

            {/* ABOUT */}
            <div className="bg-white rounded-[32px] p-8 shadow-xl border border-gray-100">
              <h2 className="text-3xl font-black text-gray-900 mb-6">
                About Doctor
              </h2>

              <p className="text-gray-600 leading-9 text-lg">
                {data?.bio}
              </p>
            </div>

            {/* SPECIALTIES */}
            <div className="bg-white rounded-[32px] p-8 shadow-xl border border-gray-100">
              <h2 className="text-3xl font-black text-gray-900 mb-8">
                Specialties
              </h2>

              <div className="flex flex-wrap gap-4">

                {data?.specialties?.map((item, index) => (
                  <div
                    key={index}
                    className="px-6 py-4 rounded-2xl bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 font-bold shadow-md hover:scale-105 transition"
                  >
                    {item}
                  </div>
                ))}

              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-8">

            {/* CONTACT */}
            <div className="bg-white rounded-[32px] p-8 shadow-xl border border-gray-100">
              <h2 className="text-2xl font-black text-gray-900 mb-6">
                Contact Information
              </h2>

              <div className="space-y-5">

                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center text-2xl">
                    📧
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Email Address
                    </p>

                    <h3 className="font-bold text-gray-800">
                      {data?.doctorId?.email}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center text-2xl">
                    📞
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Phone Number
                    </p>

                    <h3 className="font-bold text-gray-800">
                      {data?.phone}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-pink-100 flex items-center justify-center text-2xl">
                    📍
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Address
                    </p>

                    <h3 className="font-bold text-gray-800">
                      {data?.address}
                    </h3>
                  </div>
                </div>

              </div>
            </div>

            {/* EXPERIENCE */}
            <div className="bg-[#0f172a] text-white rounded-[32px] p-8 shadow-2xl overflow-hidden relative">

              <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl"></div>

              <p className="uppercase tracking-[4px] text-sm text-blue-200">
                Professional Experience
              </p>

              <h2 className="text-7xl font-black mt-4">
                {data?.experience}+
              </h2>

              <p className="text-blue-100 text-lg mt-4 leading-8">
                Years of successful clinical experience and
                patient-centered treatment.
              </p>

              <button 
              onClick={()=> {
                navigate('/appointments')
              }}
              className="mt-8 w-full py-4 rounded-2xl bg-white text-indigo-700 font-bold hover:scale-105 transition">
                View Schedule
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewDoctorProfile;