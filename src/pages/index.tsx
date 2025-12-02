import { ApplyCoupon, GetBookings } from "@/booking/booking";
import type { BookingType } from "@/utils/bookingType";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Phone,
  MapPin,
  User,
  Calendar,
  Clock,
  Tag,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { Button } from "@mui/material";

export default function MainPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingType[]>([]);
  const startDropdownRef = useRef<HTMLDivElement>(null);
  const endDropdownRef = useRef<HTMLDivElement>(null);
  const [alert, setAlert] = useState({
    open: false,
    message: "",
    severity: "info" as "success" | "error" | "warning" | "info",
  });

  useEffect(() => {
    const fetchBookings = async () => {
      const response = await GetBookings();
      setBookings(response);
    };
    fetchBookings();
  }, []);

  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [amount, setAmount] = useState(0);
  const [coupon, setCoupon] = useState("");
  const [timeSlots, setTimeSlots] = useState([]);
  const [errors, setErrors] = useState({
    date: "",
    startTime: "",
    endTime: "",
  });
  const [showStartDropdown, setShowStartDropdown] = useState(false);
  const [showEndDropdown, setShowEndDropdown] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        startDropdownRef.current &&
        !startDropdownRef.current.contains(event.target as Node)
      ) {
        setShowStartDropdown(false);
      }
      if (
        endDropdownRef.current &&
        !endDropdownRef.current.contains(event.target as Node)
      ) {
        setShowEndDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Generate time options with only 00 and 30 minutes
  const generateTimeOptions = () => {
    const options = [];

    // Generate times from 0:00 to 23:30
    for (let hour = 0; hour < 24; hour++) {
      // Add :00 option
      options.push(`${hour.toString().padStart(2, "0")}:00`);
      // Add :30 option
      options.push(`${hour.toString().padStart(2, "0")}:30`);
    }

    return options;
  };

  // Check if selected date is today
  const isToday = (dateString: string) => {
    const today = new Date().toISOString().split("T")[0];
    return dateString === today;
  };

  // Check if selected date is tomorrow
  // const isTomorrow = (dateString: string) => {
  //   const tomorrow = new Date();
  //   tomorrow.setDate(tomorrow.getDate() + 1);
  //   const tomorrowString = tomorrow.toISOString().split('T')[0];
  //   return dateString === tomorrowString;
  // };

  // Convert time to minutes for comparison
  const timeToMinutes = (time: string) => {
    if (!time) return 0;
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  // Compare times considering overnight bookings
  const isTimeGreater = (start: string, end: string) => {
    if (!start || !end) return false;

    const startMinutes = timeToMinutes(start);
    const endMinutes = timeToMinutes(end);

    // If end is midnight (00:00), treat it as 24:00 (end of day)
    const adjustedEndMinutes = end === "00:00" ? 24 * 60 : endMinutes;

    return adjustedEndMinutes > startMinutes;
  };

  // Default date = today
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setDate(today);
    validateDate(today);
  }, []);

  // Function to check if a date is weekend
  const isWeekend = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    return day === 0 || day === 5 || day === 6; // Sunday, Friday, Saturday
  };

  // Get price based on time and day type
  const getPriceForTime = (time: string, dateString: string) => {
    const hour = parseInt(time.split(":")[0]);
    const isWeekendDay = isWeekend(dateString);

    if (isWeekendDay) {
      // Weekend pricing (Fri, Sat, Sun)
      if (hour >= 6 && hour < 12) {
        return 700; // 6 AM to 12 PM
      } else if (hour >= 12 && hour < 18) {
        return 600; // 12 PM to 6 PM
      } else {
        return 900; // 6 PM to 6 AM
      }
    } else {
      // Weekday pricing (Mon, Tue, Wed, Thu)
      if (hour >= 6 && hour < 12) {
        return 600; // 6 AM to 12 PM
      } else if (hour >= 12 && hour < 18) {
        return 500; // 12 PM to 6 PM
      } else {
        return 700; // 6 PM to 6 AM
      }
    }
  };

  // Validate if selected date/time is not in the past
  const validateDate = (selectedDate: string) => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    // const selected = new Date(selectedDate);

    // Reset errors
    setErrors((prev) => ({ ...prev, date: "" }));

    if (selectedDate < today) {
      setErrors((prev) => ({ ...prev, date: "Cannot select past dates" }));
      return false;
    }
    return true;
  };

  // Validate time selection (FIXED for overnight bookings)
  const validateTimes = (start: string, end: string, selectedDate: string) => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentTime = now.toTimeString().slice(0, 5);

    let isValid = true;
    const newErrors = { startTime: "", endTime: "" };

    // Check if date is today
    if (selectedDate === today) {
      // Check if start time is in the past
      if (start && start < currentTime) {
        newErrors.startTime = "Start time cannot be in the past";
        isValid = false;
      }

      // Check if end time is in the past (except for midnight)
      if (end && end !== "00:00" && end < currentTime) {
        newErrors.endTime = "End time cannot be in the past";
        isValid = false;
      }
    }

    // Check if end time is after start time (FIXED for midnight)
    if (start && end && !isTimeGreater(start, end)) {
      newErrors.endTime = "End time must be after start time";
      isValid = false;
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return isValid;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    setDate(selectedDate);
    validateDate(selectedDate);

    // Reset times if date changes to past
    if (selectedDate < new Date().toISOString().split("T")[0]) {
      setStartTime("");
      setEndTime("");
    }

    // If date changed and it's today, revalidate times
    const today = new Date().toISOString().split("T")[0];
    if (selectedDate === today && (startTime || endTime)) {
      validateTimes(startTime, endTime, selectedDate);
    }
  };

  const handleStartTimeSelect = (time: string) => {
    setStartTime(time);
    setShowStartDropdown(false);
    validateTimes(time, endTime, date);
  };

  const handleEndTimeSelect = (time: string) => {
    setEndTime(time);
    setShowEndDropdown(false);
    validateTimes(startTime, time, date);
  };

  // Filter time options for START time
  const getStartTimeOptions = () => {
    const options = generateTimeOptions();
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    // If date is today, filter out past times
    if (isToday(date)) {
      return options.filter((option) => {
        // For today, remove midnight (00:00) from start options
        if (option === "00:00") return false;
        return option >= currentTime;
      });
    }

    // For future dates (tomorrow or later), include all times including midnight
    return options;
  };

  // Filter time options for END time (FIXED for overnight bookings)
  const getEndTimeOptions = () => {
    let options = generateTimeOptions();
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    // Filter out options that are not after start time
    if (startTime) {
      options = options.filter((option) => {
        // Use the fixed comparison function
        return isTimeGreater(startTime, option);
      });
    }

    // If date is today, filter out past times
    if (isToday(date)) {
      options = options.filter((option) => {
        // For today, allow midnight (00:00) in end options
        if (option === "00:00") return true;
        return option > currentTime;
      });
    }

    return options;
  };

  const handleCouponChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCoupon(e.target.value);
  };

  // Calculate amount and time slots breakdown (FIXED for overnight bookings)
  useEffect(() => {
    if (
      startTime &&
      endTime &&
      errors.startTime === "" &&
      errors.endTime === "" &&
      errors.date === ""
    ) {
      const isOverlapping = bookings
        .filter((slot) => slot.SlotDate === date)
        .some((slot) => {
          // Handle overlapping logic for overnight bookings
          const slotStart = slot.StartTime;
          const slotEnd = slot.EndTime;

          // Convert all times to minutes for proper comparison
          const startMinutes = timeToMinutes(startTime);
          const endMinutes = timeToMinutes(endTime);
          const slotStartMinutes = timeToMinutes(slotStart);
          const slotEndMinutes = timeToMinutes(slotEnd);

          // Handle midnight as end of day
          const adjustedEndMinutes = endTime === "00:00" ? 24 * 60 : endMinutes;
          const adjustedSlotEndMinutes =
            slotEnd === "00:00" ? 24 * 60 : slotEndMinutes;

          // Check for overlap
          return (
            startMinutes < adjustedSlotEndMinutes &&
            adjustedEndMinutes > slotStartMinutes
          );
        });

      if (isOverlapping) {
        alert("Selected time overlaps with existing bookings");
        setAmount(0);
        setTimeSlots([]);
        return;
      }

      const startDateTime = new Date(`2000-01-01T${startTime}`);
      let endDateTime = new Date(`2000-01-01T${endTime}`);

      // Handle midnight as next day
      if (endTime === "00:00") {
        endDateTime = new Date(`2000-01-02T${endTime}`);
      }

      let totalAmount = 0;
      const slots = [];
      let currentSlotStart = new Date(startDateTime);

      // Calculate slots with different pricing
      while (currentSlotStart < endDateTime) {
        const currentHour = currentSlotStart.getHours();
        const currentPrice = getPriceForTime(
          `${currentHour.toString().padStart(2, "0")}:00`,
          date
        );

        // Find when this price period ends
        let currentSlotEnd = new Date(currentSlotStart);

        // Determine period boundaries based on weekend status
        const isWeekendDay = isWeekend(date);
        let nextPeriodHour: number;

        if (isWeekendDay) {
          if (currentHour >= 6 && currentHour < 12) {
            nextPeriodHour = 12; // Morning slot ends at 12 PM
          } else if (currentHour >= 12 && currentHour < 18) {
            nextPeriodHour = 18; // Afternoon slot ends at 6 PM
          } else {
            // Evening slot ends at 6 AM next day
            currentSlotEnd.setDate(currentSlotEnd.getDate() + 1);
            nextPeriodHour = 6;
          }
        } else {
          if (currentHour >= 6 && currentHour < 12) {
            nextPeriodHour = 12; // Morning slot ends at 12 PM
          } else if (currentHour >= 12 && currentHour < 18) {
            nextPeriodHour = 18; // Afternoon slot ends at 6 PM
          } else {
            // Evening slot ends at 6 AM next day
            currentSlotEnd.setDate(currentSlotEnd.getDate() + 1);
            nextPeriodHour = 6;
          }
        }

        if (currentHour < 6 && currentHour >= 0) {
          // Handle overnight hours (12 AM to 6 AM)
          currentSlotEnd.setHours(6, 0, 0, 0);
        } else if (currentSlotEnd.getHours() !== nextPeriodHour) {
          currentSlotEnd.setHours(nextPeriodHour, 0, 0, 0);
        }

        // Adjust slot end to not exceed booking end
        if (currentSlotEnd > endDateTime) {
          currentSlotEnd = new Date(endDateTime);
        }

        const slotHours =
          (currentSlotEnd - currentSlotStart) / (1000 * 60 * 60);
        const slotAmount = slotHours * currentPrice;

        if (slotHours > 0) {
          slots.push({
            period: `${formatTime(currentSlotStart)} - ${formatTime(
              currentSlotEnd
            )}`,
            hours: slotHours.toFixed(2),
            rate: currentPrice,
            amount: Math.round(slotAmount),
          });
          totalAmount += slotAmount;
        }

        currentSlotStart = currentSlotEnd;
      }

      setTimeSlots(slots);
      setAmount(Math.round(totalAmount));
    } else {
      setAmount(0);
      setTimeSlots([]);
    }
  }, [startTime, endTime, date, errors]);

  const formatTime = (date: Date) => {
    return date.toTimeString().slice(0, 5);
  };

  const ApplyCoup = async () => {
    const data = await ApplyCoupon(coupon || "");

    if (data && data?.MaxUses <= data?.Used) {
      setAlert({
        open: true,
        message: "Coupon usage limit exceeded. Proceeding without coupon.",
        severity: "warning",
      });
      return;
    }
    const amt = Math.round(
      data ? amount - amount * (data?.Percentage / 100) : amount
    );
    console.log(amt);
    setAmount(amt);
  };
  const handleBookNow = async () => {
    // Validate all fields before proceeding
    if (!validateDate(date)) {
      setAlert({
        open: true,
        message: "Please select a valid date",
        severity: "warning",
      });
      return;
    }

    if (!startTime || !endTime || amount === 0) {
      setAlert({
        open: true,
        message: "Please select valid start and end times",
        severity: "warning",
      });
      return;
    }

    if (!validateTimes(startTime, endTime, date)) {
      setAlert({
        open: true,
        message: "Please correct the time selections",
        severity: "warning",
      });
      return;
    }

    // Navigate to payment page with booking details
    navigate("/payment", {
      state: {
        bookingDetails: {
          date,
          startTime,
          endTime,
          amount,
          timeSlots,
          coupon,
        },
      },
    });
  };

  // Get current day type for display
  // const getDayType = (dateString: string) => {
  //   return isWeekend(dateString) ? "Weekend" : "Weekday";
  // };

  // Open maps with address
  const openMaps = () => {
    const address = "Reddy's Colony, Road No-3, Boduppal, Hyderabad, Telangana";
    const encodedAddress = encodeURIComponent(address);
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
      "_blank"
    );
  };

  // Format time for display (handle midnight specially)
  const formatTimeDisplay = (time: string) => {
    if (!time) return "Select time";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);

    // Handle midnight (00:00)
    if (hour === 0 && minutes === "00") {
      return "12:00 AM (Midnight)";
    }

    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Get AM/PM indicator
  const getTimePeriod = (time: string) => {
    if (!time) return "";
    const [hours] = time.split(":");
    const hour = parseInt(hours);
    return hour < 12 ? "AM" : "PM";
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* HEADER - Logo on left, Name on right */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            {/* Logo on LEFT - Square format */}
            <div className="flex items-center space-x-3">
              <div className="shadow-md">
                <img
                  src="/ybrlogo.png"
                  alt="YBR 360 Arena Logo"
                  className="h-20 w-20 rounded-lg object-contain"
                />
              </div>
            </div>

            {/* Name/Title on RIGHT */}
            <div className="text-right">
              <h1 className="text-2xl font-bold">YBR 360 Cricket Arena</h1>
              <p className="text-sm opacity-90">Boduppal, Hyderabad</p>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 container mx-auto p-4">
        <div className="max-w-4xl mx-auto">
          {/* PRICING INFORMATION */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Calendar className="mr-2" size={20} />
              Pricing & Booking
            </h2>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Weekday Pricing Card */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4 shadow-md border border-green-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-green-800">Weekdays</h3>
                  <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                    Mon-Thu
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">6AM - 12PM</span>
                    <span className="font-bold text-green-700">₹600/hr</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">12PM - 6PM</span>
                    <span className="font-bold text-blue-700">₹500/hr</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">6PM - 6AM</span>
                    <span className="font-bold text-purple-700">₹700/hr</span>
                  </div>
                </div>
              </div>

              {/* Weekend Pricing Card */}
              <div className="bg-gradient-to-br from-red-50 to-pink-100 rounded-xl p-4 shadow-md border border-red-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-red-800">Weekends</h3>
                  <span className="bg-red-100 text-red-800 text-xs font-semibold px-3 py-1 rounded-full">
                    Fri-Sun
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">6AM - 12PM</span>
                    <span className="font-bold text-green-700">₹700/hr</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">12PM - 6PM</span>
                    <span className="font-bold text-blue-700">₹600/hr</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">6PM - 6AM</span>
                    <span className="font-bold text-purple-700">₹900/hr</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BOOKING FORM */}
          <div className="bg-white rounded-2xl shadow-xl p-5 mb-6">
            {/* Date Picker */}
            <div className="mb-5">
              <label className="block font-semibold text-gray-700 mb-2 flex items-center">
                <Calendar className="mr-2" size={18} />
                Select Date
              </label>
              <input
                type="date"
                className={`w-full p-4 border-2 ${
                  errors.date ? "border-red-500" : "border-gray-200"
                } rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all`}
                value={date}
                onChange={handleDateChange}
                min={new Date().toISOString().split("T")[0]}
              />
              {errors.date && (
                <div className="flex items-center mt-2 text-red-600 text-sm">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.date}
                </div>
              )}
            </div>

            {/* Time Selection */}
            <div className="mb-5">
              <label className="block font-semibold text-gray-700 mb-3 flex items-center">
                <Clock className="mr-2" size={18} />
                Select Time Slot
              </label>
              <div className="grid grid-cols-2 gap-4">
                {/* Start Time Dropdown */}
                <div className="relative" ref={startDropdownRef}>
                  <label className="block text-sm text-gray-600 mb-1">
                    Start Time
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowStartDropdown(!showStartDropdown);
                      setShowEndDropdown(false);
                    }}
                    className={`w-full p-4 border-2 ${
                      errors.startTime ? "border-red-500" : "border-gray-200"
                    } rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all flex justify-between items-center bg-white`}
                  >
                    <span
                      className={`${
                        startTime ? "text-gray-800" : "text-gray-500"
                      }`}
                    >
                      {formatTimeDisplay(startTime)}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-gray-500 transition-transform ${
                        showStartDropdown ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Start Time Dropdown Menu */}
                  {showStartDropdown && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      {getStartTimeOptions().map((time) => (
                        <button
                          key={`start-${time}`}
                          type="button"
                          onClick={() => handleStartTimeSelect(time)}
                          className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors ${
                            startTime === time
                              ? "bg-blue-100 text-blue-700 font-medium"
                              : "text-gray-700"
                          } border-b border-gray-100 last:border-b-0 flex justify-between items-center`}
                        >
                          <div>
                            <span className="font-medium">
                              {formatTimeDisplay(time)}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                              {getTimePeriod(time)}
                            </span>
                          </div>
                          {startTime === time && (
                            <span className="text-blue-600 text-xs font-medium bg-blue-100 px-2 py-1 rounded">
                              ✓
                            </span>
                          )}
                        </button>
                      ))}
                      {/* Midnight Note */}
                      {/* {isToday(date) && (
                        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                          <div className="text-xs text-gray-500">
                            <span className="font-medium">Note:</span> Midnight (12:00 AM) is available only for end time selection today
                          </div>
                        </div>
                      )} */}
                    </div>
                  )}

                  {errors.startTime && (
                    <div className="flex items-center mt-2 text-red-600 text-sm">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.startTime}
                    </div>
                  )}
                </div>

                {/* End Time Dropdown */}
                <div className="relative" ref={endDropdownRef}>
                  <label className="block text-sm text-gray-600 mb-1">
                    End Time
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (startTime) {
                        setShowEndDropdown(!showEndDropdown);
                        setShowStartDropdown(false);
                      }
                    }}
                    disabled={!startTime}
                    className={`w-full p-4 border-2 ${
                      errors.endTime ? "border-red-500" : "border-gray-200"
                    } ${
                      !startTime ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                    } rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all flex justify-between items-center`}
                  >
                    <span
                      className={`${
                        endTime ? "text-gray-800" : "text-gray-500"
                      }`}
                    >
                      {formatTimeDisplay(endTime)}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-gray-500 transition-transform ${
                        showEndDropdown ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* End Time Dropdown Menu */}
                  {showEndDropdown && startTime && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      {getEndTimeOptions().map((time) => (
                        <button
                          key={`end-${time}`}
                          type="button"
                          onClick={() => handleEndTimeSelect(time)}
                          className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors ${
                            endTime === time
                              ? "bg-blue-100 text-blue-700 font-medium"
                              : "text-gray-700"
                          } border-b border-gray-100 last:border-b-0 flex justify-between items-center`}
                        >
                          <div>
                            <span className="font-medium">
                              {formatTimeDisplay(time)}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                              {getTimePeriod(time)}
                            </span>
                          </div>
                          {endTime === time && (
                            <span className="text-blue-600 text-xs font-medium bg-blue-100 px-2 py-1 rounded">
                              ✓
                            </span>
                          )}
                        </button>
                      ))}
                      {/* Midnight Note */}
                      {/* {getEndTimeOptions().includes("00:00") && (
                        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                          <div className="text-xs text-gray-500">
                            <span className="font-medium">Overnight Booking:</span> Midnight (12:00 AM) represents the end of the day
                          </div>
                        </div>
                      )} */}
                    </div>
                  )}

                  {errors.endTime && (
                    <div className="flex items-center mt-2 text-red-600 text-sm">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.endTime}
                    </div>
                  )}
                </div>
              </div>

              {/* Time Validation Summary */}
              {(errors.startTime || errors.endTime) && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle
                      className="mr-2 text-red-600 mt-0.5"
                      size={16}
                    />
                    <div>
                      <h4 className="font-semibold text-red-700 text-sm">
                        Time Selection Rules:
                      </h4>
                      <ul className="text-xs text-red-600 mt-1 space-y-1">
                        <li>• End time must be after start time</li>
                        <li>• Cannot select past times for today's date</li>
                        <li>• Times are available only at 00 and 30 minutes</li>
                        <li>• Minimum booking duration: 30 minutes</li>
                        <li>
                          • Midnight (12:00 AM) is available only in end time
                          for today
                        </li>
                        <li>
                          • Midnight (12:00 AM) represents the end of the day
                        </li>
                        <li>
                          • Overnight bookings (e.g., 10:00 PM to 12:00 AM) are
                          allowed
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Selected Time Display */}
              {startTime &&
                endTime &&
                errors.startTime === "" &&
                errors.endTime === "" && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <Clock className="mr-2 text-green-600" size={16} />
                      <div>
                        <span className="text-green-700 font-medium">
                          Selected: {formatTimeDisplay(startTime)} to{" "}
                          {formatTimeDisplay(endTime)}
                        </span>
                        {/* {endTime === "00:00" && startTime >= "18:00" && (
                        <div className="text-green-600 text-sm mt-1">
                          ✓ Overnight booking confirmed (until midnight)
                        </div>
                      )} */}
                      </div>
                    </div>
                  </div>
                )}
            </div>

            {/* Coupon Input */}
            <div className="mb-6">
              <label className="block font-semibold text-gray-700 mb-2 flex items-center">
                <Tag className="mr-2" size={18} />
                Coupon Code
              </label>
              <div className="flex flex-row gap-3">
                <input
                  type="text"
                  placeholder="Enter coupon code (optional)"
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  value={coupon}
                  onChange={handleCouponChange}
                />
                <Button onClick={ApplyCoup}>Apply</Button>
              </div>
            </div>

            {/* INVOICE SECTION */}
            {startTime &&
              endTime &&
              amount > 0 &&
              errors.startTime === "" &&
              errors.endTime === "" && (
                <div className="mt-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <span className="mr-2">🧾</span>
                    Booking Summary
                  </h3>

                  {/* Day Type Badge */}
                  {/* <div className="mb-4 inline-block">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${isWeekend(date) ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {getDayType(date)} Rates Applied
                  </span>
                </div> */}

                  {/* Time Slots Breakdown */}
                  <div className="space-y-3 mb-4">
                    {timeSlots.map((slot, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100"
                      >
                        <div>
                          <div className="font-medium text-gray-800">
                            {slot.period}
                          </div>
                          <div className="text-xs text-gray-500">
                            {slot.hours} hrs × ₹{slot.rate}/hr
                          </div>
                        </div>
                        <div className="font-bold text-blue-700">
                          ₹{slot.amount}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total Amount */}
                  <div className="flex justify-between items-center pt-4 border-t-2 border-gray-200">
                    <div className="text-lg font-bold text-gray-800">
                      Total Amount
                    </div>
                    <div className="text-2xl font-bold text-blue-700">
                      ₹{amount}
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-gray-500 text-center">
                    • No Cancellation and Refunds • All taxes included • No
                    hidden charges
                  </div>
                </div>
              )}

            {/* BOOK NOW BUTTON */}
            <button
              onClick={handleBookNow}
              disabled={
                !startTime ||
                !endTime ||
                amount === 0 ||
                errors.startTime !== "" ||
                errors.endTime !== "" ||
                errors.date !== ""
              }
              className={`w-full py-4 mt-6 text-white font-bold rounded-xl shadow-lg transition-all transform ${
                !startTime ||
                !endTime ||
                amount === 0 ||
                errors.startTime !== "" ||
                errors.endTime !== "" ||
                errors.date !== ""
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 active:scale-95"
              }`}
            >
              {!startTime ||
              !endTime ||
              errors.startTime !== "" ||
              errors.endTime !== "" ||
              errors.date !== ""
                ? "Enter all values to book"
                : `Confirm Booking - ₹${amount}`}
            </button>
          </div>

          {/* BOOKED SLOTS */}
          <div className="bg-white rounded-2xl shadow-xl p-5">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              📅 Today's Bookings
            </h2>

            {bookings.filter((slot) => slot.SlotDate === date).length === 0 ? (
              <div className="text-center py-8 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border-2 border-green-200">
                <div className="text-4xl mb-3">🎯</div>
                <p className="font-bold text-green-700 text-lg">
                  All Slots Available!
                </p>
                <p className="text-green-600 mt-1">No bookings for this date</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {bookings
                  .filter((slot) => slot.SlotDate === date)
                  .sort((a, b) => a.StartTime.localeCompare(b.StartTime))
                  .map((slot, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border-l-4 border-red-500"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-bold text-red-700 text-lg">
                            {slot.StartTime} - {slot.EndTime}
                          </div>
                          <div className="text-sm text-red-600 flex items-center mt-1">
                            <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                            Booked •{" "}
                            {slot.StartTime < "12:00"
                              ? "Morning"
                              : slot.StartTime < "18:00"
                              ? "Afternoon"
                              : "Evening"}
                          </div>
                        </div>
                        <div className="text-red-500">
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                            ⛔ Occupied
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* FOOTER WITH CONTACT DETAILS */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white mt-8">
        <div className="container mx-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Contact Person */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start mb-3">
                <User className="mr-2" size={20} />
                <h3 className="font-bold text-lg">Contact Person</h3>
              </div>
              <p className="text-lg font-semibold text-blue-300">
                Thotakura Rahul Yadav
              </p>
            </div>

            {/* Phone Numbers */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <Phone className="mr-2" size={20} />
                <h3 className="font-bold text-lg">Call Now</h3>
              </div>
              <div className="space-y-2">
                <a
                  href="tel:9618614860"
                  className="block text-lg font-semibold hover:text-green-300 transition-colors bg-gray-800 hover:bg-gray-700 p-2 rounded-lg"
                >
                  📞 96186 14860
                </a>
                <a
                  href="tel:8125770099"
                  className="block text-lg font-semibold hover:text-green-300 transition-colors bg-gray-800 hover:bg-gray-700 p-2 rounded-lg"
                >
                  📞 81257 70099
                </a>
              </div>
            </div>

            {/* Address */}
            <div className="text-center md:text-right">
              <div className="flex items-center justify-center md:justify-end mb-3">
                <MapPin className="mr-2" size={20} />
                <h3 className="font-bold text-lg">Location</h3>
              </div>
              <button
                onClick={openMaps}
                className="inline-block text-left hover:bg-gray-700 w-full text-center py-2 rounded-xl transition-all active:scale-95 group"
              >
                <p className="text-blue-300 font-medium group-hover:text-white">
                  Reddy's Colony, Road No-3
                </p>
                <p className="text-blue-300 font-medium group-hover:text-white">
                  Boduppal, Hyderabad
                </p>
                <p className="text-blue-300 font-medium group-hover:text-white">
                  Telangana 500092
                </p>
                <div className="flex items-center justify-center md:justify-end mt-2">
                  <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full flex items-center">
                    <MapPin size={12} className="mr-1" />
                    Open in Maps
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-6 pt-4 border-t border-gray-700 text-center text-gray-400">
            <p>
              © {new Date().getFullYear()} YBR 360 Arena. All rights reserved.
            </p>
            <p className="text-sm mt-1">Cricket Box Booking System</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
