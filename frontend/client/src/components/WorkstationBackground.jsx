import React from 'react';

/**
 * WorkstationBackground - Clean adaptive background for Investigation Workstation
 */
export const WorkstationBackground = ({ theme = "dark" }) => {
  return (
    <div
      className={`fixed inset-0 pointer-events-none transition-colors duration-200 ${
        theme === "light" ? "bg-[#F8FAFC]" : "bg-black"
      }`}
      style={{ zIndex: 0 }}
    />
  );
};
