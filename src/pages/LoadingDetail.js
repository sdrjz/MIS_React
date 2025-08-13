// Enhanced LoadingDetail with stable paging, hidden count before search, and resilient "No records found"
import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from '../utils/axios';
import './Common.css';
import excelImg from '../assets/images/ExcelFile.png';
import GenericDropdown, { SimpleDropdown } from '../components/GenericDropdown';
import loaderGif from '../assets/images/Loader.gif';

function MainMethod() {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [pageSize, setPageSize] = useState(50);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const [ReportTypeSearchOptions, setReportTypeSearchOptions] = useState([]);
  const [selectedReportTypeSearch, setSelectedReportTypeSearch] = useState(null);
  const [LoadingNoText, setLoadingNoText] = useState('');
  const [searchText, setSearchText] = useState('');

  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  const hiddenHeaders = ['zoneCode'];
  const [hasSearched, setHasSearched] = useState(false);

  // prevent duplicate fetch when correcting page programmatically
  const skipNextFetch = useRef(false);

  useEffect(() => {
    axios.get('/api/GenericDropDown/ReportTypeSearch').then(res => {
      const data = res.data.data || [];
      setReportTypeSearchOptions(data.map(item => ({ value: item.Id, label: item.Label })));
    });
  }, []);

  // total pages (never below 1)
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((totalCount || 0) / pageSize)),
    [totalCount, pageSize]
  );

  // Fetch on page/pageSize change AFTER first search
  useEffect(() => {
    if (!hasSearched) return;
    if (skipNextFetch.current) { skipNextFetch.current = false; return; }
    fetchData(pageNumber, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber, pageSize]);

  // If total pages shrink, correct page without causing a second request
  useEffect(() => {
    if (pageNumber > totalPages) {
      skipNextFetch.current = true;
      setPageNumber(totalPages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

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

  const fetchData = async (page, size) => {
    if (!selectedReportTypeSearch) return;

    setLoading(true);
    try {
      const filters = {
        LoadingNoText: LoadingNoText || null,
        ReportTypeSearch: selectedReportTypeSearch.value,
        PageNumber: page,
        PageSize: size,
        IsExport: false
      };

      const res = await axios.get('/api/Operations/LoadingDetail', { params: filters });

      const rows = res?.data?.data ?? [];
      setData(rows);
      setHeaders(rows.length ? Object.keys(rows[0]) : []);

      const countRaw =
        res?.data?.totalCount ??
        res?.data?.TotalCount ??
        res?.data?.data?.totalCount ??
        res?.data?.Data?.TotalCount;

      updateTotalCountSafe(countRaw, rows.length, page, size);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!selectedReportTypeSearch) return alert('Please select Report Type.');
    if (!hasSearched) setHasSearched(true);

    if (pageNumber !== 1) {
      setPageNumber(1);
    } else {
      await fetchData(1, pageSize);
    }
  };

  const handleExcelDownload = async (e) => {
    e.preventDefault();
    if (!selectedReportTypeSearch) return alert('Please select Report Type.');

    let fakeProgress = 1;
    setDownloadProgress(fakeProgress);
    const progressTimer = setInterval(() => {
      fakeProgress += 1;
      if (fakeProgress < 95) setDownloadProgress(fakeProgress);
    }, 100);

    try {
      const filters = {
        LoadingNoText: LoadingNoText || null,
        ReportTypeSearch: selectedReportTypeSearch?.value || null,
        PageNumber: pageNumber,
        PageSize: pageSize,
        IsExport: true
      };

      const response = await axios.get('/api/Operations/LoadingDetailExcel', {
        params: filters,
        responseType: 'blob'
      });

      clearInterval(progressTimer);
      setDownloadProgress(100);

      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'LoadingDetail.xlsx';
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

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortColumn) return data;
    const copy = [...data];
    copy.sort((a, b) => {
      const valA = String(a[sortColumn] ?? '');
      const valB = String(b[sortColumn] ?? '');
      return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
    return copy;
  }, [data, sortColumn, sortDirection]);

  const filteredData = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return sortedData;
    return sortedData.filter(row =>
      (headers || []).some(col => String(row[col] ?? '').toLowerCase().includes(q))
    );
  }, [sortedData, headers, searchText]);

  const visibleHeaders = useMemo(
    () => headers.filter(h => !hiddenHeaders.includes(h)),
    [headers]
  );

  const maxVisiblePages = 10;
  const blockStart = Math.floor((pageNumber - 1) / maxVisiblePages) * maxVisiblePages + 1;
  const blockEnd = Math.min(blockStart + maxVisiblePages - 1, totalPages);

  const goToPage = (p) => {
    if (p < 1 || p > totalPages || p === pageNumber) return;
    setPageNumber(p);
  };

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="flex-grow-1 text-center">
          <h3 className="report-title m-0">Loading Detail</h3>
          {/* Show Total Count only after first search */}
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

      {/* Filters */}
      <div className="p-3 border rounded mb-3">
        <div className="d-flex align-items-end flex-wrap gap-2">
          <div style={{ width: '200px' }}>
            <label className="form-label">Loading No</label>
            <input
              type="text"
              className="form-control"
              placeholder="Loading No"
              value={LoadingNoText}
              onChange={(e) => setLoadingNoText(e.target.value)}
            />
          </div>
          <div style={{ width: '220px' }}>
            <label className="form-label">Report Type</label>
            <SimpleDropdown dropdownOptions={ReportTypeSearchOptions} onChange={setSelectedReportTypeSearch} />
          </div>
        </div>
        <div className="mt-3 text-end">
          <button className="btn btn-primary" onClick={handleSearch}>Search</button>
        </div>
      </div>

      <div className="mb-2 text-end" style={{ width: '220px', marginLeft: 'auto' }}>
        <input
          type="text"
          className="form-control"
          placeholder="Search in all columns"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value.toLowerCase())}
        />
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
              {visibleHeaders.length > 0 && (
                <thead className="table-dark">
                  <tr>
                    <th>S.No.</th>
                    {visibleHeaders.map((header, i) => (
                      <th key={i} onClick={() => handleSort(header)} style={{ cursor: 'pointer' }}>
                        {header}{sortColumn === header && (sortDirection === 'asc' ? ' 🔼' : ' 🔽')}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {filteredData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td>{(pageNumber - 1) * pageSize + rowIndex + 1}</td>
                    {visibleHeaders.map((col, colIndex) => (
                      <td key={colIndex}>{formatValue(row[col])}</td>
                    ))}
                  </tr>
                ))}

                {/* Show "No records found" only AFTER first search */}
                {hasSearched && !loading && filteredData.length === 0 && (
                  <tr>
                    <td colSpan={visibleHeaders.length + 1} className="text-center text-muted">
                      No records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Page size + pager only after first search, and only if results/known count */}
          {hasSearched && (totalCount > 0 || data.length > 0) && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div>
                <label className="me-2"><strong>Page Size:</strong></label>
                <select
                  className="form-select form-select-sm w-auto d-inline-block"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                >
                  {[50, 100, 500, 1000].map(size => <option key={size} value={size}>{size}</option>)}
                </select>
              </div>

              <div className="d-flex flex-wrap">
                {/* block pager with « » */}
                {blockStart > 1 && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary mx-1"
                    onClick={() => goToPage(blockStart - 1)}
                  >
                    &laquo;
                  </button>
                )}

                {Array.from({ length: blockEnd - blockStart + 1 }, (_, i) => blockStart + i).map(num => (
                  <button
                    type="button"
                    key={num}
                    className={`btn btn-sm mx-1 ${num === pageNumber ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => goToPage(num)}
                  >
                    {num}
                  </button>
                ))}

                {blockEnd < totalPages && (
                  <button
                    type="button"
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

function formatValue(value) {
  if (value === null || value === '') return '-';
  if (typeof value === 'string' && value.includes('T00:00:00')) return new Date(value).toLocaleDateString();
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
}

export default MainMethod;
