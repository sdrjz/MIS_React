import React from 'react';
import mnplogo from '../assets/images/mnpLogo.png';
import './Navbar.css';

function Header() {
  return (
    <div className="bg-black text-white py-2 px-4 d-flex justify-content-between align-items-start">
      {/* Centered logo */}
      <div className="flex-grow-1 text-center">
        <img src={mnplogo} alt="M&P Logo" style={{ height: '70px' }} />
      </div>

      {/* Right-side info */}
      {/* <div className="text-end" style={{ minWidth: '320px' }}>
        <div><strong>REPORT ON:</strong> LIVE SERVER</div>
        <div><strong>WELCOME TO:</strong> NABEEL AHMED</div>
        <div><strong>PASSWORD EXPIRY DAYS LEFT:</strong> 17</div>
        <div>Database Date: 15 May 2025 17:01:21</div>
        <div className="mt-2">
          <button className="btn btn-warning btn-sm me-2">Change Password</button>
          <button className="btn btn-danger btn-sm">Logout</button>
        </div>
      </div> */}
    </div>
  );
}

export default Header;
