/* Линейные иконки в стиле макета (stroke = currentColor). */
const S = ({ size = 24, sw = 1.6, children, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...rest}
  >
    {children}
  </svg>
);

export const IconArrow = (p) => (
  <S {...p}>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </S>
);
export const IconChevron = (p) => (
  <S {...p}>
    <path d="M6 9l6 6 6-6" />
  </S>
);
export const IconChevronLeft = (p) => (
  <S {...p}>
    <path d="M15 5l-7 7 7 7" />
  </S>
);
export const IconChevronRight = (p) => (
  <S {...p}>
    <path d="M9 5l7 7-7 7" />
  </S>
);
export const IconSearch = (p) => (
  <S {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20 20l-4.2-4.2" />
  </S>
);
export const IconClose = (p) => (
  <S {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </S>
);
export const IconMenu = (p) => (
  <S {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </S>
);
export const IconList = (p) => (
  <S {...p}>
    <path d="M9 6h11M9 12h11M9 18h11" />
    <path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" strokeWidth="2.6" />
  </S>
);
export const IconBuilding = (p) => (
  <S {...p}>
    <path d="M4 20V9l8-5 8 5v11" />
    <path d="M9 20v-6h6v6M3 20h18" />
  </S>
);
export const IconShield = (p) => (
  <S {...p}>
    <path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.9-7.5-9.5V6L12 3z" />
    <path d="M8.8 12.2l2.2 2.2 4.3-4.6" />
  </S>
);
export const IconTruck = (p) => (
  <S {...p}>
    <path d="M2.5 6.5h11v9.5h-11zM13.5 9.5h4.2l3.3 3.6v2.9h-7.5" />
    <circle cx="6.5" cy="17.5" r="1.8" />
    <circle cx="17" cy="17.5" r="1.8" />
  </S>
);
export const IconPin = (p) => (
  <S {...p}>
    <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0113 0c0 5.4-6.5 11-6.5 11z" />
    <circle cx="12" cy="10" r="2.3" />
  </S>
);
export const IconPhone = (p) => (
  <S {...p}>
    <path d="M5 4h3.5l1.6 4-2.1 1.4a11 11 0 005.6 5.6l1.4-2.1 4 1.6V18a2 2 0 01-2.2 2A16 16 0 013 6.2 2 2 0 015 4z" />
  </S>
);
export const IconMail = (p) => (
  <S {...p}>
    <rect x="3" y="5.5" width="18" height="13" rx="1.5" />
    <path d="M3.5 6.5L12 13l8.5-6.5" />
  </S>
);
export const IconCheck = (p) => (
  <S {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </S>
);

/* ---------- иконки «Сильных сторон» (крупные, 44px) ---------- */
export const IconQuality = (p) => (
  <S size={44} sw={1.3} {...p}>
    <circle cx="12" cy="9.5" r="5.5" />
    <circle cx="12" cy="9.5" r="3" />
    <path d="M12 2.2l1.1 1.1 1.5-.3.6 1.4 1.5.5-.2 1.5 1.1 1.1-.9 1.2.4 1.5-1.4.6-.4 1.5-1.5-.1-1 1.1-1.3-.8-1.3.8-1-1.1-1.5.1-.4-1.5-1.4-.6.4-1.5-.9-1.2 1.1-1.1-.2-1.5 1.5-.5.6-1.4 1.5.3z" />
    <path d="M8.6 14.2L7 21l2.6-1.3L12 21.6l2.4-1.9L17 21l-1.6-6.8" />
  </S>
);
export const IconBulb = (p) => (
  <S size={44} sw={1.3} {...p}>
    <path d="M9 17.5h6M9.8 20.5h4.4" />
    <path d="M12 4.5a5.5 5.5 0 00-3.3 9.9c.6.5.9 1.2.9 1.9v1.2h4.8v-1.2c0-.7.3-1.4.9-1.9A5.5 5.5 0 0012 4.5z" />
    <path d="M12 1.5v1M4.2 4.7l.8.8M19.8 4.7l-.8.8M2 11h1.2M20.8 11H22" />
  </S>
);
export const IconHandshake = (p) => (
  <S size={44} sw={1.3} {...p}>
    <path d="M2 8.5l3-2 3.2 1.2M22 8.5l-3-2-4.3 1.3-3.7 2.6a1.3 1.3 0 001.5 2.1l2.4-1.4 4.6 4.3" />
    <path d="M5 6.5l-3 7 2 1.5M19 6.5l3 7-2.5 1.7" />
    <path d="M4 15l2.2 2a1.3 1.3 0 001.9-1.8M6.4 13.6l2.6 2.6a1.3 1.3 0 001.9-1.8M9 12.4l3 3a1.3 1.3 0 001.9-1.8M11.6 18.2l1 1a1.3 1.3 0 001.9-1.8l-1.6-1.6M14.6 17.4a1.3 1.3 0 001.9-1.8L19.5 15" />
  </S>
);
export const IconLifebuoy = (p) => (
  <S size={44} sw={1.3} {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4" />
    <path d="M5.6 5.6l3.6 3.6M14.8 14.8l3.6 3.6M18.4 5.6l-3.6 3.6M9.2 14.8l-3.6 3.6" />
  </S>
);
export const IconMedal = (p) => (
  <S size={44} sw={1.3} {...p}>
    <path d="M7 2.5l3.5 7M17 2.5l-3.5 7M9 2.5h6" />
    <circle cx="12" cy="15" r="6" />
    <path d="M12 11.8l1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3z" />
  </S>
);
export const IconChart = (p) => (
  <S size={44} sw={1.3} {...p}>
    <path d="M3 21h18" />
    <path d="M5 21v-5h3v5M10.5 21v-8h3v8M16 21V10h3v11" />
    <path d="M4 11l5-4 3.5 2.5L19 4M15.5 4H19v3.5" />
  </S>
);
