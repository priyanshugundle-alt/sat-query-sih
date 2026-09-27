import React from "react";

export default function ThemeToggle({ theme = "dark", onToggle, className = "" }) {
  const isDark = theme === "dark";

  return (
    <label
      className={`switch ${className}`}
      title={isDark ? "Switch to White / Light Mode" : "Switch to Dark Space Mode"}
    >
      <input
        type="checkbox"
        className="input"
        checked={isDark}
        onChange={(e) => {
          if (onToggle) {
            onToggle(e.target.checked ? "dark" : "light");
          }
        }}
      />
      <span className="slider">
        <span className="sun">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <g fill="#ffd43b">
              <circle cx="12" cy="12" r="5" />
              <path
                d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                stroke="#ffd43b"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
          </svg>
        </span>
        <span className="moon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              d="M21.64 13a1 1 0 00-1.05-.14 8.05 8.05 0 01-3.37.73A8.15 8.15 0 019.08 5.49a8.59 8.59 0 01.25-2A1 1 0 008 2.36 10.14 10.14 0 1022 14.05a1 1 0 00-.36-1.05z"
              fill="#73C0FC"
            />
          </svg>
        </span>
      </span>
    </label>
  );
}
