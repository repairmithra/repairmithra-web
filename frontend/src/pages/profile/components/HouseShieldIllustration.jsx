function HouseShieldIllustration({ className = "" }) {
  return (
    <svg
      viewBox="0 0 320 220"
      className={className}
      role="img"
      aria-label="Illustration of a protected home"
    >
      {/* Ground shadow */}
      <ellipse cx="165" cy="205" rx="120" ry="10" fill="#bfdbfe" opacity="0.5" />

      {/* Left bush */}
      <circle cx="48" cy="176" r="22" fill="#4ade80" />
      <circle cx="70" cy="184" r="16" fill="#22c55e" />
      <circle cx="34" cy="188" r="14" fill="#16a34a" />

      {/* Right bush */}
      <circle cx="278" cy="172" r="20" fill="#4ade80" />
      <circle cx="256" cy="182" r="15" fill="#22c55e" />
      <circle cx="292" cy="186" r="13" fill="#16a34a" />

      {/* Chimney */}
      <rect x="196" y="46" width="16" height="34" rx="2" fill="#1d4ed8" />

      {/* Roof */}
      <polygon points="55,102 165,32 275,102" fill="#1d4ed8" />
      <polygon points="55,102 165,32 275,102" fill="#2563eb" opacity="0.35" />

      {/* House body */}
      <rect x="80" y="100" width="170" height="92" rx="6" fill="#ffffff" stroke="#dbeafe" strokeWidth="2" />

      {/* Windows */}
      <g fill="#dbeafe" stroke="#93c5fd" strokeWidth="2">
        <rect x="98" y="120" width="38" height="34" rx="3" />
      </g>
      <g stroke="#93c5fd" strokeWidth="2">
        <line x1="117" y1="120" x2="117" y2="154" />
        <line x1="98" y1="137" x2="136" y2="137" />
      </g>

      {/* Door */}
      <rect x="150" y="140" width="34" height="52" rx="3" fill="#1d4ed8" />
      <circle cx="176" cy="167" r="2.2" fill="#dbeafe" />

      {/* Shield badge */}
      <g transform="translate(196,128)">
        <path
          d="M34 0 L64 12 V38 C64 64 46 80 34 88 C22 80 4 64 4 38 V12 Z"
          fill="#10b981"
          stroke="#ffffff"
          strokeWidth="4"
        />
        <path
          d="M20 44 L30 54 L50 30"
          fill="none"
          stroke="#ffffff"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

export default HouseShieldIllustration;