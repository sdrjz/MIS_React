import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from '../utils/axios';
import './DeliveredNoRRDetail.css';
import excelImg from '../assets/images/ExcelFile.png';
import loaderGif from '../assets/images/Loader.gif';

function DeliveredNoRRDetail() {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);

  const [pageSize, setPageSize] = useState(50);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const lastRequestRef = useRef(null);
  const skipNextFetch = useRef(false);

  const [hasSearched, setHasSearched] = useState(false);

  const hiddenHeaders = ['zoneCode'];
  const visibleHeaders = useMemo(
    () => headers.filter(h => !hiddenHeaders.includes(h)),
    [headers]
  );

  // ---- Safe totalCount helper (prevents pager disappearing) ----
  const updateTotalCountSafe = (countRaw, rowsLen, page, size) => {
    setTotalCount(prev => {
      const n = Number(countRaw);
      if (Number.isFinite(n) && n >= 0) {
        if (n === 0 && rowsLen > 0) return prev || ((page - 1) * size + rowsLen);
        return n;
      }
      if (rowsLen > 0) {
        const lowerBound = (page - 1) * size + rowsLen;
        return Math.max(prev, lowerBound);
      }
      return prev;
    });
  };

  // ---- Core fetch (uses filters from sessionStorage) ----
  const fetchData = async (filters) => {
    if (!filters) return;

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
      // Same filters & paging — skip duplicate call
      return;
    }
    lastRequestRef.current = currentRequest;

    setLoading(true);
    try {
      const res = await axios.post('/api/COD/DeliveredNoRRDetail', request);

      const rows = res?.data?.data ?? [];
      setData(rows);
      setHeaders(rows.length ? Object.keys(rows[0]) : []);

      const countRaw =
        res?.data?.totalCount ??
        res?.data?.TotalCount ??
        res?.data?.data?.totalCount ??
        res?.data?.Data?.TotalCount;

      updateTotalCountSafe(countRaw, rows.length, pageNumber, pageSize);
    } catch (error) {
      console.error('Error fetching detail data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ---- Load filters from session & fetch on page/pageSize AFTER first load ----
  useEffect(() => {
    const stored = sessionStorage.getItem('DeliveredNoRRDetailParams');
    if (!stored) return;
    const filters = JSON.parse(stored);

    // mark that we've "searched" (navigated from parent) so UI shows count/pager
    if (!hasSearched) setHasSearched(true);

    if (skipNextFetch.current) { skipNextFetch.current = false; return; }
    fetchData(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber, pageSize]);

  // ---- Total pages & correction (prevents pager vanishing) ----
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((totalCount || 0) / pageSize)),
    [totalCount, pageSize]
  );

  useEffect(() => {
    if (pageNumber > totalPages) {
      skipNextFetch.current = true;  // don't re-fetch right away
      setPageNumber(totalPages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  // ---- Excel ----
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
      const exportParams = {
        ...filters,
        IsExport: true,
        PageNumber: 1,   // full export
        PageSize: 9999
      };

      const response = await axios.get('/api/COD/DeliveredNoRRDetailReportExcel', {
        params: exportParams,
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

  // ---- Pager (10 at a time) ----
  const maxVisiblePages = 10;
  const blockStart = Math.floor((pageNumber - 1) / maxVisiblePages) * maxVisiblePages + 1;
  const blockEnd = Math.min(blockStart + maxVisiblePages - 1, totalPages);

  const goToPage = (p) => {
    if (p < 1 || p > totalPages || p === pageNumber) return;
    setPageNumber(p);
  };

  const formatValue = (val) => {
    if (val === null || val === '') return '-';
    if (typeof val === 'string' && val.includes('T00:00:00')) {
      return new Date(val).toLocaleDateString();
    }
    return val;
  };

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="flex-grow-1 text-center">
          <h3 className="report-title m-0">Delivered No RR Detail Report</h3>
          {/* Show Total Count only AFTER first load/search */}
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

      {loading ? (
        <div className="text-center my-4">
          <img src={loaderGif} alt="Loading..." style={{ width: '80px' }} />
          <p className="mt-2">Loading data...</p>
        </div>
      ) : (
        <>
          <div className="table-responsive mb-3">
            <table className="table table-bordered table-hover">
              {visibleHeaders.length > 0 && (
                <thead className="table-dark">
                  <tr>
                    <th>S.No.</th>
                    {visibleHeaders.map((header, i) => (
                      <th key={i}>{header}</th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {data.length > 0 && data.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td>{(pageNumber - 1) * pageSize + rowIndex + 1}</td>
                    {visibleHeaders.map((col, colIndex) => (
                      <td key={colIndex}>{formatValue(row[col])}</td>
                    ))}
                  </tr>
                ))}

                {/* "No records found" only AFTER we have loaded once */}
                {hasSearched && !loading && data.length === 0 && (
                  <tr>
                    <td colSpan={visibleHeaders.length + 1} className="text-center text-muted">
                      No records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Page size + pager only after first load and if we have results/known count */}
          {hasSearched && (totalCount > 0 || data.length > 0) && (
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <label className="me-2"><strong>Page Size:</strong></label>
                <select
                  className="form-select form-select-sm w-auto d-inline-block"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                >
                  {[50, 100, 500, 1000].map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>

              <div className="d-flex flex-wrap">
                {blockStart > 1 && (
                  <button
                    className="btn btn-sm btn-outline-secondary mx-1"
                    onClick={() => goToPage(blockStart - 1)}
                  >
                    &laquo;
                  </button>
                )}
                {Array.from({ length: blockEnd - blockStart + 1 }, (_, i) => blockStart + i).map((num) => (
                  <button
                    key={num}
                    className={`btn btn-sm mx-1 ${num === pageNumber ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => goToPage(num)}
                  >
                    {num}
                  </button>
                ))}
                {blockEnd < totalPages && (
                  <button
                    className="btn btn-sm btn-outline-secondary mx-1"
                    onClick={() => goToPage(blockEnd + 1)}
                  >
                    &raquo;
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default DeliveredNoRRDetail;
