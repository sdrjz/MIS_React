import React, { useState } from 'react';

const sampleData = [
  {
    Date: '2025-05-01',
    Region: 'South',
    Zone: 'Karachi',
    Branch: 'Gulshan',
    Segment: 'Retail',
    Product: 'Electronics',
    ShipmentsCount: 23,
    NetSale: 25000,
    GrossSale: 27000
  },
  {
    Date: '2025-05-01',
    Region: 'North',
    Zone: 'Lahore',
    Branch: 'Johar Town',
    Segment: 'Corporate',
    Product: 'Fashion',
    ShipmentsCount: 15,
    NetSale: 18000,
    GrossSale: 20000
  },
  {
    Date: '2025-05-01',
    Region: 'Central',
    Zone: 'Faisalabad',
    Branch: 'Clock Tower',
    Segment: 'Retail',
    Product: 'Furniture',
    ShipmentsCount: 10,
    NetSale: 12000,
    GrossSale: 13000
  },
   {
    Date: '2025-05-01',
    Region: 'South',
    Zone: 'Karachi',
    Branch: 'Gulshan',
    Segment: 'Retail',
    Product: 'Electronics',
    ShipmentsCount: 23,
    NetSale: 25000,
    GrossSale: 27000
  },
  {
    Date: '2025-05-01',
    Region: 'North',
    Zone: 'Lahore',
    Branch: 'Johar Town',
    Segment: 'Corporate',
    Product: 'Fashion',
    ShipmentsCount: 15,
    NetSale: 18000,
    GrossSale: 20000
  },
  {
    Date: '2025-05-01',
    Region: 'Central',
    Zone: 'Faisalabad',
    Branch: 'Clock Tower',
    Segment: 'Retail',
    Product: 'Furniture',
    ShipmentsCount: 10,
    NetSale: 12000,
    GrossSale: 13000
  },
  // Add more if needed...
];

function BranchCashCreditSale() {
  const [pageSize, setPageSize] = useState(50);
  const [pageNumber, setPageNumber] = useState(1);

  const totalRecords = sampleData.length;
  const totalPages = Math.ceil(totalRecords / pageSize);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
  const pagedData = sampleData.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);

  return (
    <div className="p-4">
      <h2>Submit Branch Cash and Credit Sale</h2>

      {/* Table */}
      <table className="table table-bordered table-hover">
        <thead className="table-dark">
          <tr>
            <th>S.No.</th>
            <th>DATE</th>
            <th>Region</th>
            <th>Zone</th>
            <th>Branch</th>
            <th>Segment</th>
            <th>Product</th>
            <th>Shipments Count</th>
            <th>Net Sale</th>
            <th>Gross Sale</th>
          </tr>
        </thead>
        <tbody>
          {pagedData.map((row, index) => (
            <tr key={index}>
              <td>{(pageNumber - 1) * pageSize + index + 1}</td>
              <td>{row.Date}</td>
              <td>{row.Region}</td>
              <td>{row.Zone}</td>
              <td>{row.Branch}</td>
              <td>{row.Segment}</td>
              <td>{row.Product}</td>
              <td>{row.ShipmentsCount}</td>
              <td>{row.NetSale}</td>
              <td>{row.GrossSale}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ✅ Moved controls below the table */}
      <div className="d-flex justify-content-between align-items-center mt-3">
        <div>
          <label className="me-2"><strong>Page Size:</strong></label>
          <select
            className="form-select form-select-sm w-auto d-inline-block"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPageNumber(1);
            }}
          >
            {[50, 100, 500, 1000].map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>

        <div>
          {pageNumbers.slice(0, 10).map((num) => (
            <button
              key={num}
              className={`btn btn-sm mx-1 ${num === pageNumber ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setPageNumber(num)}
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BranchCashCreditSale;
