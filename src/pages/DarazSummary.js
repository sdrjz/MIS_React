import React, { useEffect, useState } from 'react';
import axios from '../utils/axios';
import './Common.css';
import excelImg from '../assets/images/ExcelFile.png';
import GenericDropdown from '../components/GenericDropdown';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import loaderGif from '../assets/images/Loader.gif';

function DarazSummary() {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [pageSize, setPageSize] = useState(50);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [accountNumberOptions, setAccountNumberOptions] = useState([]);
  const [selectedAccountNumber, setSelectedAccountNumber] = useState(null);
  const [searchText, setSearchText] = useState('');
  const hiddenHeaders = ['zoneCode'];
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  const [hasSearched, setHasSearched] = useState(false);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  useEffect(() => {
    const fetchAccountNumbers = async () => {
      try {
        const res = await axios.get('/api/GenericDropDown/GetAccoutNo');
        const data = res.data.data || [];
        const formatted = data.map((item) => ({ value: item.Id, label: item.Label }));
        setAccountNumberOptions(formatted);
      } catch (err) {
        console.error('Error fetching account numbers:', err);
      }
    };
    fetchAccountNumbers();
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      handleSearch();
    }
  }, [pageNumber, pageSize]);

  const handleSearch = async () => {
    if (!startDate || !endDate || !selectedAccountNumber) {
      alert('Please select Start Date, End Date, and Report Type.');
      return;
    }

    setLoading(true);
    try {
      const filters = {
        StartDate: startDate.toLocaleDateString('en-CA'),
        EndDate: endDate.toLocaleDateString('en-CA'),
        AccountDropdown: selectedAccountNumber?.value,
        PageNumber: pageNumber,
        PageSize: pageSize,
        IsExport: false
      };

      const res = await axios.get('/api/COD/DarazSummary', { params: filters });
      if (res.data.isSuccess) {
        const result = res.data.data || [];
        setData(result);
        setHeaders(result.length > 0 ? Object.keys(result[0]) : []);
        setTotalCount(res.data.totalCount || result.length);
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
        StartDate: startDate.toLocaleDateString('en-CA'),
        EndDate: endDate.toLocaleDateString('en-CA'),
        AccountDropdown: selectedAccountNumber?.value,
        PageNumber: pageNumber,
        PageSize: pageSize,
        IsExport: true
      };

      const response = await axios.get('/api/COD/DarazSummaryExcel', {
        params: filters,
        responseType: 'blob'
      });

      clearInterval(progressTimer);
      setDownloadProgress(100);
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'DarazSummaryReport.xlsx';
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

  const visibleHeaders = headers.filter(h => !hiddenHeaders.includes(h));
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="flex-grow-1 text-center">
          <h3 className="report-title m-0">Customer Summary Report</h3>
          {/* <p className="text-muted m-0">Total Count: {totalCount}</p> */}
          {hasSearched && <p className="text-muted m-0">Total Count: {totalCount}</p>}
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

      {/* Filter section */}
      <div className="p-3 border rounded mb-3">
        <div className="d-flex align-items-end flex-wrap gap-2">
          <div style={{ width: '170px' }}>
            <label className="form-label">Start Date</label>
            <DatePicker selected={startDate} onChange={setStartDate} dateFormat="MM/dd/yyyy" className="form-control" />
          </div>
          <div style={{ width: '170px' }}>
            <label className="form-label">End Date</label>
            <DatePicker selected={endDate} onChange={setEndDate} dateFormat="MM/dd/yyyy" className="form-control" />
          </div>
          <div style={{ width: '200px' }}>
            <label className="form-label">Report Type</label>
            <GenericDropdown
              dropdownOptions={accountNumberOptions}
              placeholder="Select Report Type"
              onChange={setSelectedAccountNumber}
            />
          </div>
        </div>

        <div className="mt-3 text-end">
          <button className="btn btn-primary" onClick={handleSearch}>Search</button>
        </div>
      </div>

      {/* Search box below filters, right aligned */}
      <div className="d-flex justify-content-end mb-3">
        <div style={{ width: '220px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search in all columns"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center my-4">
          <img src={loaderGif} alt="Loading..." style={{ width: '80px' }} />
          <p className="mt-2">Loading data...</p>
        </div>
      ) : (
        <>
          <div className="table-responsive-wrapper mb-3 table-wrapper-fixed-height">
            <table className="table table-bordered table-hover">
              {data.length > 0 && (
                <thead className="table-dark">
                  <tr>
                    <th>S.No.</th>
                    {visibleHeaders.map((header, i) => (
                      <th
                        key={i}
                        onClick={() => handleSort(header)}
                        style={{ cursor: 'pointer' }}
                      >
                        {header} {sortColumn === header && (sortDirection === 'asc' ? ' 🔼' : ' 🔽')}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {hasSearched && data
                  .filter(row =>
                    !searchText.trim() ||
                    visibleHeaders.some(col => row[col]?.toString().toLowerCase().includes(searchText.toLowerCase()))
                  )
                  .map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      <td>{(pageNumber - 1) * pageSize + rowIndex + 1}</td>
                      {visibleHeaders.map((col, colIndex) => (
                        <td key={colIndex}>{formatValue(row[col])}</td>
                      ))}
                    </tr>
                  ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={visibleHeaders.length + 1} className="text-center text-muted">
                      No records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {data.length > 0 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div>
                <label className="me-2"><strong>Page Size:</strong></label>
                <select
                  className="form-select form-select-sm w-auto d-inline-block"
                  value={pageSize}
                  onChange={(e) => {
                    const newSize = Number(e.target.value);
                    setPageSize(newSize);
                    setPageNumber(1);
                  }}
                >
                  {[50, 100, 500, 1000].map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
              <div>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
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
          )}
        </>
      )}
    </div>
  );
}

function formatValue(value) {
  if (value === null || value === '') return '-';
  if (typeof value === 'string' && value.includes('T00:00:00')) return new Date(value).toLocaleDateString();
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
}

export default DarazSummary;
