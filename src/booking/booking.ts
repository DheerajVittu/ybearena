
import { supabase } from "@/utils/supabase";
import {type BookingType} from "../utils/bookingType"
export const CreateBooking = async (bookingData: BookingType) => {
  try {
    const response = await supabase.from("Bookings").insert([bookingData]);
    if (response.error) {
      console.error("Supabase error:", response.error);
      return "Something went wrong";
    }
    return "Booking created successfully";
  } catch (error:any) {
    console.error("Error creating booking:", error?.message);
    return "Something went wrong";
  }
};

export const GetBookings = async() => {
  try{
    const response = await supabase.from("Bookings").select("*");
    if (response.error) {
      console.error("Supabase error:", response.error);
      return [];
    }
    return response.data as BookingType[];
  }
  catch(error:any){
    console.error("Error fetching bookings:", error?.message);
    return [];
  }
}
