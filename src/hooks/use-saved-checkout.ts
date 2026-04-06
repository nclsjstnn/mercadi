"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "mercadi_checkout_profile";

export interface CheckoutProfile {
  buyer: {
    name: string;
    email: string;
    phone: string;
    rut: string;
  };
  address: {
    street: string;
    comuna: string;
    region: string;
    postalCode: string;
    formattedAddress: string;
  };
  savedAt: string;
}

export function useSavedCheckout() {
  const [profile, setProfile] = useState<CheckoutProfile | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setProfile(JSON.parse(raw) as CheckoutProfile);
    } catch {
      // localStorage unavailable or corrupted
    }
  }, []);

  function save(
    buyer: CheckoutProfile["buyer"],
    address: CheckoutProfile["address"]
  ) {
    const data: CheckoutProfile = {
      buyer,
      address,
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setProfile(data);
    } catch {
      // storage full or unavailable
    }
  }

  function clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setProfile(null);
    } catch {}
  }

  return { profile, save, clear };
}
