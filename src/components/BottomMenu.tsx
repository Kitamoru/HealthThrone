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
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="menu-icon"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M20 11a8.1 8.1 0 0 0 -6.986 -6.918a8.095 8.095 0 0 0 -8.019 3.918" />
            <path d="M4 13a8.1 8.1 0 0 0 15 3" />
            <circle cx="19" cy="16" r="1" />
            <circle cx="5" cy="8" r="1" />
            <circle cx="12" cy="12" r="3" />
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
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="menu-icon"
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
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="menu-icon"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M5 11a7 7 0 0 1 14 0v7a1.78 1.78 0 0 1 -3.1 1.4a1.65 1.65 0 0 0 -2.6 0a1.65 1.65 0 0 1 -2.6 0a1.65 1.65 0 0 0 -2.6 0a1.78 1.78 0 0 1 -3.1 -1.4v-7" />
            <line x1="10" y1="10" x2="10.01" y2="10" />
            <line x1="14" y1="10" x2="14.01" y2="10" />
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
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="menu-icon"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <path d="M9 12l2 2l4 -4" />
          </svg>
        </div>
      </Link>
    </div>
  );
};

export default BottomMenu;
