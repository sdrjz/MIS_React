import React, { useEffect, useState } from 'react';
import axios from '../utils/axios';
import './DeliveredNoRRR.css';
import excelImg from '../assets/images/ExcelFile.png';
import GenericDropdown from '../components/GenericDropdown';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

function ControlTower() {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [pageSize, setPageSize] = useState(50);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [selectedZones, setSelectedZones] = useState([]);
  const [zoneOptions, setZoneOptions] = useState([]);
  const [branchOptions, setBranchOptions] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState([]);
  const [riderOptions, setriderOptions] = useState([]);
  const [selectedrider, setSelectedrider] = useState([]);
  const [accountNumbersText, setAccountNumbersText] = useState('');
  const hiddenHeaders = ['zoneCode'];
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  useEffect(() => {
    const fetchZones = async () => {
      try {
        const res = await axios.get('/api/GenericDropDown/zone');
        const data = res.data.data || [];
        const formatted = data.map((item) => ({ value: item.Id, label: item.Label }));
        setZoneOptions(formatted);
      } catch (err) {
        console.error('Error fetching zone options:', err);
      }
    };
    fetchZones();
  }, []);

  useEffect(() => {
  if (selectedZones.length > 0) {
    handleSearch(); // refetch data for the new page or page size
  }
}, [pageNumber, pageSize]);

  const fetchBranches = async (selectedZoneIds) => {
    try {
      const zoneParam = selectedZoneIds.join(',');
      const res = await axios.get(`/api/GenericDropDown/branch?parentId=${zoneParam}`);
      const data = res.data.data || [];
      const formatted = data.map(item => ({ value: item.Id, label: item.Label }));
      setBranchOptions(formatted);
    } catch (err) {
      console.error('Error fetching branch options:', err);
    }
  };

  const fetchRiders = async (selectedBranchIds) => {
    if (!selectedBranchIds || selectedBranchIds.length === 0) {
      setriderOptions([]);
      setSelectedrider([]);
      return;
    }
    try {
      const branchParam = selectedBranchIds.join(',');
      const res = await axios.get(`/api/GenericDropDown/rider?parentId=${branchParam}`);
      const data = res.data.data || [];
      const formatted = data.map(item => ({ value: item.Id, label: item.Label }));
      setriderOptions(formatted);
    } catch (err) {
      console.error('Error fetching rider options:', err);
    }
  };

const handleSearch = async () => {
if (!startDate || !endDate) {
  alert('Please select both Start Date and End Date.');
  return;
}

  setLoading(true);
  try {
   const filters = {
        ZoneCode: selectedZones.length > 0 ? selectedZones.join(',') : null, // ✅ Optional
        BranchCode: selectedBranch.length > 0 ? selectedBranch.join(',') : null,
        AccountNumbers: accountNumbersText || null,
        StartDate: startDate.toLocaleDateString('en-CA'), 
        EndDate: endDate.toLocaleDateString('en-CA'),   
        PageNumber: pageNumber,
        PageSize: pageSize,
        IsExport: false
    };

    const res = await axios.get('/api/Operations/ControlTowerReport', { params: filters });
    if (res.data.isSuccess && res.data.data.length > 0) {
      setData(res.data.data);
      setHeaders(Object.keys(res.data.data[0]));
      setTotalCount(res.data.totalCount || res.data.data.length);
    } else {
      setData([]);
      setHeaders([]);
      setTotalCount(0);
    }
  } catch (err) {
    console.error('Error fetching data:', err);
  }
  setLoading(false);
};


  const handleExcelDownload = async (e) => {
    e.preventDefault();
    let fakeProgress = 1;
    setDownloadProgress(fakeProgress);
    const progressTimer = setInterval(() => {
      fakeProgress += 1;
      if (fakeProgress < 95) setDownloadProgress(fakeProgress);
    }, 100);

    try {
      const filters = {
      ZoneCode: selectedZones.length > 0 ? selectedZones.join(',') : null,
      BranchCode: selectedBranch.length > 0 ? selectedBranch.join(',') : null,
      StartDate: '01/01/2025',
      EndDate: '01/31/2025',
      AccountNumbers: accountNumbersText || null,
      PageNumber: pageNumber,
      PageSize: pageSize,
      IsExport: true

      };

      const response = await axios.get('/api/Operations/ControlTowerReportExcel', {
        params: filters,
        responseType: 'blob'
      });
      clearInterval(progressTimer);
      setDownloadProgress(100);
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ControlTowerReport.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      clearInterval(progressTimer);
      console.error('Excel download failed:', error);
    } finally {
      setTimeout(() => setDownloadProgress(0), 1000);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visibleHeaders = headers.filter(h => !hiddenHeaders.includes(h));

  const maxVisiblePages = 10;
  const startPage = Math.floor((pageNumber - 1) / maxVisiblePages) * maxVisiblePages + 1;
  const endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="flex-grow-1 text-center">
          <h3 className="report-title m-0">Control Tower Report</h3>
          <p className="text-muted m-0">Total Count: {totalCount}</p>
        </div>
        <div className="text-center">
          {data.length > 0 && (
            <>
              <a href="#" onClick={handleExcelDownload} className="excel-icon-link" title="Download Excel">
                <img src={excelImg} alt="Export to Excel" className="excel-icon" />
              </a>
              {downloadProgress > 0 && (
                <div className="mt-1" style={{ width: '100px' }}>
                  <small>Downloading: {downloadProgress}%</small>
                  <div className="progress" style={{ height: '6px' }}>
                    <div className="progress-bar" role="progressbar" style={{ width: `${downloadProgress}%` }}></div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* <div className="mb-3 d-flex gap-2 align-items-end">
        <div style={{ width: '300px' }}>
         <GenericDropdown
          dropdownOptions={zoneOptions}
          placeholder="Select Zones"
          onChange={(values) => {
            setSelectedZones(values || []); 
            fetchBranches(values || []);
          }}
        />
        </div>
        <div style={{ width: '220px' }}>
          <GenericDropdown
            dropdownOptions={branchOptions}
            placeholder="Select Branch"
            onChange={(values) => {
              setSelectedBranch(values || []);
              fetchRiders(values || []);
            }}
          />
        </div>
        <div style={{ width: '300px' }}>
          <GenericDropdown
            dropdownOptions={riderOptions}
            placeholder="Select Rider"
            onChange={(values) => setSelectedrider(values || [])}
          />
        </div>
        <div style={{ width: '300px' }}>
          <input type="text" className="form-control account-input small-text" placeholder="Enter Account Numbers" value={accountNumbersText} onChange={(e) => setAccountNumbersText(e.target.value)} />
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn btn-primary" onClick={handleSearch}>Search</button>
        </div>
      </div> */}

      <div className="mb-3 d-flex align-items-end flex-wrap gap-2">
  <div style={{ width: '170px' }}>
    <DatePicker
      selected={startDate}
      onChange={(date) => setStartDate(date)}
      dateFormat="MM/dd/yyyy"
      placeholderText="Start Date"
      className="form-control"
    />
  </div>

  <div style={{ width: '170px' }}>
    <DatePicker
      selected={endDate}
      onChange={(date) => setEndDate(date)}
      dateFormat="MM/dd/yyyy"
      placeholderText="End Date"
      className="form-control"
    />
  </div>

  <div style={{ width: '200px' }}>
    <GenericDropdown
      dropdownOptions={zoneOptions}
      placeholder="Zones"
      onChange={(values) => {
        setSelectedZones(values || []);
        fetchBranches(values || []);
        fetchRiders(values || []);
      }}
    />
  </div>

  <div style={{ width: '180px' }}>
    <GenericDropdown
      dropdownOptions={branchOptions}
      placeholder="Branch"
      onChange={(values) => {
        setSelectedBranch(values || []);
        fetchRiders(values || []);
      }}
    />
  </div>

  <div style={{ width: '200px' }}>
    <GenericDropdown
      dropdownOptions={riderOptions}
      placeholder="Rider"
      onChange={(values) => setSelectedrider(values || [])}
    />
  </div>

  <div style={{ width: '200px' }}>
    <input
      type="text"
      className="form-control"
      placeholder="Enter Account Number"
      value={accountNumbersText}
      onChange={(e) => setAccountNumbersText(e.target.value)}
    />
  </div>

  <div style={{ width: '120px' }}>
    <button className="btn btn-primary w-100" onClick={handleSearch}>
      Search
    </button>
  </div>
</div>


      {loading ? (
        <p>Loading data...</p>
      ) : (
        <>
          <div className="table-responsive-wrapper mb-3">
            <table className="table table-bordered table-hover">
              <thead className="table-dark">
                <tr>
                  <th>S.No.</th>
                  {visibleHeaders.map((header, i) => (
                    <th key={i}>{header}</th>
                  ))}
                </tr>
              </thead>
            <tbody>
  {data
    .filter(row => row.Zone !== 'Grand Total') // ✅ Filter out "Grand Total"
    .map((row, rowIndex) => (
      <tr key={rowIndex}>
        <td>{(pageNumber - 1) * pageSize + rowIndex + 1}</td>
        {visibleHeaders.map((col, colIndex) => {
          const cellValue = formatValue(row[col]);
          return (
            <td key={colIndex}>{cellValue}</td>
          );
        })}
      </tr>
    ))}
</tbody>

            </table>
          </div>

          <div className="d-flex justify-content-between align-items-center mt-3">
            <div>
              <label className="me-2"><strong>Page Size:</strong></label>
              <select className="form-select form-select-sm w-auto d-inline-block" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPageNumber(1); }}>
                {[50, 100, 500, 1000].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
        <div>
  {startPage > 1 && (
    <button
      className="btn btn-sm btn-outline-secondary mx-1"
      onClick={() => setPageNumber(startPage - 1)}
    >
      &lt;&lt;
    </button>
  )}
  {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((num) => (
    <button
      key={num}
      className={`btn btn-sm mx-1 ${num === pageNumber ? 'btn-primary' : 'btn-outline-primary'}`}
      onClick={() => setPageNumber(num)}
    >
      {num}
    </button>
  ))}
  {endPage < totalPages && (
    <button
      className="btn btn-sm btn-outline-secondary mx-1"
      onClick={() => setPageNumber(endPage + 1)}
    >
      &gt;&gt;
    </button>
  )}
</div>
          </div>
        </>
      )}
    </div>
  );
}

function formatValue(value) {
  if (value === null || value === '') return '-';
  if (typeof value === 'string' && value.includes('T00:00:00')) {
    return new Date(value).toLocaleDateString();
  }
  return value;
}

export default ControlTower;
