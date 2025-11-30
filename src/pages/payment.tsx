import { CreateBooking } from "@/booking/booking";
import type { BookingType } from "@/utils/bookingType";
import { supabase } from "@/utils/supabase";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingDetails = location.state?.bookingDetails;

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    utrNumber: "",
    paymentScreenshot: null,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if no booking details
  useEffect(() => {
    if (!bookingDetails) {
      navigate("/");
    }
  }, [bookingDetails, navigate]);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "paymentScreenshot") {
      setFormData((prev) => ({
        ...prev,
        [name]: files[0],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {
      name: "",
      phone: "",
      utrNumber: "",
      paymentScreenshot: "",
    };

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = "Phone number must be 10 digits";
    }

    // UTR validation
    if (!formData.utrNumber.trim()) {
      newErrors.utrNumber = "UTR number is required";
    } else if (!/^\d{12}$/.test(formData.utrNumber)) {
      newErrors.utrNumber = "UTR number must be exactly 12 digits";
    }

    // Payment screenshot validation
    if (!formData.paymentScreenshot) {
      newErrors.paymentScreenshot = "Payment screenshot is required";
    }

    setErrors(newErrors);

    return Object.values(newErrors).every((error) => error === "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(validateForm());
    if (validateForm()) {
      setIsSubmitting(true);
      // Simulate API call
      const file = formData.paymentScreenshot;

      console.log(file);
      const ext = file?.name?.split(".").pop();

      const safeName = file?.name
        .toLowerCase()
        .replace(/\s+/g, "-") // replace spaces
        .replace(/[^a-z0-9.-]/g, ""); // remove special characters

      const filePath = `uploads/${Date.now()}-${safeName}`;
      const { data, error } = await supabase.storage
        .from("images")
        .upload(
          `uploads/${Date.now()}-${formData?.paymentScreenshot?.name}`,
          formData.paymentScreenshot
        );

      if (error) {
        console.error(error);
      }

      const publicUrl = supabase.storage
        .from("images")
        .getPublicUrl(data?.path || "").data.publicUrl;

      const bookingData: BookingType = {
        created_at: new Date().toISOString(),
        Name: formData.name,
        Phone: formData.phone,
        SlotDate: bookingDetails.date,
        StartTime: bookingDetails.startTime,
        EndTime: bookingDetails.endTime,
        UTR: formData.utrNumber,
        PaymentImage: publicUrl,
        Amount: bookingDetails.amount,
        Status: "Pending",
      };
      const res = await CreateBooking(bookingData);

      if (res === "Something went wrong") {
        setIsSubmitting(false);
        alert(res);
        return;
      }

      setTimeout(() => {
        setIsSubmitting(false);
        alert(res);
        navigate("/");
      }, 2000);
    }
  };

  if (!bookingDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">
            No Booking Details Found
          </h2>
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back to Booking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-blue-800 mb-4">
            Complete Your Booking
          </h1>
          <p className="text-gray-600">
            Final step to confirm your cricket box booking
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Booking Summary - Reduced width */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-lg p-6 h-fit">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-3 flex items-center">
              <span className="bg-blue-100 p-2 rounded-lg mr-3">📋</span>
              Booking Summary
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-xs text-blue-600 font-semibold">
                    DATE
                  </div>
                  <div className="text-sm font-bold text-gray-800">
                    {bookingDetails.date}
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-xs text-green-600 font-semibold">
                    DURATION
                  </div>
                  <div className="text-sm font-bold text-gray-800">
                    {bookingDetails.startTime} - {bookingDetails.endTime}
                  </div>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-700 mb-3 text-sm">
                  COST BREAKDOWN
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {bookingDetails.timeSlots.map((slot, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded"
                    >
                      <div>
                        <div className="font-medium text-gray-700">
                          {slot.period}
                        </div>
                        <div className="text-gray-500">
                          {slot.hours} hrs × ₹{slot.rate}/hr
                        </div>
                      </div>
                      <div className="font-bold text-blue-700">
                        ₹{slot.amount}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {bookingDetails.coupon && (
                <div className="flex justify-between items-center bg-yellow-50 p-3 rounded-lg">
                  <div>
                    <div className="text-xs text-yellow-600 font-semibold">
                      COUPON APPLIED
                    </div>
                    <div className="text-sm font-bold text-gray-800">
                      {bookingDetails.coupon}
                    </div>
                  </div>
                  <div className="text-green-600 font-bold">-₹0</div>
                </div>
              )}

              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-xl text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm opacity-90">TOTAL AMOUNT</div>
                    <div className="text-xl font-bold">
                      ₹{bookingDetails.amount}
                    </div>
                  </div>
                  <div className="text-2xl">💰</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Payment Form - Increased width */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-3 flex items-center">
              <span className="bg-green-100 p-2 rounded-lg mr-3">💳</span>
              Payment Details
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Details - Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name Field */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full p-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter your full name"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Phone Field */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full p-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.phone ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="10-digit phone number"
                    maxLength="10"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>

              {/* QR Code and Payment Details - Side by Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* QR Code Section */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-5 rounded-xl border-2 border-dashed border-blue-200">
                  <h3 className="font-semibold text-gray-700 mb-4 text-center">
                    Scan to Pay with PhonePe
                  </h3>
                  <div className="flex justify-center mb-4">
                    <img
                      src="/scanner.png"
                      alt="PhonePe QR Code"
                      className="w-48 h-48 border-2 border-white shadow-lg rounded-lg"
                    />
                  </div>
                  <div className="text-center bg-white py-2 rounded-lg border">
                    <span className="text-lg font-bold text-blue-700">
                      ₹{bookingDetails.amount}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 text-center mt-3">
                    Scan this QR code with PhonePe app to make payment
                  </p>
                </div>

                {/* Payment Verification Details */}
                <div className="space-y-6">
                  {/* UTR Number */}
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">
                      UTR Number *
                    </label>
                    <input
                      type="text"
                      name="utrNumber"
                      value={formData.utrNumber}
                      onChange={handleInputChange}
                      className={`w-full p-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.utrNumber ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter 12-digit UTR number"
                      maxLength="12"
                    />
                    {errors.utrNumber && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.utrNumber}
                      </p>
                    )}
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      UTR number is 12 digits and found in payment receipt
                    </div>
                  </div>

                  {/* Payment Screenshot */}
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">
                      Payment Screenshot *
                    </label>
                    <div
                      className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${
                        errors.paymentScreenshot
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                      }`}
                    >
                      <input
                        type="file"
                        name="paymentScreenshot"
                        onChange={handleInputChange}
                        accept="image/*"
                        className="hidden"
                        id="paymentScreenshot"
                      />
                      <label
                        htmlFor="paymentScreenshot"
                        className="cursor-pointer"
                      >
                        <div className="text-3xl mb-2">📸</div>
                        <div className="text-sm font-medium text-gray-700">
                          {formData.paymentScreenshot
                            ? formData.paymentScreenshot.name
                            : "Click to upload screenshot"}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Upload screenshot of successful payment
                        </div>
                      </label>
                    </div>
                    {errors.paymentScreenshot && (
                      <p className="text-red-500 text-sm mt-2 text-center">
                        {errors.paymentScreenshot}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Important Notes */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
                  <span className="mr-2">⚠️</span>
                  Important Notes
                </h4>
                <ul className="text-xs text-yellow-700 space-y-1">
                  <li>
                    • Booking will be confirmed only after payment verification
                  </li>
                  <li>
                    • Keep your UTR number and screenshot ready before
                    submitting
                  </li>
                  {/* <li>• You will receive confirmation SMS within 30 minutes</li> */}
                  <li>• For issues, contact: +91-9876543210</li>
                </ul>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition transform hover:scale-105"
                >
                  ← Back to Booking
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 py-4 font-bold rounded-xl transition transform shadow-lg ${
                    isSubmitting
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 hover:scale-105 text-white"
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    `Submit`
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
