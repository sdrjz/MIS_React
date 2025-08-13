import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from '../utils/axios';
import './Common.css';
import excelImg from '../assets/images/ExcelFile.png';
import GenericDropdown, { SimpleDropdown } from '../components/GenericDropdown';
import 'react-datepicker/dist/react-datepicker.css';
import loaderGif from '../assets/images/Loader.gif';

function MainMethod() {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);

  const [pageSize, setPageSize] = useState(50);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const [zoneOptions, setZoneOptions] = useState([]);
  const [selectedZones, setSelectedZones] = useState([]);
  const [branchOptions, setBranchOptions] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState([]);

  const [CODNonCODOptions, setCODNonCODOptions] = useState([]);
  const [selectedCODNonCOD, setSelectedCODNonCOD] = useState(null);

  const [Selectyear, setSelectyear] = useState([]);
  const [selectedSelectyear, setSelectedSelectyear] = useState(null);
  const [SelectMonthOptions, setSelectMonthOptions] = useState([]);
  const [selectedSelectMonth, setSelectedSelectMonth] = useState(null);

  const [searchText, setSearchText] = useState('');
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  const [hasSearched, setHasSearched] = useState(false);
  const [queryKey, setQueryKey] = useState(0); // bump to re-run fetch with current filters

  const hiddenHeaders = ['zoneCode'];

  // Avoid duplicate fetch when correcting page
  const skipNextFetch = useRef(false);
  // Prevent StrictMode double-run on first mount
  const didEffectRunRef = useRef(false);

  const handleSort = (column) => {
    if (sortColumn === column) setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortColumn(column); setSortDirection('asc'); }
  };

  // dropdowns
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get('/api/GenericDropDown/Selectyear');
        const data = res.data.data || [];
        setSelectyear(data.map((x) => ({ value: x.Id, label: x.Label })));
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get('/api/GenericDropDown/SelectMonth');
        const data = res.data.data || [];
        setSelectMonthOptions(data.map((x) => ({ value: x.Id, label: x.Label })));
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get('/api/GenericDropDown/zone');
        const data = res.data.data || [];
        setZoneOptions(data.map((x) => ({ value: x.Id, label: x.Label })));
      } catch (err) {
        console.error('Error fetching zone options:', err);
      }
    })();
  }, []);

  const fetchBranches = async (zoneItems) => {
    try {
      const zoneIds = (zoneItems || []).map((z) => z.value);
      const res = await axios.get(`/api/GenericDropDown/branch?parentId=${zoneIds.join(',')}`);
      const data = res.data.data || [];
      setBranchOptions(data.map((x) => ({ value: x.Id, label: x.Label })));
    } catch (err) {
      console.error('Error fetching branch options:', err);
    }
  };

  // COD/NONCOD/ALL options from GENERIC table -> normalize values to COD | NONCOD | ALL
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get('/api/GenericDropDown/CODNonCOD');
        const data = res.data.data || [];
        const mapped = data.map(x => {
          const raw = String(x.Value ?? x.Id ?? x.Label ?? '').toUpperCase();
          const lbl = String(x.Label ?? x.Value ?? x.Id ?? '').toUpperCase();
          const txt = (raw || lbl).replace(/[^A-Z]/g, ''); // strip spaces/symbols
          if (txt.includes('NONCOD') || txt.includes('NON') || txt === 'NONCOD') {
            return { value: 'NONCOD', label: 'NonCOD' };
          }
          if (txt.includes('COD')) {
            return { value: 'COD', label: 'COD' };
          }
          return { value: 'ALL', label: 'ALL' };
        });
        // dedupe and ensure ALL exists
        const uniq = Array.from(new Map(mapped.map(o => [o.value, o])).values());
        if (!uniq.find(o => o.value === 'ALL')) uniq.push({ value: 'ALL', label: 'ALL' });
        setCODNonCODOptions(uniq);
      } catch (err) {
        console.error('Error fetching COD/Non-COD options:', err);
        // Fallback (rare)
        setCODNonCODOptions([
          { value: 'COD',    label: 'COD' },
          { value: 'NONCOD', label: 'NonCOD' },
          { value: 'ALL',    label: 'ALL' },
        ]);
      }
    })();
  }, []);

  // Safe totalCount (prevents pager from vanishing if API omits/zeroes it)
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

  // central fetch
  const fetchData = async (page, size) => {
    if (!selectedSelectyear?.value || !selectedSelectMonth?.value || !selectedCODNonCOD?.value) return;

    setLoading(true);
    try {
      const cod = (selectedCODNonCOD?.value || 'ALL').toString().toUpperCase(); // COD|NONCOD|ALL
      const filters = {
        Year: selectedSelectyear.value,
        Month: selectedSelectMonth.value,
        ZoneName: selectedZones.map((z) => z.label).join(',') || null,
        BranchName: selectedBranch.map((b) => b.label).join(',') || null,
        // send both in case backend expects either name
        IsCOD: cod,
        CODNonCOD: cod,
        PageNumber: page,
        PageSize: size,
        IsExport: false,
      };

      const res = await axios.get('/api/Sales/BranchCashCreditSale', { params: filters });
      const items = res?.data?.data ?? [];

      setData(items);
      setHeaders(items.length ? Object.keys(items[0]) : []);

      const countRaw =
        res?.data?.totalCount ??
        res?.data?.TotalCount ??
        res?.data?.data?.totalCount ??
        res?.data?.Data?.TotalCount;

      updateTotalCountSafe(countRaw, items.length, page, size);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // fetch on page/pageSize/queryKey AFTER first effect run
  useEffect(() => {
    if (!didEffectRunRef.current) {
      didEffectRunRef.current = true;
      return;
    }
    if (!hasSearched) return;
    if (skipNextFetch.current) { skipNextFetch.current = false; return; }
    fetchData(pageNumber, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber, pageSize, queryKey]);

  // total pages (never below 1) + correct page if it shrinks
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((totalCount || 0) / pageSize)),
    [totalCount, pageSize]
  );

  useEffect(() => {
    if (pageNumber > totalPages) {
      skipNextFetch.current = true; // prevent duplicate refetch
      setPageNumber(totalPages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  const handleSearch = async () => {
    if (!selectedSelectyear?.value || !selectedSelectMonth?.value || !selectedCODNonCOD?.value) {
      alert('Please select Year, Month, and COD/Non-COD.');
      return;
    }
    if (!hasSearched) setHasSearched(true);

    // reset to page 1; trigger fetch via queryKey
    if (pageNumber !== 1) setPageNumber(1);
    setQueryKey((k) => k + 1);
  };

  const handleExcelDownload = async (e) => {
    e.preventDefault();
    if (!selectedSelectyear?.value || !selectedSelectMonth?.value || !selectedCODNonCOD?.value) {
      alert('Please select Year, Month, and COD/Non-COD.');
      return;
    }

    let fakeProgress = 1;
    setDownloadProgress(fakeProgress);
    const progressTimer = setInterval(() => {
      fakeProgress += 1;
      if (fakeProgress < 95) setDownloadProgress(fakeProgress);
    }, 100);

    try {
      const cod = (selectedCODNonCOD?.value || 'ALL').toString().toUpperCase();
      const params = {
        Year: selectedSelectyear.value,
        Month: selectedSelectMonth.value,
        ZoneName: selectedZones.map((z) => z.label).join(',') || null,
        BranchName: selectedBranch.map((b) => b.label).join(',') || null,
        IsCOD: cod,
        CODNonCOD: cod,
        PageNumber: pageNumber,
        PageSize: pageSize,
        IsExport: true,
      };

      const res = await axios.get('/api/Sales/BranchCashCreditSaleExcel', {
        params,
        responseType: 'blob',
      });

      clearInterval(progressTimer);
      setDownloadProgress(100);

      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'BranchCashCreditSale.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      clearInterval(progressTimer);
      console.error('Excel download failed:', err);
    } finally {
      setTimeout(() => setDownloadProgress(0), 1000);
    }
  };

  // derived views
  const visibleHeaders = useMemo(
    () => headers.filter((h) => !hiddenHeaders.includes(h)),
    [headers]
  );

  const sortedData = useMemo(() => {
    if (!sortColumn) return data;
    const copy = [...data];
    copy.sort((a, b) => {
      const A = String(a?.[sortColumn] ?? '');
      const B = String(b?.[sortColumn] ?? '');
      return sortDirection === 'asc' ? A.localeCompare(B) : B.localeCompare(A);
    });
    return copy;
  }, [data, sortColumn, sortDirection]);

  const filteredData = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return sortedData;
    return sortedData.filter(row =>
      visibleHeaders.some(col => String(row?.[col] ?? '').toLowerCase().includes(q))
    );
  }, [sortedData, visibleHeaders, searchText]);

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
          <h3 className="report-title m-0">Branch Cash Credit Sale</h3>
          {hasSearched && <p className="text-muted m-0">Total Count: {totalCount}</p>}
        </div>
        <div className="text-center">
          {data.length > 0 && (
            <>
              <a href="#" onClick={handleExcelDownload} title="Download Excel">
                <img src={excelImg} alt="Export to Excel" className="excel-icon" />
              </a>
              {downloadProgress > 0 && (
                <div className="mt-1" style={{ width: '100px' }}>
                  <small>Downloading: {downloadProgress}%</small>
                  <div className="progress" style={{ height: '6px' }}>
                    <div className="progress-bar" style={{ width: `${downloadProgress}%` }}></div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="p-3 border rounded mb-3">
        <div className="d-flex flex-wrap gap-2 align-items-end">
          <div style={{ width: '180px' }}>
            <label className="form-label">Select Year</label>
            <SimpleDropdown dropdownOptions={Selectyear} placeholder="Year" onChange={setSelectedSelectyear} />
          </div>
          <div style={{ width: '180px' }}>
            <label className="form-label">Select Month</label>
            <SimpleDropdown dropdownOptions={SelectMonthOptions} placeholder="Month" onChange={setSelectedSelectMonth} />
          </div>
          <div style={{ width: '200px' }}>
            <label className="form-label">Zones</label>
            <GenericDropdown
              dropdownOptions={zoneOptions}
              placeholder="Zones"
              onChange={(v) => { const val = v || []; setSelectedZones(val); fetchBranches(val); }}
            />
          </div>
          <div style={{ width: '180px' }}>
            <label className="form-label">Branch</label>
            <GenericDropdown dropdownOptions={branchOptions} placeholder="Branch" onChange={(v) => setSelectedBranch(v || [])} />
          </div>
          <div style={{ width: '180px' }}>
            <label className="form-label">Select COD</label>
            <SimpleDropdown
              dropdownOptions={CODNonCODOptions}
              placeholder="COD/Non-COD"
              onChange={setSelectedCODNonCOD}
              isClearable
            />
          </div>
        </div>
        <div className="mt-3 text-end">
          <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
            {loading ? 'Searching…' : 'Search'}
          </button>
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
          <div className="table-responsive-wrapper mb-3">
            <table className="table table-bordered table-hover">
              {visibleHeaders.length > 0 && (
                <thead className="table-dark">
                  <tr>
                    <th>S.No.</th>
                    {visibleHeaders.map((header, i) => (
                      <th key={i} onClick={() => handleSort(header)} style={{ cursor: 'pointer' }} title="Click to sort">
                        {header} {sortColumn === header && (sortDirection === 'asc' ? '🔼' : '🔽')}
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

          {hasSearched && (totalCount > 0 || data.length > 0) && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div>
                <label className="me-2"><strong>Page Size:</strong></label>
                <select
                  className="form-select form-select-sm w-auto d-inline-block"
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); }}
                >
                  {[50, 100, 500, 1000].map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>

              <div className="d-flex flex-wrap">
                {blockStart > 1 && (
                  <button className="btn btn-sm btn-outline-secondary mx-1" onClick={() => goToPage(blockStart - 1)}>
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
                  <button className="btn btn-sm btn-outline-secondary mx-1" onClick={() => goToPage(blockEnd + 1)}>
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
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'string' && value.includes('T00:00:00')) {
    const d = new Date(value);
    if (!isNaN(d)) return d.toLocaleDateString();
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
}

export default MainMethod;
