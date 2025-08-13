import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from '../utils/axios';
import './Common.css';
import excelImg from '../assets/images/ExcelFile.png';
import GenericDropdown from '../components/GenericDropdown';
import 'react-datepicker/dist/react-datepicker.css';
import loaderGif from '../assets/images/Loader.gif';

function RiderMasterData() {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [pageSize, setPageSize] = useState(50);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const [zoneOptions, setZoneOptions] = useState([]);
  const [branchOptions, setBranchOptions] = useState([]);
  const [regionOptions, setRegionOptions] = useState([]);

  const [selectedRegions, setSelectedRegions] = useState([]); // array of IDs
  const [selectedZones, setSelectedZones] = useState([]);     // array of IDs
  const [selectedBranch, setSelectedBranch] = useState([]);   // array of IDs

  const [searchText, setSearchText] = useState('');
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  const [hasSearched, setHasSearched] = useState(false);
  const skipNextFetch = useRef(false);

  const hiddenHeaders = ['zoneCode'];

  const toIds = (vals) => (vals || []).map(v => (v && typeof v === 'object' ? v.value : v));

  // Load regions on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get('/api/GenericDropDown/region');
        const formatted = res.data.data?.map(it => ({ value: it.Id, label: it.Label })) || [];
        setRegionOptions(formatted);
      } catch (err) {
        console.error('Error fetching region options:', err);
      }
    })();
  }, []);

  // Load zones for selected regions
  const fetchZones = async (regionIds = []) => {
    try {
      const res = await axios.get(`/api/GenericDropDown/zone?parentId=${regionIds.join(',')}`);
      const formatted = res.data.data?.map(it => ({ value: it.Id, label: it.Label })) || [];
      setZoneOptions(formatted);
    } catch (err) {
      console.error('Error fetching zone options:', err);
    }
  };

  // Load branches for selected zones
  const fetchBranches = async (zoneIds = []) => {
    try {
      const res = await axios.get(`/api/GenericDropDown/branch?parentId=${zoneIds.join(',')}`);
      const formatted = res.data.data?.map(it => ({ value: it.Id, label: it.Label })) || [];
      setBranchOptions(formatted);
    } catch (err) {
      console.error('Error fetching branch options:', err);
    }
  };

  // Total pages (never below 1)
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((totalCount || 0) / pageSize)),
    [totalCount, pageSize]
  );

  // Refetch on page/pageSize change AFTER first search
  useEffect(() => {
    if (!hasSearched) return;
    if (skipNextFetch.current) { skipNextFetch.current = false; return; }
    fetchData(pageNumber, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber, pageSize]);

  // If total pages shrink, correct pageNumber without second request
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
    setLoading(true);
    try {
      const filters = {
        Region: selectedRegions.length ? selectedRegions.join(',') : null,
        ZoneCode: selectedZones.length ? selectedZones.join(',') : null,
        BranchCode: selectedBranch.length ? selectedBranch.join(',') : null,
        PageNumber: page,
        PageSize: size,
        IsExport: false
      };

      const res = await axios.get('/api/Master/RiderMasterData', { params: filters });

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
    if (!selectedRegions.length && !selectedZones.length && !selectedBranch.length) {
      // optional: allow empty filters; remove this check if not desired
    }
    if (!hasSearched) setHasSearched(true);
    if (pageNumber !== 1) setPageNumber(1); else await fetchData(1, pageSize);
  };

  const handleExcelDownload = async (e) => {
    e.preventDefault();

    let fake = 1;
    setDownloadProgress(fake);
    const timer = setInterval(() => { fake += 1; if (fake < 95) setDownloadProgress(fake); }, 100);

    try {
      const filters = {
        Region: selectedRegions.length ? selectedRegions.join(',') : null,
        ZoneCode: selectedZones.length ? selectedZones.join(',') : null,
        BranchCode: selectedBranch.length ? selectedBranch.join(',') : null,
        PageNumber: pageNumber,
        PageSize: pageSize,
        IsExport: true
      };

      const response = await axios.get('/api/Master/RiderMasterDataExcel', {
        params: filters,
        responseType: 'blob'
      });

      clearInterval(timer);
      setDownloadProgress(100);

      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'RiderMasterData.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      clearInterval(timer);
      console.error('Excel download failed:', error);
    } finally {
      setTimeout(() => setDownloadProgress(0), 1000);
    }
  };

  // Sorting + filtering
  const handleSort = (column) => {
    if (sortColumn === column) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    else { setSortColumn(column); setSortDirection('asc'); }
  };

  const visibleHeaders = useMemo(
    () => headers.filter(h => !hiddenHeaders.includes(h)),
    [headers]
  );

  const filteredRows = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return data;
    return data.filter(row =>
      visibleHeaders.some(col => String(row[col] ?? '').toLowerCase().includes(q))
    );
  }, [data, visibleHeaders, searchText]);

  const sortedRows = useMemo(() => {
    if (!sortColumn) return filteredRows;
    const copy = [...filteredRows];
    copy.sort((a, b) => {
      const A = String(a[sortColumn] ?? '');
      const B = String(b[sortColumn] ?? '');
      return sortDirection === 'asc' ? A.localeCompare(B) : B.localeCompare(A);
    });
    return copy;
  }, [filteredRows, sortColumn, sortDirection]);

  // Block pager
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
          <h3 className="report-title m-0">Rider Master Data Report</h3>
          {/* Total Count only AFTER first search */}
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
            <label className="form-label">Region</label>
            <GenericDropdown
              dropdownOptions={regionOptions}
              placeholder="Region"
              onChange={(values) => {
                const ids = toIds(values);
                setSelectedRegions(ids);
                if (!ids.length) {
                  setZoneOptions([]); setSelectedZones([]);
                  setBranchOptions([]); setSelectedBranch([]);
                  return;
                }
                fetchZones(ids);
                setSelectedZones([]); setBranchOptions([]); setSelectedBranch([]);
              }}
            />
          </div>

          <div style={{ width: '200px' }}>
            <label className="form-label">Zones</label>
            <GenericDropdown
              dropdownOptions={zoneOptions}
              placeholder="Zones"
              onChange={(values) => {
                const ids = toIds(values);
                setSelectedZones(ids);
                fetchBranches(ids);
              }}
            />
          </div>

          <div style={{ width: '180px' }}>
            <label className="form-label">Branch</label>
            <GenericDropdown
              dropdownOptions={branchOptions}
              placeholder="Branch"
              onChange={(values) => setSelectedBranch(toIds(values))}
            />
          </div>
        </div>
        <div className="mt-3 text-end">
          <button className="btn btn-primary" onClick={handleSearch}>Search</button>
        </div>
      </div>

      <div style={{ width: '220px', marginLeft: 'auto', marginBottom: '10px' }}>
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
                {sortedRows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td>{(pageNumber - 1) * pageSize + rowIndex + 1}</td>
                    {visibleHeaders.map((col, colIndex) => (
                      <td key={colIndex}>{formatValue(row[col])}</td>
                    ))}
                  </tr>
                ))}

                {/* "No records found" only AFTER first search */}
                {hasSearched && !loading && sortedRows.length === 0 && (
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
                  {[50, 100, 500, 1000].map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>

              <div className="d-flex flex-wrap">
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

export default RiderMasterData;
