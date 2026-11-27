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
    <path d="M4.5 17H2.75V7a1 1 0 0 1 1-1h8.5a1 1 0 0 1 1 1v10M7.5 17h8.75M13.25 9h4.5l3.5 4v4h-2" />
    <circle cx="6" cy="18" r="1.75" />
    <circle cx="17.75" cy="18" r="1.75" />
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
/* «Качество» — контур Lucide (ISC License, lucide.dev): award */
export const IconQuality = (p) => (
  <S size={44} sw={1.3} {...p}>
    <circle cx="12" cy="8" r="6" />
    <circle cx="12" cy="8" r="2.6" />
    <path d="M15.48 12.89l1.51 8.53a.5.5 0 01-.81.47l-3.58-2.69a1 1 0 00-1.2 0l-3.59 2.69a.5.5 0 01-.81-.47l1.51-8.53" />
  </S>
);
export const IconBulb = (p) => (
  <S size={44} sw={1.3} {...p}>
    <path d="M9 17.5h6M9.8 20.5h4.4" />
    <path d="M12 4.5a5.5 5.5 0 00-3.3 9.9c.6.5.9 1.2.9 1.9v1.2h4.8v-1.2c0-.7.3-1.4.9-1.9A5.5 5.5 0 0012 4.5z" />
    <path d="M12 1.5v1M4.2 4.7l.8.8M19.8 4.7l-.8.8M2 11h1.2M20.8 11H22" />
  </S>
);
/* «Надёжность» — щит с галочкой (Lucide shield-check, ISC License) */
export const IconReliability = (p) => (
  <S size={44} sw={1.3} {...p}>
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 01-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 011-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 011.52 0C14.51 3.81 17 5 19 5a1 1 0 011 1z" />
    <path d="M9 12l2 2 4-4" />
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
