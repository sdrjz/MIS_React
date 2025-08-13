import React, { useEffect, useState } from 'react';
import axios from '../utils/axios';
import './QSRBankReport.css';
import excelImg from '../assets/images/ExcelFile.png';
import loaderGif from '../assets/images/Loader.gif';

function QSRBankReport() {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [pageSize, setPageSize] = useState(50);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const [hasSearched, setHasSearched] = useState(false);

  const filters = {
    StartDate: '01/01/2025',
    EndDate: '01/31/2025',
    OriginBranch: '4',
    DestinationZone: 'ALL',
    DestinationBranch: 'ALL',
    AccountNumbers: '300002',
    ProductType: 'Domestic',
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/Operations/BankQSRReport', {
          params: {
            ...filters,
            PageSize: pageSize,
            PageNumber: pageNumber,
            IsExport: false
          }
        });

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

    fetchData();
  }, [pageSize, pageNumber]);

  const handleExcelDownload = async (e) => {
    e.preventDefault();
    let fakeProgress = 1;
    setDownloadProgress(fakeProgress);

    const progressTimer = setInterval(() => {
      fakeProgress += 1;
      if (fakeProgress < 95) {
        setDownloadProgress(fakeProgress);
      }
    }, 100);

    try {
      const response = await axios.get('/api/Operations/DownloadBankQSRExcel', {
        params: filters,
        responseType: 'blob'
      });

      clearInterval(progressTimer);
      setDownloadProgress(100);

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'BankQSRReport.xlsx';
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

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="flex-grow-1 text-center">
          <h3 className="report-title m-0">Bank QSR Report</h3>
          {/* <p className="text-muted m-0">Total Count: {totalCount}</p> */}
          {hasSearched && <p className="text-muted m-0">Total Count: {totalCount}</p>}
        </div>
        <div className="text-center">
          {data.length > 0 && (
            <>
              <a
                href="#"
                onClick={handleExcelDownload}
                className="excel-icon-link"
                title="Download Excel"
              >
                <img
                  src={excelImg}
                  alt="Export to Excel"
                  className="excel-icon"
                />
              </a>
              {downloadProgress > 0 && (
                <div className="mt-1" style={{ width: '100px' }}>
                  <small>Downloading: {downloadProgress}%</small>
                  <div className="progress" style={{ height: '6px' }}>
                    <div
                      className="progress-bar"
                      role="progressbar"
                      style={{ width: `${downloadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {loading ? (
        <div className="text-center my-4">
          <img src={loaderGif} alt="Loading..." style={{ width: '80px' }} />
          <p className="mt-2">Loading data...</p>
        </div>
      ) : (
        <>
          <div className="table-responsive-wrapper mb-3">
            <table className="table table-bordered table-hover">
              <thead className="table-dark">
                <tr>
                  <th>S.No.</th>
                  {headers.map((header, i) => (
                    <th key={i}>{header}</th>
                  ))}
                </tr>
              </thead>
           <tbody>
              {hasSearched && data.length > 0 && data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td>{(pageNumber - 1) * pageSize + rowIndex + 1}</td>
                  {headers.map((col, colIndex) => (
                    <td key={colIndex}>{formatValue(row[col])}</td>
                  ))}
                </tr>
              ))}

              {hasSearched && data.length === 0 && (
                <tr>
                  <td colSpan={headers.length + 1} className="text-center text-muted">
                    No records found
                  </td>
                </tr>
              )}
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
                {[50, 100, 500, 1000].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>

            <div>
              {pageNumbers.map((num) => (
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

export default QSRBankReport;
