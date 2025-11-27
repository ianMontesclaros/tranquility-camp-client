import { eachDayOfInterval } from "date-fns";
import { notFound } from "next/navigation";
import { IBooking, ICabin, ISetting } from "../_types/database";
import { supabase } from "./supabase-client";

export async function getCabin(cabinId: number) {
  const { data, error } = await supabase
    .from("cabins")
    .select("*")
    .eq("id", cabinId)
    .single();

  if (error) {
    console.error(error);
    notFound();
  }

  return data as ICabin;
}

export const getCabins = async function () {
  const { data, error } = await supabase
    .from("cabins")
    .select("id, name, maxCapacity, regularPrice, discount, image")
    .order("name");

  if (error) throw new Error("Cabins could not be loaded");

  return data as ICabin[];
};

export async function getGuest(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  const { data, error } = await supabase
    .from("guests")
    .select("*")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error) {
    console.error("[getGuest] SUPABASE ERROR:", error);

    return null;
  }

  return data;
}

export async function getBooking(bookingId: number) {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single();

  if (error) throw new Error("Booking could not get loaded");

  return data as IBooking;
}

export async function getBookings(guestId: number) {
  if (!guestId) {
    console.warn("[getBookings] guestId is undefined — returning empty list");
    return [];
  }

  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("guestId", guestId); // keep simple for now

  if (error) {
    console.error(error);
    throw new Error("Bookings could not get loaded");
  }

  return data as IBooking[];
}

export async function getBookedDatesByCabinId(cabinId: number) {
  let today: string | Date = new Date();
  today.setUTCHours(0, 0, 0, 0);
  today = today.toISOString();

  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("cabinId", cabinId)
    .or(`startDate.gte.${today},status.eq.checked-in`);

  if (error) {
    console.error(error);
    throw new Error("Bookings could not get loaded");
  }

  const bookedDates = data
    .map((booking) =>
      eachDayOfInterval({
        start: new Date(booking.startDate),
        end: new Date(booking.endDate),
      })
    )
    .flat();

  return bookedDates;
}

export async function getSettings() {
  const { data, error } = await supabase.from("settings").select("*").single();

  if (error) throw new Error("Settings could not be loaded");

  return data as ISetting;
}

export async function getCountries() {
  try {
    const res = await fetch(
      "https://restcountries.com/v2/all?fields=name,flag"
    );
    const countries = await res.json();
    return countries;
  } catch {
    throw new Error("Could not fetch countries");
  }
}

export async function createGuest(newGuest: {
  email: string;
  fullName: string;
}) {
  const { data, error } = await supabase.from("guests").insert([newGuest]);

  if (error) {
    console.error(error);
    throw new Error("Guest could not be created");
  }

  return data;
}
