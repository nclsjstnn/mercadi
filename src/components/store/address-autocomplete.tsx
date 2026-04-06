"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { MapPin } from "lucide-react";

// Minimal type declarations — avoids adding @types/google.maps as a dependency
declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          Autocomplete: new (
            input: HTMLInputElement,
            opts?: {
              componentRestrictions?: { country: string | string[] };
              fields?: string[];
              types?: string[];
            }
          ) => {
            addListener(event: string, handler: () => void): void;
            getPlace(): {
              address_components?: Array<{
                long_name: string;
                short_name: string;
                types: string[];
              }>;
              formatted_address?: string;
            };
          };
        };
      };
    };
  }
}

export interface AddressResult {
  street: string;
  comuna: string;
  region: string;
  postalCode: string;
  formattedAddress: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: AddressResult) => void;
  required?: boolean;
  inputClassName?: string;
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

function getComponent(
  components: Array<{ long_name: string; short_name: string; types: string[] }>,
  type: string
): string {
  return components.find((c) => c.types.includes(type))?.long_name ?? "";
}

function extractAddress(place: {
  address_components?: Array<{ long_name: string; short_name: string; types: string[] }>;
  formatted_address?: string;
}): AddressResult {
  const c = place.address_components ?? [];

  const route = getComponent(c, "route");
  const streetNumber = getComponent(c, "street_number");
  const street = [route, streetNumber].filter(Boolean).join(" ");

  // Chile: locality is the comuna; fallbacks for edge cases
  const comuna =
    getComponent(c, "locality") ||
    getComponent(c, "sublocality_level_1") ||
    getComponent(c, "administrative_area_level_3") ||
    getComponent(c, "sublocality");

  const region = getComponent(c, "administrative_area_level_1");
  const postalCode = getComponent(c, "postal_code");

  return {
    street,
    comuna,
    region,
    postalCode,
    formattedAddress: place.formatted_address ?? "",
  };
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  required,
  inputClassName,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);

  function initAutocomplete() {
    if (initialized.current || !inputRef.current) return;
    if (!window.google?.maps?.places?.Autocomplete) return;

    initialized.current = true;

    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "cl" },
      fields: ["address_components", "formatted_address"],
      types: ["address"],
    });

    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (!place.address_components?.length) return;
      const result = extractAddress(place);
      onChange(result.street);
      onSelect(result);
    });
  }

  // Try on mount — handles the case where the script was already loaded
  // (e.g. user navigated back to this page)
  useEffect(() => {
    initAutocomplete();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Graceful fallback when no API key is configured
  if (!API_KEY) {
    return (
      <input
        type="text"
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClassName}
        placeholder="Calle y número"
      />
    );
  }

  return (
    <>
      {/* Google Places dropdown styling */}
      <style>{`
        .pac-container {
          border-radius: 10px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          border: 1px solid #e5e7eb;
          font-family: inherit;
          margin-top: 4px;
          z-index: 9999 !important;
        }
        .pac-item {
          padding: 9px 14px;
          font-size: 13px;
          cursor: pointer;
          color: #374151;
          border-top: 1px solid #f3f4f6;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .pac-item:first-child { border-top: none; }
        .pac-item:hover, .pac-item-selected { background: #f9fafb; }
        .pac-icon { display: none; }
        .pac-item-query { font-size: 13px; color: #111827; }
        .pac-matched { font-weight: 600; }
        .pac-secondary-text { color: #6b7280; }
      `}</style>

      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&loading=async`}
        strategy="afterInteractive"
        onLoad={initAutocomplete}
      />

      <div className="relative">
        <MapPin
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
          style={{ color: "var(--store-muted, #9ca3af)" }}
          aria-hidden
        />
        <input
          ref={inputRef}
          type="text"
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClassName}
          style={{ paddingLeft: "2.25rem" }}
          placeholder="Busca tu dirección..."
          autoComplete="off"
        />
      </div>
    </>
  );
}
