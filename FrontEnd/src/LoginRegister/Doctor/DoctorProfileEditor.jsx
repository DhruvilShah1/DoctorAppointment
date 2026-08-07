import React, { useState, useEffect } from 'react';
import { User, Camera, Phone, MapPin, Mail, Plus, X, Save } from 'lucide-react';
import { useAuth } from '../../AuthProvider';
import { toast } from 'react-toastify';
const VITE_BACKEND_URL = import.meta.VITE_BACKEND_URL;

const DoctorProfileEditor = () => {

    const { user } = useAuth();


    console.log(user);
    




  

  const initialState = {
    name: user.name,
    email: user.email,
    phone: '',
    title: '',
    experience: '',
    bio: '',
    address: 'Khambhat, Gujarat',
  };

  const [form, setForm] = useState(initialState);
  const [specialties, setSpecialties] = useState([
    'Cardiology',
    'Diabetes Care',
  ]);

  const [newSpecialty, setNewSpecialty] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setIsDirty(true);
  };

  const addSpecialty = () => {
    if (!newSpecialty.trim()) return;
    setSpecialties([...specialties, newSpecialty.trim()]);
    setNewSpecialty('');
    setIsDirty(true);
  };

  const removeSpecialty = (index) => {
    setSpecialties(specialties.filter((_, i) => i !== index));
    setIsDirty(true);
  };



  const getProfile = async () => {
  try {
    const refreshRes = await fetch(
      `${VITE_BACKEND_URL}/api/refresh-token`,
      {
        method: "POST",
        credentials: "include",
      }
    );

    if (!refreshRes.ok) {
      throw new Error(
        "Session expired, please login again"
      );
    }

    const refreshData =
      await refreshRes.json();

    const newToken =
      refreshData.newAccessToken;

    const createRes = await fetch(
      `${VITE_BACKEND_URL}/api/get/doctor/profile`,
      {
        method: "GET",
        headers: {
          "Content-Type":
            "application/json",
          Authorization: `Bearer ${newToken}`,
        },
      }
    );

    const data = await createRes.json();

    // profile not created yet
    if (createRes.status === 404) {
      console.log(
        "No profile found, using defaults"
      );
      return;
    }

    if (!createRes.ok) {
      throw new Error(
        data.message ||
          "Something went wrong"
      );
    }

    setForm({
      name: data.name || user?.name || "",
      email:
        data.email ||
        user?.email ||
        "",
      phone: data.phone || "",
      title: data.title || "",
      experience:
        data.experience || "",
      bio: data.bio || "",
      address:
        data.address ||
        "Khambhat, Gujarat",
    });

    setSpecialties(
      data.specialties || []
    );

    setIsDirty(false);

  } catch (err) {
    console.error(err);
    toast.error(err.message);
  }
};


  
  useEffect(()=>{

    getProfile();
  } , [])


  const handleSave = async () => {
  for (const key in form) {
    if (!form[key] || form[key].toString().trim() === "") {
      alert(`Please fill the ${key} field`);
      return;
    }
  }

  if (!specialties || specialties.length === 0) {
    alert("Please add at least one specialty");
    return;
  }

  const payload = {
    ...form,
    specialties,
  };

  try {
    const refreshRes = await fetch(
      `${VITE_BACKEND_URL}/api/refresh-token`,
      {
        method: "POST",
        credentials: "include",
      }
    );

    const refreshData = await refreshRes.json();

    if (!refreshRes.ok) {
      throw new Error("Session expired, please login again");
    }

    const newToken = refreshData.newAccessToken;

    const createRes = await fetch(`${VITE_BACKEND_URL}/api/create/doctor/profile`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${newToken}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await createRes.json();

    if (!createRes.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    toast.success(data.message);


    setIsDirty(false);
  } catch (err) {
    console.error(err);
    toast.error(err.message);
  }
};

  const handleCancel = () => {
    setForm(initialState);
    setSpecialties(['Cardiology', 'Diabetes Care']);
    setNewSpecialty('');
    setIsDirty(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">

     <div className="grid md:grid-cols-3 gap-6">


        {/* LEFT */}
        <div className="md:col-span-2 space-y-6">

          {/* PERSONAL */}
          <div className="bg-white shadow-md rounded-2xl p-6 border">

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-violet-100 rounded-xl">
                <User className="text-violet-600" />
              </div>
              <h2 className="text-xl font-semibold">Personal Information</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">

              <div className="flex flex-col items-center gap-3">
                <img
                  src="https://www.shutterstock.com/image-vector/male-doctor-smiling-happy-face-600nw-2481032615.jpg"
                  className="h-32 w-32 object-cover rounded-2xl border"
                />
                <span className="text-sm text-violet-600 cursor-pointer">
                  Change Photo
                </span>
              </div>

              <div className="md:col-span-2 space-y-4">

                <input
                  value={form.name}
                  disabled
                  className="w-full border p-2.5 rounded-lg bg-gray-100 cursor-not-allowed"
                />

                <input
                  value={form.email}
                  disabled
                  className="w-full border p-2.5 rounded-lg bg-gray-100 cursor-not-allowed"
                />

                <div className="grid grid-cols-2 gap-4">

                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    className="border p-2.5 rounded-lg"
                    placeholder="Professional Title"
                  />

                  <input
                    name="experience"
                    value={form.experience}
                    onChange={handleChange}
                    className="border p-2.5 rounded-lg"
                    placeholder="Experience"
                  />

                </div>

              </div>

            </div>
          </div>

          {/* BIO */}
          <div className="bg-white shadow-md rounded-2xl p-6 border">

            <h2 className="font-semibold text-lg mb-3">
              Professional Bio
            </h2>

            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={5}
              className="w-full border p-3 rounded-xl"
              placeholder="Write about your experience..."
            />

          </div>

          {/* SPECIALTIES */}
          <div className="bg-white shadow-md rounded-2xl p-6 border">

            <h2 className="font-semibold text-lg mb-4">
              Clinical Specialties
            </h2>

            <div className="flex gap-2 mb-4">

              <input
                value={newSpecialty}
                onChange={(e) => {
                  setNewSpecialty(e.target.value);
                  setIsDirty(true);
                }}
                className="flex-1 border p-2.5 rounded-lg"
                placeholder="Add specialty"
              />

              <button
                onClick={addSpecialty}
                className="bg-violet-600 text-white px-4 rounded-lg flex items-center gap-1"
              >
                <Plus size={16} /> Add
              </button>

            </div>

            <div className="flex flex-wrap gap-2">
              {specialties.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-violet-50 text-violet-700 px-3 py-1 rounded-full"
                >
                  <span className="text-sm">{item}</span>
                  <button onClick={() => removeSpecialty(index)}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

          </div>

        </div>

        {/* RIGHT */}
        <div className="bg-white shadow-md rounded-2xl p-5 border space-y-4">

          <h3 className="font-semibold text-lg">Contact Info</h3>

          <div className="flex gap-3 p-3 border rounded-xl">
            <Phone className="text-violet-600" />
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full outline-none"
              placeholder="Phone"
            />
          </div>

          <div className="flex gap-3 p-3 border rounded-xl">
            <MapPin className="text-violet-600" />
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              className="w-full outline-none"
              placeholder="Address"
            />
          </div>

          {/* MAP */}
          <div className="rounded-xl overflow-hidden border">
            <iframe
              title="clinic-map"
              src={`https://www.google.com/maps?q=${form.address}&output=embed`}
              className="w-full h-48"
              loading="lazy"
            />
          </div>

        </div>

      </div>

      {/* 🔥 BOTTOM UNSAVED POPUP */}
      {isDirty && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white shadow-xl border px-5 py-3 rounded-xl flex items-center gap-4">

          <span className="text-sm text-gray-700">
            You have unsaved changes
          </span>

          <button
            onClick={handleCancel}
            className="px-3 py-1 border rounded-lg text-gray-600"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="bg-violet-600 text-white px-4 py-1 rounded-lg flex items-center gap-1"
          >
            <Save size={16} />
            Save
          </button>

        </div>
      )}

    </div>
  );
};

export default DoctorProfileEditor;