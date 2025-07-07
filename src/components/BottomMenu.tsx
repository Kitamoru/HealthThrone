// components/BottomMenu.tsx
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const BottomMenu = () => {
  const router = useRouter();

  return (
    <div className="menu">
      <Link href="/" passHref>
        <button className={`menu-btn ${router.pathname === '/' ? 'active' : ''}`}>
          <div className="menu-btn-icon">
            <img 
              src="/1.svg" 
              alt="Home" 
              className="menu-icon"
            />
          </div>
        </button>
      </Link>
      
      <Link href="/friends" passHref>
        <button className={`menu-btn ${router.pathname === '/friends' ? 'active' : ''}`}>
          <div className="menu-btn-icon">
            <img 
              src="/2.svg" 
              alt="Friends" 
              className="menu-icon"
            />
          </div>
        </button>
      </Link>
      
      <Link href="/shop" passHref>
        <button className={`menu-btn ${router.pathname === '/shop' ? 'active' : ''}`}>
          <div className="menu-btn-icon">
            <img 
              src="/3.svg" 
              alt="Shop" 
              className="menu-icon"
            />
          </div>
        </button>
      </Link>
      
      <Link href="/reference" passHref>
        <button className={`menu-btn ${router.pathname === '/reference' ? 'active' : ''}`}>
          <div className="menu-btn-icon">
            <img 
              src="/4.svg" 
              alt="Reference" 
              className="menu-icon"
            />
          </div>
        </button>
      </Link>
    </div>
  );
};

export default BottomMenu;
