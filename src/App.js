import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Header from './components/Header';
import Navbar from './components/Navbar';
import Home from './components/Home';
import BranchCashCreditSale from './pages/BranchCashCreditSale';
import BagSearchReport from './pages/BagSearchReport'; 
import QSRBankReport from './pages/QSRBankReport'; 
import LoadingDetail from './pages/LoadingDetail'; 
import LoadingReport from './pages/LoadingReport'; 
import RiderMasterData from './pages/RiderMasterData';
import DarazDetails from './pages/DarazDetails'; //
import DarazSummary from './pages/DarazSummary'; //
import DeliveredNoRRR from './pages/DeliveredNoRRR';
import ReversePickupReport from './pages/ReversePickupReport';
import IBFTPaymentReport from './pages/IBFTPaymentReport';
import DeliveredNoRRDetail from './pages/DeliveredNoRRDetail';
import ControlTower from './pages/ControlTower'; //

function App() {
  return (
    <Router>
      <Header />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/branch-cash-credit-sale" element={<BranchCashCreditSale />} />
        <Route path="/BagSearchReport" element={<BagSearchReport />} /> 
        <Route path="/QSRBankReport" element={<QSRBankReport />} /> 
        <Route path="/LoadingDetail" element={<LoadingDetail />} /> 
        <Route path="/LoadingReport" element={<LoadingReport />} /> 
        <Route path="/RiderMasterData" element={<RiderMasterData />} />
        <Route path="/DarazDetails" element={<DarazDetails />} />
        <Route path="/DarazSummary" element={<DarazSummary />} />
        <Route path="/DeliveredNoRRR" element={<DeliveredNoRRR />} />
        <Route path="/ReversePickupReport" element={<ReversePickupReport />} />
        <Route path="/IBFTPaymentReport" element={<IBFTPaymentReport />} />
        <Route path="/DeliveredNoRRDetail" element={<DeliveredNoRRDetail />} />
        <Route path="/ControlTower" element={<ControlTower />} /> {/* ✅ Route added */}
      </Routes>
    </Router>
  );
}

export default App;
