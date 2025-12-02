
import { supabase } from "@/utils/supabase";
import {type BookingType} from "../utils/bookingType"
export const CreateBooking = async (bookingData: BookingType) => {
  try {
    const response = await supabase.from("Bookings").insert([bookingData]);
    if (response.error) {
      console.error("Supabase error:", response);
      if(response.error.code === "23505"){
        return "Payment already processed.";
      }
      return response.error.details || "Something went wrong";
    }
    return  "Booking created successfully";
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
    console.log("Bookings fetched:", response.data);
    return response.data as BookingType[];
  }
  catch(error:any){
    console.error("Error fetching bookings:", error?.message);
    return [];
  }
}

export const ApplyCoupon = async(couponCode:string) => {
  try{
    const {data,error} = await supabase.from("Coupons").select("*").eq("Name", couponCode).single();
    if (error) {
      console.error("Supabase error:", error);
      return false;
    }
    return data;


  }
  catch(error:any){
    console.error("Error applying coupon:", error?.message);
    return false;
  }
}

export const UpdateCouponUsage = async(couponCode:string) => {
  try{
    const {data,error} = await supabase.from("Coupons").select("*").eq("Name", couponCode).single();    
    if (error) {
      console.error("Supabase error:", error);
      return false;
    }
    const newUsage = (data.Used || 0) + 1;
    const updateResponse = await supabase.from("Coupons").update({Used: newUsage}).eq("Name", couponCode); 
    if (updateResponse.error) {
      console.error("Supabase error:", updateResponse.error);
      return false;
    }
    return true;
  }
  catch(error:any){
    console.error("Error updating coupon usage:", error?.message);
    return false;
  }
}

export const GetBankAccounts = async() => {
  try{
    const {data,error} = await supabase.from("BankAccounts").select("*");    
    if (error) {
      console.error("Supabase error:", error);
      return [];
    }
    console.log("Bank accounts fetched:", data);
    return data;
  }
  catch(error:any){
    console.error("Error fetching bank accounts:", error?.message);
    return [];
  }
}