import React, { useEffect, useState } from 'react';
import axios from '../utils/axios';
import './Common.css';
import excelImg from '../assets/images/ExcelFile.png';
import GenericDropdown, { SimpleDropdown } from '../components/GenericDropdown';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

function MainMethod() {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [pageSize, setPageSize] = useState(50);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [BagSealNoText, setBagSealNoText] = useState('');
  const [OperationBagSeal, setOperationBagSeal] = useState([]);
  const [selectedOperationBagSeal, setSelectedOperationBagSeal] = useState(null);

  const hiddenHeaders = ['zoneCode'];

  // ✅ Fetch OperationBagSeal Types
  useEffect(() => {
    const fetchOperationBagSeal = async () => {
      try {
        const res = await axios.get('/api/GenericDropDown/OperationBagSeal');
        const data = res.data.data || [];
        const formatted = data.map((item) => ({ value: item.Id, label: item.Label }));
        setOperationBagSeal(formatted);
      } catch (err) {
      }
    };
    fetchOperationBagSeal();
  }, []);

const handleSearch = async () => {
if (!startDate || !endDate) {
  alert('Please select both Start Date and End Date.');
  return;
}
    setLoading(true);
    try {
      const filters = {
        StartDate: startDate.toLocaleDateString('en-CA'), 
        EndDate: endDate.toLocaleDateString('en-CA'), 
        SearchByBagSeal: selectedOperationBagSeal?.value ?? null,
        BagSealText: BagSealNoText ?? null,
        PageNumber: pageNumber,
        PageSize: pageSize,
        IsExport: false
      };

      const res = await axios.get('/api/Operations/BagReport', { params: filters });
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
        StartDate: startDate.toLocaleDateString('en-CA'), 
        EndDate: endDate.toLocaleDateString('en-CA'), 
        SearchByBagSeal: selectedOperationBagSeal?.value ?? null,
        BagSealText: BagSealNoText ?? null,
        PageNumber: pageNumber,
        PageSize: pageSize,
        IsExport: true
      };

      const response = await axios.get('/api/Operations/BagReportExcel', {
        params: filters,
        responseType: 'blob'
      });

      clearInterval(progressTimer);
      setDownloadProgress(100);

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
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

  const totalPages = Math.ceil(totalCount / pageSize);
  const startPage = Math.floor((pageNumber - 1) / 10) * 10 + 1;
  const endPage = Math.min(startPage + 9, totalPages);
  const visibleHeaders = headers.filter(h => !hiddenHeaders.includes(h));

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="flex-grow-1 text-center">
          <h3 className="report-title m-0">Bag Search Report:</h3>
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

         <SimpleDropdown
            dropdownOptions={OperationBagSeal} 
            placeholder="Search Bag Seal"
            onChange={(selected) => setSelectedOperationBagSeal(selected)}
          />

             <div style={{ width: '200px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Bag/Seal No"
            value={BagSealNoText}
            onChange={(e) => setBagSealNoText(e.target.value)}
          />
        </div>

        <div style={{ width: '120px', marginLeft: 'auto' }}>
          <button className="btn btn-primary w-100" onClick={handleSearch}>Search</button>
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
                  .filter(row => row.Zone !== 'Grand Total')
                  .map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      <td>{(pageNumber - 1) * pageSize + rowIndex + 1}</td>
                      {visibleHeaders.map((col, colIndex) => (
                        <td key={colIndex}>{formatValue(row[col])}</td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

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
                {[50, 100, 500, 1000].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>

            <div>
              {startPage > 1 && (
                <button className="btn btn-sm btn-outline-secondary mx-1" onClick={() => setPageNumber(startPage - 1)}>
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
                <button className="btn btn-sm btn-outline-secondary mx-1" onClick={() => setPageNumber(endPage + 1)}>
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
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return value;
}

export default MainMethod;
