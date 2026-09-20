import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
} from "react-icons/fi";

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("rm_token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/auth/profile",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load profile"
          );
        }

        setUser(data.data);
      } catch (error) {
        console.error("Profile error:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600 text-lg">
          Loading profile...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            {error}
          </p>

          <button
            onClick={() => navigate("/login")}
            className="rounded-xl bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="mx-auto max-w-2xl">

        {/* Profile Card */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-lg border border-gray-100">

          {/* Profile Header */}
          <div className="bg-blue-600 px-6 py-8 text-white">
            <div className="flex items-center gap-4">

              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-blue-600">
                <FiUser size={30} />
              </div>

              <div>
                <h1 className="text-2xl font-bold">
                  {user.fullName}
                </h1>

                <p className="text-blue-100">
                  RepairMithra Customer
                </p>
              </div>

            </div>
          </div>

          {/* Details */}
          <div className="space-y-6 p-6">

            {/* Email */}
            <div className="flex items-start gap-4">
              <FiMail
                size={22}
                className="mt-1 text-blue-600"
              />

              <div>
                <p className="text-sm text-gray-500">
                  Email
                </p>

                <p className="font-medium text-gray-900">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-4">
              <FiPhone
                size={22}
                className="mt-1 text-blue-600"
              />

              <div>
                <p className="text-sm text-gray-500">
                  Phone
                </p>

                <p className="font-medium text-gray-900">
                  {user.phone}
                </p>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-4">
              <FiMapPin
                size={22}
                className="mt-1 text-blue-600"
              />

              <div>
                <p className="text-sm text-gray-500">
                  Address
                </p>

                <p className="font-medium text-gray-900">
                  {user.address}
                </p>
              </div>
            </div>

            {/* Pincode */}
            <div className="flex items-start gap-4">
              <FiMapPin
                size={22}
                className="mt-1 text-blue-600"
              />

              <div>
                <p className="text-sm text-gray-500">
                  Pincode
                </p>

                <p className="font-medium text-gray-900">
                  {user.pincode}
                </p>
              </div>
            </div>

            {/* Account Type */}
            <div className="border-t pt-5">
              <p className="text-sm text-gray-500">
                Account Type
              </p>

              <p className="font-medium capitalize text-gray-900">
                {user.role}
              </p>
            </div>

          </div>
        </div>

        {/* Back Home */}
        <button
          onClick={() => navigate("/")}
          className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-white font-semibold transition hover:bg-blue-700"
        >
          Back to Home
        </button>

      </div>
    </div>
  );
}

export default Profile;