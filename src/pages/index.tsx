import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function MainPage() {
  const navigate = useNavigate();
  // Sample booked slots JSON
  const bookedSlots = [
    { date: "2025-11-25", start: "10:00", end: "12:00" },
    { date: "2025-11-25", start: "15:00", end: "16:00" },
    { date: "2025-11-26", start: "08:00", end: "10:00" },
  ];

  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [amount, setAmount] = useState(0);
  const [coupon, setCoupon] = useState("");
  const [timeSlots, setTimeSlots] = useState([]);

  // Default date = today
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setDate(today);
  }, []);

  // Get price based on time
  const getPriceForTime = (time) => {
    const hour = parseInt(time.split(':')[0]);
    
    if (hour >= 6 && hour < 11) {
      return 600; // Morning: 6 AM to 11 AM
    } else if (hour >= 11 && hour < 17) {
      return 500; // Day: 11 AM to 5 PM
    } else {
      return 800; // Evening/Night: 5 PM to 6 AM
    }
  };

  // Calculate amount and time slots breakdown
  useEffect(() => {
    if (startTime && endTime) {
      const startDateTime = new Date(`2000-01-01T${startTime}`);
      const endDateTime = new Date(`2000-01-01T${endTime}`);
      
      if (endDateTime <= startDateTime) {
        setAmount(0);
        setTimeSlots([]);
        return;
      }

      let totalAmount = 0;
      const slots = [];
      let currentSlotStart = new Date(startDateTime);
      
      // Calculate slots with different pricing
      while (currentSlotStart < endDateTime) {
        const currentHour = currentSlotStart.getHours();
        const currentPrice = getPriceForTime(
          `${currentHour.toString().padStart(2, '0')}:00`
        );
        
        // Find when this price period ends
        let currentSlotEnd = new Date(currentSlotStart);
        if (currentHour >= 6 && currentHour < 11) {
          // Morning slot ends at 11 AM or booking end
          currentSlotEnd.setHours(11, 0, 0, 0);
        } else if (currentHour >= 11 && currentHour < 17) {
          // Day slot ends at 5 PM or booking end
          currentSlotEnd.setHours(17, 0, 0, 0);
        } else {
          // Evening slot ends at 6 AM next day or booking end
          currentSlotEnd.setDate(currentSlotEnd.getDate() + 1);
          currentSlotEnd.setHours(6, 0, 0, 0);
        }
        
        // Adjust slot end to not exceed booking end
        if (currentSlotEnd > endDateTime) {
          currentSlotEnd = new Date(endDateTime);
        }
        
        const slotHours = (currentSlotEnd - currentSlotStart) / (1000 * 60 * 60);
        const slotAmount = slotHours * currentPrice;
        
        if (slotHours > 0) {
          slots.push({
            period: `${formatTime(currentSlotStart)} - ${formatTime(currentSlotEnd)}`,
            hours: slotHours.toFixed(2),
            rate: currentPrice,
            amount: Math.round(slotAmount)
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
  }, [startTime, endTime]);

  const formatTime = (date) => {
    return date.toTimeString().slice(0, 5);
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartTime(e.target.value);
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndTime(e.target.value);
  };

  const handleCouponChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCoupon(e.target.value);
  };

  const handleBookNow = () => {
    if (!startTime || !endTime || amount === 0) {
      alert("Please select valid start and end times");
      return;
    }

    // Navigate to payment page with booking details
    navigate('/payment', {
      state: {
        bookingDetails: {
          date,
          startTime,
          endTime,
          amount,
          timeSlots,
          coupon
        }
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* LEFT IMAGE SECTION - Larger image with gradient background */}
      <div className="lg:w-1/4 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex justify-center items-center p-4 lg:min-h-screen">
        <img
          src="/ybrlogo.png"
          alt="YBR 360 Arena"
          className="w-48 lg:w-full xl:w-80 h-auto drop-shadow-2xl transform hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* CENTER BOOKING FORM - Soft blue background */}
      <div className="lg:w-2/4 bg-gradient-to-br from-blue-50 to-indigo-100 p-6 lg:p-8 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          <h1 className="text-2xl lg:text-3xl font-bold text-blue-800 mb-6 text-center lg:text-left">
            YBR 360 Arena – Cricket Box Booking
          </h1>

          {/* PRICING INFORMATION CARD */}
          <div className="mb-6 p-4 bg-white rounded-xl shadow-md border border-blue-200">
            <h3 className="font-bold text-blue-800 mb-3 text-lg">🎯 Pricing Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Morning (6:00 AM - 11:00 AM):</span>
                <span className="font-semibold text-green-600">₹600/hour</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Day (11:00 AM - 5:00 PM):</span>
                <span className="font-semibold text-blue-600">₹500/hour</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Evening/Night (5:00 PM - 6:00 AM):</span>
                <span className="font-semibold text-purple-600">₹800/hour</span>
              </div>
            </div>
          </div>

          {/* DATE SELECTOR */}
          <div className="mb-6">
            <label className="font-semibold text-gray-700">Select Date</label>
            <input
              type="date"
              className="w-full mt-2 p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* TIME SELECTION - SIDE BY SIDE */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* START TIME */}
            <div>
              <label className="font-semibold text-gray-700">Start Time</label>
              <input
                type="time"
                className="w-full mt-2 p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                value={startTime}
                onChange={handleStartTimeChange}
              />
            </div>

            {/* END TIME */}
            <div>
              <label className="font-semibold text-gray-700">End Time</label>
              <input
                type="time"
                className="w-full mt-2 p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                value={endTime}
                onChange={handleEndTimeChange}
              />
            </div>
          </div>

          {/* COUPON INPUT */}
          <div className="mb-6">
            <label className="font-semibold text-gray-700">Coupon Code</label>
            <input
              type="text"
              placeholder="Enter coupon code"
              className="w-full mt-2 p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              value={coupon}
              onChange={handleCouponChange}
            />
          </div>

          {/* BILL FORMAT AMOUNT DISPLAY */}
          {startTime && endTime && amount > 0 && (
            <div className="mt-8 p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 mb-4 text-center border-b pb-2">
                🧾 Booking Invoice
              </h3>
              
              {/* Time Slot Breakdown */}
              <div className="space-y-3 mb-4">
                {timeSlots.map((slot, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <div className="text-gray-600">
                      <div className="font-medium">{slot.period}</div>
                      <div className="text-xs text-gray-500">{slot.hours} hours × ₹{slot.rate}/hr</div>
                    </div>
                    <div className="font-semibold">₹{slot.amount}</div>
                  </div>
                ))}
              </div>

              {/* Coupon Discount */}
              {coupon && (
                <div className="flex justify-between items-center py-2 border-t border-gray-200">
                  <div className="text-gray-600">Coupon Discount</div>
                  <div className="font-semibold text-green-600">-₹0</div>
                </div>
              )}

              {/* Total Amount */}
              <div className="flex justify-between items-center pt-3 border-t-2 border-gray-300 mt-2">
                <div className="text-lg font-bold text-gray-800">Total Amount</div>
                <div className="text-xl font-bold text-blue-700">₹{amount}</div>
              </div>

              {/* Additional Info */}
              <div className="mt-3 text-xs text-gray-500 text-center">
                *Taxes included | No hidden charges
              </div>
            </div>
          )}

          {/* BOOK BUTTON */}
          <button 
            onClick={handleBookNow}
            className="mt-6 w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 transition transform hover:scale-105 shadow-lg"
          >
            Book Now
          </button>
        </div>
      </div>

      {/* RIGHT SIDE – BOOKED SLOTS BOX - Soft green background */}
      <div className="lg:w-1/4 bg-gradient-to-br from-green-50 to-emerald-100 p-6 lg:p-8 border-l border-green-200">
        <div className="sticky top-6">
          <h2 className="text-xl lg:text-2xl font-bold text-gray-800 mb-4">
            📅 Booked Slots
          </h2>

          {bookedSlots.filter((slot) => slot.date === date).length === 0 ? (
            <div className="p-6 bg-white rounded-xl shadow-md text-center border border-green-200">
              <p className="font-semibold text-green-700 text-lg">No bookings for this date</p>
              <p className="text-3xl mt-3">🎉</p>
              <p className="text-sm text-green-600 mt-2">All slots available!</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 lg:max-h-[70vh] overflow-y-auto pr-2">
              {bookedSlots
                .filter((slot) => slot.date === date)
                .map((slot, index) => (
                  <div
                    key={index}
                    className="p-4 bg-white rounded-xl shadow-sm border-l-4 border-red-400 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold text-red-700 text-lg">
                          {slot.start} – {slot.end}
                        </div>
                        <div className="text-sm text-red-600 flex items-center mt-1">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                          Booked
                        </div>
                      </div>
                      <div className="text-red-500 text-xl">⛔</div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}