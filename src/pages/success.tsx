import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, LocationOn, Phone, Person, Schedule, Paid, Info } from '@mui/icons-material';

export default function SuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingData = location.state?.booking;
  const fromPayment = location.state?.fromPayment;

  useEffect(() => {
    // Redirect if accessed directly without payment
    if (!fromPayment || !bookingData) {
      navigate("/");
    }
  }, [fromPayment, bookingData, navigate]);

  if (!bookingData) {
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
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const { bookingDetails, contactPerson, venueAddress, originalAmount } = bookingData;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueAddress)}`;
  
  // Calculate amounts based on payment type
  const isFullPayment = bookingDetails.PaymentType === "Full Payment";
  const amountPaid = bookingDetails.Amount;
  const totalAmount = originalAmount || bookingDetails.Amount;
  const balanceAmount = bookingDetails.BalanceAmount || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle className="text-green-600" style={{ fontSize: 64 }} />
            </div>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-green-800 mb-2">
            Booking Confirmed! 🎉
          </h1>
          <p className="text-gray-600 text-lg">
            Your cricket box booking has been successfully created
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Booking ID: <span className="font-mono font-bold">{bookingData.bookingId}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Booking Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Summary Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-3 flex items-center">
                <Schedule className="mr-2 text-blue-600" />
                Booking Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-xl">
                  <div className="text-xs text-blue-600 font-semibold mb-1">DATE</div>
                  <div className="text-lg font-bold text-gray-800">{bookingDetails.SlotDate}</div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-xl">
                  <div className="text-xs text-green-600 font-semibold mb-1">TIME SLOT</div>
                  <div className="text-lg font-bold text-gray-800">
                    {bookingDetails.StartTime} - {bookingDetails.EndTime}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-purple-50 p-4 rounded-xl">
                  <div className="text-xs text-purple-600 font-semibold mb-1">BOOKED BY</div>
                  <div className="text-lg font-bold text-gray-800">{bookingDetails.Name}</div>
                  <div className="text-sm text-gray-600">{bookingDetails.Phone}</div>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-xl">
                  <div className="text-xs text-yellow-600 font-semibold mb-1">BOOKING STATUS</div>
                  <div className="text-lg font-bold text-gray-800">Success</div>
                  <div className="text-sm text-gray-600">UTR: {bookingDetails.UTR}</div>
                </div>
              </div>
            </div>

            {/* Payment Details Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-3 flex items-center">
                <Paid className="mr-2 text-green-600" />
                Payment Details
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm font-semibold text-gray-700">Total Amount</div>
                    <div className="text-xs text-gray-500">Complete booking cost</div>
                  </div>
                  <div className="text-xl font-bold text-gray-800">₹{totalAmount}</div>
                </div>

                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <div>
                    <div className="text-sm font-semibold text-blue-700">Amount Paid</div>
                    <div className="text-xs text-blue-600">{bookingDetails.PaymentType}</div>
                  </div>
                  <div className="text-lg font-bold text-blue-700">₹{amountPaid}</div>
                </div>

                {!isFullPayment && balanceAmount > 0 && (
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <div className="text-sm font-semibold text-yellow-700">Balance Amount</div>
                      <div className="text-xs text-yellow-600">To be paid at venue</div>
                    </div>
                    <div className="text-lg font-bold text-yellow-700">₹{balanceAmount}</div>
                  </div>
                )}

                {/* <div className="mt-4 p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm opacity-90">AMOUNT PAID</div>
                      <div className="text-xl font-bold">₹{amountPaid}</div>
                      {!isFullPayment && (
                        <div className="text-xs opacity-80 mt-1">
                          Balance ₹{balanceAmount} to be paid at venue
                        </div>
                      )}
                    </div>
                    <div className="text-2xl">✅</div>
                  </div>
                </div> */}
              </div>
            </div>
          </div>

          {/* Right Column - Venue & Contact */}
          <div className="space-y-6">
            {/* Venue Location Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-3 flex items-center">
                <LocationOn className="mr-2 text-red-600" />
                Venue Location
              </h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-semibold text-gray-700 mb-2">Cricket Box Address</div>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <div className="text-blue-700 font-medium flex items-center">
                      <LocationOn className="mr-2" />
                      {venueAddress}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">Click to open in Google Maps</div>
                  </a>
                  <div className="mt-3 text-xs text-gray-500">
                    <div className="font-semibold mb-1">Instructions:</div>
                    <ul className="space-y-1">
                      <li>• Venue opens 30 minutes before first booking</li>
                      <li>• Parking available on-site</li>
                    </ul>
                  </div>
                </div>

                <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl text-white text-center">
                  <div className="font-bold">🚗 Plan your travel in advance</div>
                  <div className="text-sm opacity-90 mt-1">Reach 5 minutes before your slot</div>
                </div>
              </div>
            </div>

            {/* Contact Person Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-3 flex items-center">
                <Person className="mr-2 text-purple-600" />
                Contact Person
              </h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center mb-3">
                    <div className="bg-purple-100 p-2 rounded-lg mr-3">
                      <Person className="text-purple-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-800">{contactPerson.name}</div>
                      <div className="text-sm text-gray-600">Venue Manager</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <a
                      href={`tel:${contactPerson.phone1}`}
                      className="flex items-center p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Phone className="text-green-600 mr-3" />
                      <div>
                        <div className="font-medium text-gray-800">{contactPerson.phone1}</div>
                        <div className="text-xs text-gray-500">Primary Contact</div>
                      </div>
                    </a>
                    
                    <a
                      href={`tel:${contactPerson.phone2}`}
                      className="flex items-center p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Phone className="text-blue-600 mr-3" />
                      <div>
                        <div className="font-medium text-gray-800">{contactPerson.phone2}</div>
                        <div className="text-xs text-gray-500">Secondary Contact</div>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Terms & Conditions Card */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-3 flex items-center">
            <Info className="mr-2 text-orange-600" />
            Important Terms & Conditions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-bold text-gray-700 flex items-center">
                <span className="bg-red-100 text-red-600 rounded-full w-6 h-6 flex items-center justify-center mr-2 text-sm">1</span>
                Venue Rules
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  Come to venue 5 minutes prior to your booking time
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">✗</span>
                  No extra time will be given if you're late
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">✗</span>
                  Outside food and drinks are not allowed
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  Sports equipment will be provided
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">✗</span>
                  Smoking and alcohol are strictly prohibited
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-gray-700 flex items-center">
                <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center mr-2 text-sm">2</span>
                Payment & Cancellation
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  {!isFullPayment ? `Pay remaining ₹${balanceAmount} at venue before starting` : 'Full payment completed'}
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">✗</span>
                  No refunds for late arrivals or no-shows
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  Bring UTR receipt for verification
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">ℹ</span>
                  For any issues, contact venue manager immediately
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => window.print()}
            className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
          >
            📄 Print Booking Details
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex-1 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
          >
            ← Back to Home
          </button>
        </div>
        
        {/* Footer Note */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>A confirmation SMS has been sent to your registered phone number.</p>
          <p className="mt-1">If you have any questions, please contact the venue manager.</p>
          <p className="mt-4 text-xs">Thank you for choosing our cricket box facility!</p>
        </div>
      </div>
    </div>
  );
}