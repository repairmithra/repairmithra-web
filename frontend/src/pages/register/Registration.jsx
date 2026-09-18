import React, { useState } from "react";
import "./Registration.css";

function Registration() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    const form = e.target;

    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    alert("Registration submitted successfully!");
  };

  const sendVerificationCode = () => {
    alert("Verification code sent to your email!");
  };

  return (
    <div className="registration-page">

      <div className="registration-container">

        {/* ================= LEFT SIDE ================= */}

        <div className="registration-left">

          {/* Logo */}
          <img
            src="/repairmithra-logo.png"
            alt="RepairMithra Logo"
            className="repair-logo"
          />

          <div className="left-content">

            <h1>
              Your Trusted Home
              <br />
              Repair Partner
            </h1>

            <p>
              Connect with skilled professionals
              <br />
              for reliable and quality home
              <br />
              repair services.
            </p>

            {/* Features */}
            <div className="features">

              <div className="feature">
                <div className="feature-icon">
                  ✓
                </div>

                <span>
                  Trusted
                  <br />
                  Professionals
                </span>
              </div>

              <div className="feature">
                <div className="feature-icon">
                  ★
                </div>

                <span>
                  Quality
                  <br />
                  Services
                </span>
              </div>

              <div className="feature">
                <div className="feature-icon">
                  ✓
                </div>

                <span>
                  Easy
                  <br />
                  Booking
                </span>
              </div>

            </div>

          </div>
        </div>

        {/* ================= RIGHT SIDE ================= */}

        <div className="registration-right">

          <h2>Create Account</h2>

          <p className="subtitle">
            Join RepairMithra and get started today
          </p>

          <form onSubmit={handleSubmit}>

            {/* ================= FULL NAME ================= */}

            <div className="form-group">

              <div className="input-box">

                <span className="input-icon">
                  ♙
                </span>

                <input
                  type="text"
                  name="fullName"
                  placeholder="Full Name *"
                  required
                />

              </div>

            </div>

            {/* ================= EMAIL ================= */}

            <div className="form-group">

              <div className="input-box">

                <span className="input-icon">
                  ✉
                </span>

                <input
                  type="email"
                  name="email"
                  placeholder="Email Address *"
                  required
                />

              </div>

            </div>

            {/* ================= EMAIL VERIFICATION ================= */}

            <div className="form-group">

              <div className="input-box verification-box">

                <span className="input-icon">
                  ✓
                </span>

                <input
                  type="text"
                  name="verificationCode"
                  placeholder="Email Verification Code *"
                  maxLength="6"
                  required
                />

                <button
                  type="button"
                  className="verify-button"
                  onClick={sendVerificationCode}
                >
                  Send Code
                </button>

              </div>

            </div>

            {/* ================= PHONE NUMBER ================= */}

            <div className="form-group">

              <div className="input-box phone-box">

                <span className="input-icon">
                  ☎
                </span>

                <span className="country-code">
                  +91
                </span>

                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number *"
                  maxLength="10"
                  pattern="[0-9]{10}"
                  required
                />

              </div>

            </div>

            {/* ================= ADDRESS ================= */}

            <div className="form-group">

              <div className="input-box">

                <span className="input-icon">
                  ⌂
                </span>

                <input
                  type="text"
                  name="address"
                  placeholder="Address *"
                  required
                />

              </div>

            </div>

            {/* ================= PINCODE ================= */}

            <div className="form-group">

              <div className="input-box">

                <span className="input-icon">
                  ⌖
                </span>

                <input
                  type="text"
                  name="pincode"
                  placeholder="Pincode *"
                  maxLength="6"
                  pattern="[0-9]{6}"
                  required
                />

              </div>

            </div>

            {/* ================= PASSWORD ================= */}

            <div className="form-group">

              <div className="input-box">

                <span className="input-icon">
                  ▣
                </span>

                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password *"
                  minLength="8"
                  required
                />

                <button
                  type="button"
                  className="password-button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword ? "◉" : "◌"}
                </button>

              </div>

            </div>

            {/* ================= CONFIRM PASSWORD ================= */}

            <div className="form-group">

              <div className="input-box">

                <span className="input-icon">
                  ▣
                </span>

                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  name="confirmPassword"
                  placeholder="Confirm Password *"
                  minLength="8"
                  required
                />

                <button
                  type="button"
                  className="password-button"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                >
                  {showConfirmPassword ? "◉" : "◌"}
                </button>

              </div>

            </div>

            {/* ================= CREATE ACCOUNT ================= */}

            <button
              type="submit"
              className="create-account-button"
            >
              <span>Create Account</span>
              <span className="arrow">
                →
              </span>
            </button>

          </form>

          {/* ================= LOGIN ================= */}

          <div className="login-section">

            <div className="line"></div>

            <p>
              Already have an account?
              <a href="/login">
                {" "}Login
              </a>
            </p>

            <div className="line"></div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Registration;