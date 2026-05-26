import React from 'react'
import { useAuth } from '../AuthProvider';
import { useState } from 'react';

const PharmacyProfile = () => {

    const {user}  = useAuth();

    const [data , setData] = useState({
        pharmacyName: '',
        licenseNumber: '',
        drugLicenseNumber: '',
        gstNumber: '',
        ownerName: '',
        email: '',
        file: null,
        phoneNumber: '',
        emergencyContact: '',
        city: '',
        state: '',
        pincode: '',
        address: '',
        about: '',
        services: [],
        categories: [],
        visibility: 'public',
    });


    const OpenFile = () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                    setData(prev => ({...prev , file}))
                console.log('Selected file:', file);
            }
        };
        fileInput.click();
    }

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-teal-900">Pharmacy Profile</h1>
            <p className="text-slate-500 mt-2">
              Manage pharmacy details, contact information and services.
            </p>
          </div>

          <button className="px-6 py-3 rounded-2xl bg-teal-700 text-white font-semibold shadow-lg hover:scale-105 transition-all">
            Save Changes
          </button>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* Pharmacy Information */}
            <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-2xl font-semibold mb-5 text-slate-800">
                Pharmacy Information
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                <input type='text' label="Pharmacy Name"
                
                className="w-full rounded-2xl border border-slate-300 p-4 outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="VitalCare Pharmacy" />
                <input type='text' 
                                className="w-full rounded-2xl border border-slate-300 p-4 outline-none focus:ring-2 focus:ring-teal-500"

                label="License Number" placeholder="PH-12345" />
                <input type='text' 
                className="w-full rounded-2xl border border-slate-300 p-4 outline-none focus:ring-2 focus:ring-teal-500"

                label="Drug License Number" placeholder="DL-88992" />
                <input type='text' 
                className="w-full rounded-2xl border border-slate-300 p-4 outline-none focus:ring-2 focus:ring-teal-500"
                label="GST Number" placeholder="GST123456" />
                <div className="md:col-span-2">
                  <input
                    type='text'
                    value={user?.name}
                    className="w-full rounded-2xl border border-slate-300 p-4 outline-none focus:ring-2 focus:ring-teal-500 bg-gray-100 cursor-not-allowed"
                    label="Owner / Pharmacist Name"
                    placeholder="Dr. John Doe"
                    disabled
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Pharmacy Logo
                </label>

                <div 
                onClick={OpenFile}
                className="border-2 border-dashed border-slate-300 rounded-2xl h-36 flex items-center justify-center text-slate-500 hover:border-teal-600 transition cursor-pointer">
                  Upload Logo
                </div>
              </div>
            </section>

            {/* Contact */}
            <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-2xl font-semibold mb-5 text-slate-800">
                Contact & Address
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                <input type='email'
                value={user?.email}
                className="w-full rounded-2xl border border-slate-300 p-4 outline-none focus:ring-2 focus:ring-teal-500 bg-gray-100 cursor-not-allowed"
                label="Email" placeholder="pharmacy@email.com" />
                <input type='tel'
                className="w-full rounded-2xl border border-slate-300 p-4 outline-none focus:ring-2 focus:ring-teal-500"
                label="Phone Number" placeholder="9876543210" />
                <input type='tel' 
                className="w-full rounded-2xl border border-slate-300 p-4 outline-none focus:ring-2 focus:ring-teal-500"label="Emergency Contact" placeholder="9876543210" />
                <input type='text'
                className="w-full rounded-2xl border border-slate-300 p-4 outline-none focus:ring-2 focus:ring-teal-500" label="City" placeholder="Ahmedabad" />
                <input type='text'
                className="w-full rounded-2xl border border-slate-300 p-4 outline-none focus:ring-2 focus:ring-teal-500" label="State" placeholder="Gujarat" />
                <input type='text'
                className="w-full rounded-2xl border border-slate-300 p-4 outline-none focus:ring-2 focus:ring-teal-500" label="Pincode" placeholder="388620" />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Full Address
                </label>
                <textarea

                  rows={4}
                  placeholder="Enter pharmacy address"
                  className="w-full rounded-2xl border border-slate-300 p-4 outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </section>

            {/* About */}
            <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-2xl font-semibold mb-5 text-slate-800">
                About Pharmacy
              </h2>

              <textarea
                rows={6}
                placeholder="Write pharmacy description..."
                className="w-full rounded-2xl border border-slate-300 p-4 outline-none focus:ring-2 focus:ring-teal-500"
              />
            </section>
          </div>

          {/* Right */}
          <div className="col-span-12 lg:col-span-4 space-y-6">

    

            {/* Visibility */}
            <section className="bg-teal-700 text-white rounded-3xl p-6 shadow-lg">
              <h2 className="text-2xl font-semibold mb-3">
                Visibility Status
              </h2>

              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                <span>Public & Online</span>
              </div>

              <button className="w-full bg-white text-teal-700 py-3 rounded-2xl font-semibold hover:scale-[1.02] transition-all">
                Hide Profile
              </button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PharmacyProfile
