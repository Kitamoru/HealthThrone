// components/BottomMenu.tsx
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const BottomMenu = () => {
  const router = useRouter();

  return (
    <div className="bottom-menu">
      <Link href="/" passHref legacyBehavior>
        <div className={`menu-btn ${router.pathname === '/' ? 'active' : ''}`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            stroke="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="icon icon-tabler icons-tabler-outline icon-tabler-analyze menu-icon"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M20 11a8.1 8.1 0 0 0 -6.986 -6.918a8.095 8.095 0 0 0 -8.019 3.918" />
            <path d="M4 13a8.1 8.1 0 0 0 15 3" />
            <path d="M19 16m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
            <path d="M5 8m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
            <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
          </svg>
        </div>
      </Link>
      
      <Link href="/friends" passHref legacyBehavior>
        <div className={`menu-btn ${router.pathname === '/friends' ? 'active' : ''}`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            stroke="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="icon icon-tabler icons-tabler-outline icon-tabler-meeple menu-icon"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M9 20h-5a1 1 0 0 1 -1 -1c0 -2 3.378 -4.907 4 -6c-1 0 -4 -.5 -4 -2c0 -2 4 -3.5 6 -4c0 -1.5 .5 -4 3 -4s3 2.5 3 4c2 .5 6 2 6 4c0 1.5 -3 2 -4 2c.622 1.093 4 4 4 6a1 1 0 0 1 -1 1h-5c-1 0 -2 -4 -3 -4s-2 4 -3 4z" />
          </svg>
        </div>
      </Link>
      
      <Link href="/shop" passHref legacyBehavior>
        <div className={`menu-btn ${router.pathname === '/shop' ? 'active' : ''}`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            stroke="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="icon icon-tabler icons-tabler-outline icon-tabler-ghost menu-icon"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M5 11a7 7 0 0 1 14 0v7a1.78 1.78 0 0 1 -3.1 1.4a1.65 1.65 0 0 0 -2.6 0a1.65 1.65 0 0 1 -2.6 0a1.65 1.65 0 0 0 -2.6 0a1.78 1.78 0 0 1 -3.1 -1.4v-7" />
            <path d="M10 10l.01 0" />
            <path d="M14 10l.01 0" />
            <path d="M10 14a3.5 3.5 0 0 0 4 0" />
          </svg>
        </div>
      </Link>
      
      <Link href="/reference" passHref legacyBehavior>
        <div className={`menu-btn ${router.pathname === '/reference' ? 'active' : ''}`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            stroke="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="icon icon-tabler icons-tabler-outline icon-tabler-info-square-rounded menu-icon"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M12 9h.01" />
            <path d="M11 12h1v4h1" />
            <path d="M12 3c7.2 0 9 1.8 9 9s-1.8 9 -9 9s-9 -1.8 -9 -9s1.8 -9 9 -9z" />
          </svg>
        </div>
      </Link>
    </div>
  );
};

export default BottomMenu;
