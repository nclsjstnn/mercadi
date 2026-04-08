"use client";

import { useState, useEffect } from "react";

const BRANDS = ["ChatGPT", "Gemini", "WhatsApp", "Agente de IA"];
const INTERVAL = 2200;

export function RotatingBrand() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % BRANDS.length);
        setVisible(true);
      }, 300);
    }, INTERVAL);
    return () => clearInterval(timer);
  }, []);

  return (
    <span
      className="text-amber-500 inline-block transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {BRANDS[index]}
    </span>
  );
}
