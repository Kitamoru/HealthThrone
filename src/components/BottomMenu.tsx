// components/BottomMenu.tsx
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from './BottomMenu.module.css';

const BottomMenu = () => {
  const router = useRouter();

  return (
    <div className={styles.menu}>
      <Link href="/" passHref legacyBehavior>
        <div className={`${styles['menu-btn']} ${router.pathname === '/' ? styles.active : ''}`}>
          <svg className={styles['menu-icon']} width="28" height="28" viewBox="0 0 24 24">
            <use xlinkHref="/1.svg#icon" />
          </svg>
        </div>
      </Link>
      
      <Link href="/friends" passHref legacyBehavior>
        <div className={`${styles['menu-btn']} ${router.pathname === '/friends' ? styles.active : ''}`}>
          <svg className={styles['menu-icon']} width="28" height="28" viewBox="0 0 24 24">
            <use xlinkHref="/2.svg#icon" />
          </svg>
        </div>
      </Link>
      
      <Link href="/shop" passHref legacyBehavior>
        <div className={`${styles['menu-btn']} ${router.pathname === '/shop' ? styles.active : ''}`}>
          <svg className={styles['menu-icon']} width="28" height="28" viewBox="0 0 24 24">
            <use xlinkHref="/3.svg#icon" />
          </svg>
        </div>
      </Link>
      
      <Link href="/reference" passHref legacyBehavior>
        <div className={`${styles['menu-btn']} ${router.pathname === '/reference' ? styles.active : ''}`}>
          <svg className={styles['menu-icon']} width="28" height="28" viewBox="0 0 24 24">
            <use xlinkHref="/4.svg#icon" />
          </svg>
        </div>
      </Link>
    </div>
  );
};

export default BottomMenu;
