import React from 'react';
import Link from 'next/link';

const Navbar = () => {
  return (
    <nav style={{ 
      padding: '1rem 2rem', 
      background: '#ffffff', 
      borderBottom: '1px solid #eaeaea',
      display: 'flex', 
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <div style={{ fontWeight: 'bold', fontSize: '1.4rem', color: '#0070f3' }}>
        TutApp
      </div>
      <div style={{ display: 'flex', gap: '2rem' }}>
        <Link href="/" style={{ textDecoration: 'none', color: '#333' }}>Home</Link>
        <Link href="/community" style={{ 
          textDecoration: 'none', 
          color: '#0070f3',
          fontWeight: '600'
        }}>Community Discussion</Link>
      </div>
    </nav>
  );
};

export default Navbar;