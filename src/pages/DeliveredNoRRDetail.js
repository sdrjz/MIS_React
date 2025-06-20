import React, { useEffect, useState, useRef } from 'react';
import axios from '../utils/axios';
import './DeliveredNoRRDetail.css';
import excelImg from '../assets/images/ExcelFile.png';



function DeliveredNoRRDetail() {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [pageSize, setPageSize] = useState(50);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const lastRequestRef = useRef(null);

  const fetchData = async (filters) => {
    const request = {
      ZoneCode: filters.ZoneCode,
      BranchCode: filters.BranchCode,
      RiderCode: filters.RiderCode,
      AccountNumbers: filters.AccountNumbers,
      PageNumber: pageNumber,
      PageSize: pageSize,
      IsExport: false,
      field: filters.field,
      value: filters.value
    };

    const currentRequest = JSON.stringify(request);
    if (lastRequestRef.current === currentRequest) {
      console.log('Skipping API call. Same filters.');
      return;
    }

    lastRequestRef.current = currentRequest;

    setLoading(true);
    try {
      const res = await axios.post('/api/COD/DeliveredNoRRDetail', request);
      if (res.data.isSuccess && res.data.data?.length > 0) {
        setData(res.data.data);
        setHeaders(Object.keys(res.data.data[0]));
        setTotalCount(res.data.totalCount || res.data.data.length);
      } else {
        setData([]);
        setHeaders([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('Error fetching detail data:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    const stored = sessionStorage.getItem('DeliveredNoRRDetailParams');
    if (!stored) return;

    const filters = JSON.parse(stored);
    fetchData(filters);
  }, [pageNumber, pageSize]);

  const handleExcelDownload = async (e) => {
    e.preventDefault();
    let fakeProgress = 1;
    setDownloadProgress(fakeProgress);

    const progressTimer = setInterval(() => {
      fakeProgress += 1;
      if (fakeProgress < 95) setDownloadProgress(fakeProgress);
    }, 100);

    try {
      const stored = sessionStorage.getItem('DeliveredNoRRDetailParams');
      if (!stored) return;

      const filters = JSON.parse(stored);
      filters.IsExport = true;
      filters.PageNumber = 1;      // ✅ full export
      filters.PageSize = 9999;     // ✅ full export

      const response = await axios.get('/api/COD/DeliveredNoRRDetailReportExcel', {
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
      link.download = 'DeliveredNoRRDetailReport.xlsx';
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

  const formatValue = (val) => {
    if (val === null || val === '') return '-';
    if (typeof val === 'string' && val.includes('T00:00:00')) {
      return new Date(val).toLocaleDateString();
    }
    return val;
  };

  const totalPages = Math.ceil(totalCount / pageSize);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  const maxVisiblePages = 10;
    const startPage = Math.floor((pageNumber - 1) / maxVisiblePages) * maxVisiblePages + 1;
    const endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);

  return (
    <div className="p-4">
      {/* <h3 className="text-center mb-3">Delivered No RR Detail Report</h3>
      <p className="text-center text-muted">Total Count: {totalCount}</p>

      <div className="text-center">
        {data.length > 0 && (
          <>
            <a href="#" onClick={handleExcelDownload} className="excel-icon-link" title="Download Excel">
              <img src={excelImg} alt="Export to Excel" className="excel-icon" />
            </a>
            {downloadProgress > 0 && (
              <div className="mt-1" style={{ width: '100px', margin: '0 auto' }}>
                <small>Downloading: {downloadProgress}%</small>
                <div className="progress" style={{ height: '6px' }}>
                  <div className="progress-bar" role="progressbar" style={{ width: `${downloadProgress}%` }}></div>
                </div>
              </div>
            )}
          </>
        )}
      </div> */}

        <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="flex-grow-1 text-center">
          <h3 className="report-title m-0">Delivered No RR Detail Report</h3>
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

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="table-responsive mb-3">
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
                {data.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td>{(pageNumber - 1) * pageSize + rowIndex + 1}</td>
                    {headers.map((col, colIndex) => (
                      <td key={colIndex}>{formatValue(row[col])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-between align-items-center">
            <div>
              <label><strong>Page Size:</strong></label>
              <select
                className="form-select form-select-sm w-auto d-inline-block ms-2"
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

export default DeliveredNoRRDetail;
