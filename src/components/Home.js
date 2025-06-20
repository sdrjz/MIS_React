import React from 'react';
import Footer from './Footer.js';


function Home() {
  return (
    <div className="full-page-wrapper">
      <main>
        <div className="d-flex justify-content-center align-items-center" style={{ height: '400px', background: '#3a3a3a' }}>
          <h1 className="text-white display-4 fw-bold" style={{ textShadow: '3px 3px #222' }}>
            WELCOME TO MIS PORTAL
          </h1>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Home;

