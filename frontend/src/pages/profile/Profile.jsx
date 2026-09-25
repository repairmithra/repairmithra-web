import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCreditCard, FiStar, FiBell, FiMessageSquare } from "react-icons/fi";

import { apiFetch, isAuthError } from "../../utils/api";
import { getToken, setSession } from "../../utils/auth";

import ProfileSidebar from "./components/ProfileSidebar";
import OverviewTab from "./components/OverviewTab";
import BookingsTab from "./components/BookingsTab";
import SupportTab from "./components/SupportTab";
import PlaceholderTab from "./components/PlaceholderTab";
import EditProfileModal from "./components/EditProfileModal";
import AddAddressModal from "./components/AddAddressModal";

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [addAddressOpen, setAddAddressOpen] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      navigate("/login", { replace: true, state: { from: "/profile" } });
      return;
    }

    const controller = new AbortController();

    const load = async () => {
      try {
        const [profileRes, bookingsRes] = await Promise.all([
          apiFetch("/api/auth/profile", { auth: true, signal: controller.signal }),
          apiFetch("/api/bookings", { auth: true, signal: controller.signal }),
        ]);

        setUser(profileRes.data);
        setBookings(bookingsRes.bookings || []);
      } catch (err) {
        if (err?.name === "AbortError") return;

        if (isAuthError(err)) {
          navigate("/login", { replace: true, state: { from: "/profile" } });
          return;
        }

        console.error("Profile error:", err);
        setError(err.message || "Failed to load profile");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    load();

    return () => controller.abort();
  }, [navigate]);

  const handleSaved = (updatedUser) => {
    setUser(updatedUser);
    setEditOpen(false);

    // Keep the locally cached session user (used elsewhere in the app) fresh
    const token = getToken();
    if (token) setSession(token, updatedUser);
  };

  const handleAddressAdded = (updatedUser) => {
    setUser(updatedUser);
    setAddAddressOpen(false);

    const token = getToken();
    if (token) setSession(token, updatedUser);
  };

  const handleDeleteAddress = async (addressId) => {
    const previous = user;

    // Optimistic update — feels instant, rolled back below on failure
    setUser((prev) => ({
      ...prev,
      addresses: (prev.addresses || []).filter((a) => a._id !== addressId),
    }));

    try {
      const data = await apiFetch(`/api/auth/addresses/${addressId}`, {
        method: "DELETE",
        auth: true,
      });

      setUser(data.data);
      const token = getToken();
      if (token) setSession(token, data.data);
    } catch (err) {
      console.error("Delete address error:", err);
      setUser(previous);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-600">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="mb-4 text-red-600">{error}</p>
          <button
            onClick={() => navigate("/login")}
            className="rounded-xl bg-sky-600 px-6 py-3 font-semibold text-white hover:bg-sky-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row">
        <ProfileSidebar active={activeTab} onSelect={setActiveTab} messagesCount={0} />

        <main className="min-w-0 flex-1">
          {activeTab === "overview" && (
            <OverviewTab
              user={user}
              bookings={bookings}
              onEdit={() => setEditOpen(true)}
              onGoToTab={setActiveTab}
              onAddAddress={() => setAddAddressOpen(true)}
              onDeleteAddress={handleDeleteAddress}
            />
          )}

          {activeTab === "bookings" && <BookingsTab bookings={bookings} />}

          {activeTab === "wallet" && (
            <PlaceholderTab
              icon={FiCreditCard}
              title="Your wallet is empty"
              description="Wallet & payments is coming soon. You'll be able to track refunds, credits and saved payment methods here."
              actionLabel="Book a Service"
              onAction={() => navigate("/services")}
            />
          )}

          {activeTab === "reviews" && (
            <PlaceholderTab
              icon={FiStar}
              title="No reviews yet"
              description="Once a technician completes a job for you, you'll be able to rate the service and leave feedback here."
              actionLabel={bookings.length ? "View My Bookings" : "Book a Service"}
              onAction={() => (bookings.length ? setActiveTab("bookings") : navigate("/services"))}
            />
          )}

          {activeTab === "support" && <SupportTab />}

          {activeTab === "messages" && (
            <PlaceholderTab
              icon={FiMessageSquare}
              title="No messages yet"
              description="Conversations with your technician or our support team will show up here once you have an active booking."
              actionLabel="Book a Service"
              onAction={() => navigate("/services")}
            />
          )}

          {activeTab === "notifications" && (
            <PlaceholderTab
              icon={FiBell}
              title="You're all caught up"
              description="You have no notifications right now. Updates about your bookings and technicians will appear here."
            />
          )}
        </main>
      </div>

      {editOpen && (
        <EditProfileModal
          user={user}
          onClose={() => setEditOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {addAddressOpen && (
        <AddAddressModal
          onClose={() => setAddAddressOpen(false)}
          onSaved={handleAddressAdded}
        />
      )}
    </div>
  );
}

export default Profile;