import {
  CreateBooking,
  UpdateCouponUsage,
  GetBankAccounts,
} from "@/booking/booking";
import type { BankAccountType, BookingType } from "@/utils/bookingType";
// import type { BankAccountType } from "@/utils/bankAccountType";
import { supabase } from "@/utils/supabase";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, Snackbar } from "@mui/material";
import { Copy, Check, ChevronLeft, ChevronRight } from "lucide-react";

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingDetails = location.state?.bookingDetails;
  const [amountToPay, setAmountToPay] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    utrNumber: "",
    paymentScreenshot: null as File | null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for bank accounts
  const [bankAccounts, setBankAccounts] = useState<BankAccountType[]>([]);
  const [currentAccountIndex, setCurrentAccountIndex] = useState(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  // const sliderRef = useRef<HTMLDivElement>(null);

  // New state for payment option
  const [paymentOption, setPaymentOption] = useState<"full" | "partial">(
    "full"
  );

  // Alert state
  const [alert, setAlert] = useState({
    open: false,
    message: "",
    severity: "info" as "success" | "error" | "warning" | "info",
  });

  // Fetch bank accounts on component mount
  useEffect(() => {
    const fetchBankAccounts = async () => {
      const accounts = await GetBankAccounts();
      setBankAccounts(accounts);
    };

    fetchBankAccounts();
  }, []);

  // Calculate amounts
  const fullAmount = bookingDetails?.amount || 0;
  const partialAmount = Math.round(fullAmount * 0.5);
  useEffect(() => {
    const amountPay = paymentOption === "full" ? fullAmount : partialAmount;
    setAmountToPay(amountPay);
  }, [fullAmount, partialAmount, paymentOption]);

  // Redirect if no booking details
  useEffect(() => {
    if (!bookingDetails) {
      navigate("/");
    }
  }, [bookingDetails, navigate]);

  // Handle closing alert
  const handleAlertClose = () => {
    setAlert((prev) => ({ ...prev, open: false }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;

    if (name === "paymentScreenshot" && files && files.length > 0) {
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

  // Function to copy text to clipboard
  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedField(null);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Slider navigation functions
  const nextAccount = () => {
    setCurrentAccountIndex((prev) =>
      prev === bankAccounts.length - 1 ? 0 : prev + 1
    );
  };

  const prevAccount = () => {
    setCurrentAccountIndex((prev) =>
      prev === 0 ? bankAccounts.length - 1 : prev - 1
    );
  };

  const goToAccount = (index: number) => {
    setCurrentAccountIndex(index);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);

      try {
        // Upload payment screenshot
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("images")
          .upload(
            `uploads/${Date.now()}-${formData.paymentScreenshot?.name}`,
            formData.paymentScreenshot as File
          );

        if (uploadError) {
          console.error(uploadError);
          setAlert({
            open: true,
            message: "Failed to upload payment screenshot. Please try again.",
            severity: "error",
          });
          setIsSubmitting(false);
          return;
        }

        const publicUrl = supabase.storage
          .from("images")
          .getPublicUrl(uploadData?.path || "").data.publicUrl;

        const bookingData: BookingType = {
          created_at: new Date().toISOString(),
          Name: formData.name,
          Phone: formData.phone,
          SlotDate: bookingDetails.date,
          StartTime: bookingDetails.startTime,
          EndTime: bookingDetails.endTime,
          UTR: formData.utrNumber,
          PaymentImage: publicUrl,
          Amount: amountToPay,
          CouponCode: bookingDetails.coupon || "",
          PaymentType:
            paymentOption === "full" ? "Full Payment" : "Partial Payment (50%)",
          BalanceAmount:
            paymentOption === "full" ? 0 : bookingDetails.amount - amountToPay,
          Status: "pending",
        };

        const res = await CreateBooking(bookingData);

        // Check if res is "Booking created successfully" string
        if (res !== "Success") {
          setIsSubmitting(false);
          setAlert({
            open: true,
            message: res as string,
            severity: "error",
          });
          return;
        }

        // Update coupon usage if coupon exists
        if (bookingDetails.coupon) {
          await UpdateCouponUsage(bookingDetails.coupon);
        }

        // Prepare data for success page
        const successData = {
          bookingId: new Date().getTime().toString(),
          bookingDetails: bookingData,
          originalAmount: bookingDetails.amount,
          contactPerson: {
            name: "Thotakura Rahul Yadav",
            phone1: "9618614860",
            phone2: "8125770099",
          },
          venueAddress:
            "Reddy's Colony, Road No-3, Boduppal, Hyderabad, Telangana",
          coordinates: "17.4933° N, 78.4974° E",
        };

        // Show success alert
        setAlert({
          open: true,
          message: "Booking submitted successfully! Redirecting...",
          severity: "success",
        });

        // Navigate to success page after a short delay
        setTimeout(() => {
          navigate("/success", {
            state: {
              booking: successData,
              fromPayment: true,
            },
          });
        }, 1500);
      } catch (error) {
        console.error("Error during booking:", error);
        setAlert({
          open: true,
          message: "An unexpected error occurred. Please try again.",
          severity: "error",
        });
        setIsSubmitting(false);
      }
    } else {
      // Show validation error alert
      setAlert({
        open: true,
        message: "Please fill in all required fields correctly.",
        severity: "warning",
      });
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

  const currentAccount = bankAccounts[currentAccountIndex];

  return (
    <>
      {/* Snackbar for Alerts */}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleAlertClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleAlertClose}
          severity={alert.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {alert.message}
        </Alert>
      </Snackbar>

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
                    {bookingDetails.timeSlots.map(
                      (slot: any, index: number) => (
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
                      )
                    )}
                  </div>
                </div>

                {/* Payment Options */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-700 mb-3 text-sm">
                    PAYMENT OPTIONS
                  </h3>
                  <div className="space-y-3">
                    <div
                      className={`p-3 border-2 rounded-xl cursor-pointer transition-all ${
                        paymentOption === "full"
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setPaymentOption("full")}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-800">
                            Pay Full Amount
                          </div>
                          <div className="text-xs text-gray-600">
                            Pay 100% now and confirm booking
                          </div>
                        </div>
                        <div className="font-bold text-green-700">
                          ₹{fullAmount}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`p-3 border-2 rounded-xl cursor-pointer transition-all ${
                        paymentOption === "partial"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setPaymentOption("partial")}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-800">
                            Pay Partial Amount
                          </div>
                          <div className="text-xs text-gray-600">
                            Pay 50% now, rest at venue
                          </div>
                        </div>
                        <div className="font-bold text-blue-700">
                          ₹{partialAmount}
                        </div>
                      </div>
                    </div>
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
                      <div className="text-sm opacity-90">
                        AMOUNT TO PAY NOW
                      </div>
                      <div className="text-xl font-bold">₹{amountToPay}</div>
                      {paymentOption === "partial" && (
                        <div className="text-xs opacity-80 mt-1">
                          Remaining: ₹{fullAmount - partialAmount} at venue
                        </div>
                      )}
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
                      maxLength={10}
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bank Account Slider */}
                {bankAccounts.length > 0 && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-5 rounded-xl border-2 border-blue-200">
                    <h3 className="font-semibold text-gray-700 mb-4 text-center">
                      Choose Your Payment Method
                    </h3>

                    {/* Slider Header with Dots */}
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-800">
                        Payment Account {currentAccountIndex + 1} of{" "}
                        {bankAccounts.length}
                      </h4>

                      {/* Dots Indicator */}
                      <div className="flex space-x-2">
                        {bankAccounts.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => goToAccount(index)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              currentAccountIndex === index
                                ? "bg-blue-600"
                                : "bg-gray-300"
                            }`}
                            aria-label={`Go to account ${index + 1}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Slider Container */}
                    <div className="relative">
                      {/* Navigation Arrows */}
                      {bankAccounts.length > 1 && (
                        <>
                          <button
                            onClick={prevAccount}
                            className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors"
                            aria-label="Previous account"
                          >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                          </button>
                          <button
                            onClick={nextAccount}
                            className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors"
                            aria-label="Next account"
                          >
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                          </button>
                        </>
                      )}

                      {/* Account Details Card */}
                      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        {/* QR Code Scanner Image */}
                        {currentAccount.Scanner && (
                          <div className="mb-6">
                            <div className="text-center font-medium text-gray-700 mb-3">
                              Method 1: Scan QR Code
                            </div>
                            <div className="flex justify-center">
                              <div className="relative">
                                <img
                                  src={currentAccount.Scanner}
                                  alt="Payment QR Code"
                                  className="w-56 h-56 border-4 border-white shadow-lg rounded-lg object-contain"
                                />
                                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
                                  QR Code
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Account Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          {/* UPI Phone Number */}
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-xs text-blue-600 mb-1">
                                  Method 2: UPI Phone Number
                                </div>
                                <div className="font-semibold text-gray-800">
                                  {currentAccount.Phone.trim()}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  copyToClipboard(
                                    currentAccount.Phone.trim(),
                                    "phone"
                                  )
                                }
                                className="ml-2 p-1 hover:bg-blue-100 rounded"
                              >
                                {copiedField === "phone" ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Copy className="w-4 h-4 text-blue-500" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* UPI ID */}
                          <div className="bg-purple-50 p-3 rounded-lg md:col-span-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-xs text-purple-600 mb-1">
                                  Method 3: UPI ID
                                </div>
                                <div className="font-semibold text-gray-800">
                                  {currentAccount.Upi.trim()}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  copyToClipboard(
                                    currentAccount.Upi.trim(),
                                    "upi"
                                  )
                                }
                                className="ml-2 p-1 hover:bg-purple-100 rounded"
                              >
                                {copiedField === "upi" ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Copy className="w-4 h-4 text-purple-500" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Amount Display */}
                        <div className="text-center bg-gradient-to-r from-blue-100 to-indigo-100 py-3 rounded-lg border border-blue-200">
                          <div className="text-lg font-bold text-blue-700 mb-1">
                            ₹{amountToPay}
                          </div>
                          <div className="text-xs text-gray-600">
                            Transfer this exact amount
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Verification Details */}
                <div className="space-y-6">
                  {/* UTR Number */}
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">
                      Payment UTR Number *
                    </label>
                    <input
                      type="text"
                      name="utrNumber"
                      value={formData.utrNumber}
                      onChange={handleInputChange}
                      className={`w-full p-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.utrNumber ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter 12-digit UTR number from your payment"
                      maxLength={12}
                    />
                    {errors.utrNumber && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.utrNumber}
                      </p>
                    )}
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      UTR number is 12 digits and found in your payment receipt
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
                            : "Click to upload payment screenshot"}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Upload screenshot of successful payment with UTR
                          visible
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

                {/* Important Notes */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
                    <span className="mr-2">⚠️</span>
                    Important Notes
                  </h4>
                  <ul className="text-xs text-yellow-700 space-y-1">
                    <li>
                      • Booking will be confirmed only after payment
                      verification
                    </li>
                    <li>
                      •{" "}
                      {paymentOption === "full"
                        ? `Full payment of ₹${fullAmount} is required for confirmation`
                        : `Partial payment of ₹${partialAmount} is required, remaining ₹${
                            fullAmount - partialAmount
                          } to be paid at venue`}
                    </li>
                    <li>• Use any of the 3 payment methods shown above</li>
                    <li>• Transfer the exact amount shown</li>
                    <li>
                      • Keep your UTR number and screenshot ready before
                      submitting
                    </li>
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
                    ← Back
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
                      `Submit Payment`
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
