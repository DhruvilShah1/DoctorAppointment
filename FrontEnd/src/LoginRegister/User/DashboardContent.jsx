import React from "react";
import { useAuth } from "../../AuthProvider";
const VITE_BACKEND_URL = import.meta.VITE_BACKEND_URL;

import {
  ArrowRight,
  CalendarDays,
  Stethoscope,
  Users,
  BellRing,
  ShieldCheck,
  HeartPulse,
  Clock3,
  CheckCircle2,
} from "lucide-react";

const DashboardContent = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-10">
      {/* HERO SECTION */}

      <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-teal-600 via-cyan-600 to-sky-600 p-10 lg:p-14 shadow-2xl">
        {/* BACKGROUND */}

        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>

        <div className="absolute bottom-0 left-0 w-72 h-72 bg-black/10 rounded-full blur-3xl"></div>

        {/* CONTENT */}

        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-5 py-2 rounded-full text-white mb-6">
            <HeartPulse size={18} />

            <span className="font-medium">
              Smart Healthcare Platform
            </span>
          </div>

          <h1 className="text-5xl lg:text-6xl font-black text-white leading-tight">
            Welcome Back,
            <br />
           <span className="uppercase">  {user?.name} 👋 </span>
          </h1>
          <p className="mt-6 text-lg text-cyan-50 leading-relaxed max-w-3xl">
            Manage appointments, join live queues,
            consult doctors, track your medical
            records, and experience a faster healthcare
            system — all in one platform.
          </p>

          <div className="flex flex-wrap gap-4 mt-8">
            <button className="bg-white text-teal-700 hover:bg-slate-100 transition px-8 py-4 rounded-2xl font-bold shadow-lg flex items-center gap-2">
              Get Started

              <ArrowRight size={20} />
            </button>

            <button className="bg-black/20 hover:bg-black/30 text-white transition px-8 py-4 rounded-2xl font-semibold">
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}

      <div>
        <div className="mb-8">
          <h2 className="text-4xl font-black text-gray-800">
            How The Platform Works
          </h2>

          <p className="text-gray-500 mt-3 text-lg">
            Everything designed for smoother patient
            experience and faster clinic management.
          </p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* STEP 1 */}

          <div className="group bg-white rounded-[35px] p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
            <div className="w-20 h-20 rounded-3xl bg-teal-100 flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <CalendarDays
                className="text-teal-600"
                size={36}
              />
            </div>

            <h3 className="text-2xl font-bold text-gray-800">
              Book Appointment
            </h3>

            <p className="text-gray-500 mt-4 leading-relaxed">
              Choose your doctor, select time slots,
              and confirm appointments instantly
              online.
            </p>
          </div>

          {/* STEP 2 */}

          <div className="group bg-white rounded-[35px] p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
            <div className="w-20 h-20 rounded-3xl bg-cyan-100 flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <Users
                className="text-cyan-600"
                size={36}
              />
            </div>

            <h3 className="text-2xl font-bold text-gray-800">
              Join Live Queue
            </h3>

            <p className="text-gray-500 mt-4 leading-relaxed">
              Track your real-time queue number and
              avoid long waiting lines inside clinics.
            </p>
          </div>

          {/* STEP 3 */}

          <div className="group bg-white rounded-[35px] p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
            <div className="w-20 h-20 rounded-3xl bg-green-100 flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <BellRing
                className="text-green-600"
                size={36}
              />
            </div>

            <h3 className="text-2xl font-bold text-gray-800">
              Get Notifications
            </h3>

            <p className="text-gray-500 mt-4 leading-relaxed">
              Receive instant updates when your turn
              is near or your appointment is confirmed.
            </p>
          </div>

          {/* STEP 4 */}

          <div className="group bg-white rounded-[35px] p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
            <div className="w-20 h-20 rounded-3xl bg-orange-100 flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <ShieldCheck
                className="text-orange-500"
                size={36}
              />
            </div>

            <h3 className="text-2xl font-bold text-gray-800">
              Access Records
            </h3>

            <p className="text-gray-500 mt-4 leading-relaxed">
              Securely view prescriptions, completed
              appointments, and medical history anytime.
            </p>
          </div>
        </div>
      </div>

      {/* FEATURES */}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* LEFT */}

        <div className="bg-white rounded-[40px] p-10 shadow-xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center">
              <Stethoscope className="text-teal-600" />
            </div>

            <div>
              <h2 className="text-3xl font-bold text-gray-800">
                Why Use This Platform?
              </h2>

              <p className="text-gray-500">
                Built for patients and doctors
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {[
              "Real-time queue tracking system",
              "Faster appointment management",
              "Live doctor queue updates",
              "Digital patient records",
              "Reduced waiting time",
              "Simple and clean experience",
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="text-green-600" />
                </div>

                <div>
                  <h3 className="font-bold text-lg text-gray-800">
                    {item}
                  </h3>

                  <p className="text-gray-500 mt-1">
                    Designed to improve healthcare
                    experience efficiently.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT */}

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[40px] p-10 text-white shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
                <Clock3 className="text-cyan-400" />
              </div>

              <div>
                <h2 className="text-3xl font-bold">
                  Smart Queue Experience
                </h2>

                <p className="text-gray-400">
                  Real-time patient management
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                <p className="text-cyan-400 font-semibold">
                  Step 01
                </p>

                <h3 className="text-2xl font-bold mt-2">
                  Select Appointment
                </h3>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                <p className="text-cyan-400 font-semibold">
                  Step 02
                </p>

                <h3 className="text-2xl font-bold mt-2">
                  Join Queue Live
                </h3>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                <p className="text-cyan-400 font-semibold">
                  Step 03
                </p>

                <h3 className="text-2xl font-bold mt-2">
                  Get Called By Doctor
                </h3>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                <p className="text-cyan-400 font-semibold">
                  Step 04
                </p>

                <h3 className="text-2xl font-bold mt-2">
                  Consultation Complete
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM CTA */}

      <div className="rounded-[40px] bg-gradient-to-r from-teal-600 to-cyan-600 p-10 text-center shadow-2xl">
        <h2 className="text-4xl font-black text-white">
          Better Healthcare Starts Here
        </h2>

        <p className="text-cyan-100 text-lg mt-4 max-w-3xl mx-auto">
          Experience smart appointment booking,
          real-time queue management, and digital
          healthcare records — all from one place.
        </p>

        <button className="mt-8 bg-white text-teal-700 hover:bg-slate-100 transition px-10 py-4 rounded-2xl font-bold shadow-lg">
          Explore Features
        </button>
      </div>
    </div>
  );
};

export default DashboardContent;