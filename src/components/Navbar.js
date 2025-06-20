import React, { useState } from 'react';
import './Navbar.css';
import { Link } from 'react-router-dom';

function Navbar() {
  const [showSalesMenu, setShowSalesMenu] = useState(false);
  const [showOperationMenu, setShowOperationMenu] = useState(false);
  const [CODShow, CODSetShowMenu] = useState(false);
  const [masterdata, masterdataSetShowMenu] = useState(false);

  return (
    <div className="top-nav d-flex justify-content-between align-items-center px-3 py-2">
      <div className="d-flex gap-2 flex-wrap navbtn">

        <button className="btn btn-dark btn-sm">Dashboard</button>
        <button className="btn btn-dark btn-sm">Accounts Reports</button>

        {/* Operation Reports with submenu */}
        <div
          className="position-relative"
          onMouseEnter={() => setShowOperationMenu(true)}
          onMouseLeave={() => setShowOperationMenu(false)}
        >
          <button className="btn btn-dark btn-sm">Operation Reports</button>
        {showOperationMenu && (
          <ul className="submenu bg-dark text-white position-absolute list-unstyled m-0">
           <li>
              <Link to="/BagSearchReport" className="submenu-item text-white text-decoration-none d-block">Bag Search</Link>
            </li>
            <li>
              <Link to="/QSRReport" className="submenu-item text-white text-decoration-none d-block">QSR Report</Link>
            </li>
            <li>
              <Link to="/QSRBankReport" className="submenu-item text-white text-decoration-none d-block">QSR Bank Report</Link>
            </li>
            <li>
              <Link to="/ControlTower" className="submenu-item text-white text-decoration-none d-block">Control Tower Report</Link> {/* ✅ New link */}
            </li>
            <li>
              <Link to="/LoadingDetail" className="submenu-item text-white text-decoration-none d-block">Loading Detail</Link> {/* ✅ New link */}
            </li>
               <li>
              <Link to="/LoadingReport" className="submenu-item text-white text-decoration-none d-block">Loading Report</Link> {/* ✅ New link */}
            </li>
        
            
          </ul>
        )}

        </div>

        
         {/* Master data Reports with submenu */}
        <div
          className="position-relative"
          onMouseEnter={() => masterdataSetShowMenu(true)}
          onMouseLeave={() => masterdataSetShowMenu(false)}
        >
           <button className="btn btn-dark btn-sm">Master Data</button>
          {masterdata && (
            <ul className="submenu bg-dark text-white position-absolute list-unstyled m-0">
               <li>
                <Link to="/CustomersMasterData" className="submenu-item text-white text-decoration-none d-block">
                  Customers
                </Link>
              </li>
              <li>
                <Link to="/RiderMasterData" className="submenu-item text-white text-decoration-none d-block">
                  Rider Master Data
                </Link>
              </li>
            </ul>
          )}
        </div>

         {/* COD Reports with submenu */}
        <div
          className="position-relative"
          onMouseEnter={() => CODSetShowMenu(true)}
          onMouseLeave={() => CODSetShowMenu(false)}
        >
           <button className="btn btn-dark btn-sm">COD</button>
          {CODShow && (
            <ul className="submenu bg-dark text-white position-absolute list-unstyled m-0">
              <li>
                <Link to="/DarazDetails" className="submenu-item text-white text-decoration-none d-block">
                  Daraz Details
                </Link>
              </li>
                <li>
                <Link to="/DarazSummary" className="submenu-item text-white text-decoration-none d-block">
                  Daraz Summary
                </Link>
              </li>
                <li>
                <Link to="/IBFTPaymentReport" className="submenu-item text-white text-decoration-none d-block">
                  IBFT Payment Report
                </Link>
              </li>
              <li>
                <Link to="/DeliveredNoRRR" className="submenu-item text-white text-decoration-none d-block">
                  Delivered No RRR
                </Link>
              </li>
              <li>
                <Link to="/ReversePickupReport" className="submenu-item text-white text-decoration-none d-block">
                Reverse Pickup Report
                </Link>
              </li>
            </ul>
          )}
        </div>

        {/* Sales Reports with submenu */}
        <div
          className="position-relative"
          onMouseEnter={() => setShowSalesMenu(true)}
          onMouseLeave={() => setShowSalesMenu(false)}
        >
          <button className="btn btn-dark btn-sm">Sales Reports</button>
          {showSalesMenu && (
            <ul className="submenu bg-dark text-white position-absolute list-unstyled m-0">
              <li>
                <Link to="/branch-cash-credit-sale" className="submenu-item text-white text-decoration-none d-block">
                  Branch Cash Credit Sale
                </Link>
              </li>
            </ul>
          )}
        </div>

        <button className="btn btn-dark btn-sm">Closed Reports</button>
      </div>
    </div>
  );
}

export default Navbar;
