// src/components/Footer.js
import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <footer style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f5f5f5' }}>
      <p>&copy; {new Date().getFullYear()} M&P Express Logistics (Private) Limited. All rights reserved.</p>
    </footer>
  );
}

export default Footer;
