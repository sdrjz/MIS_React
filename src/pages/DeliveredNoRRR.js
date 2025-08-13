import React, { useEffect, useState } from 'react';
import axios from '../utils/axios';
import './DeliveredNoRRR.css';
import excelImg from '../assets/images/ExcelFile.png';
import GenericDropdown from '../components/GenericDropdown';
import loaderGif from '../assets/images/Loader.gif';

function DeliveredNoRR() {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [pageSize, setPageSize] = useState(50);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const [zoneOptions, setZoneOptions] = useState([]);
  const [branchOptions, setBranchOptions] = useState([]);
  const [riderOptions, setriderOptions] = useState([]);
  const [hubOptions, setHubOptions] = useState([]);

  const [selectedZones, setSelectedZones] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState([]);
  const [selectedrider, setSelectedrider] = useState([]);
  const [selectedHub, setSelectedHub] = useState([]);

  const [accountNumbersText, setAccountNumbersText] = useState('');
  const [searchText, setSearchText] = useState('');
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [hasSearched, setHasSearched] = useState(false);

  const hiddenHeaders = ['zoneCode'];

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Zones
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

  // Auto-refresh when paging
  useEffect(() => {
    if (selectedZones.length > 0) handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber, pageSize]);

  // Branches by zones
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

  // Riders by branches
  const fetchRiders = async (selectedBranchIds) => {
    if (!selectedBranchIds || selectedBranchIds.length === 0) {
      setriderOptions([]);
      setSelectedrider([]);
      setHubOptions([]);
      setSelectedHub([]);
      return;
    }
    try {
      const branchParam = selectedBranchIds.join(',');
      const res = await axios.get(`/api/GenericDropDown/rider?parentId=${branchParam}`);
      const data = res.data.data || [];
      const formatted = data.map(item => ({ value: item.Id, label: item.Label }));
      setriderOptions(formatted);
      // clear downstream
      setSelectedrider([]);
      setHubOptions([]);
      setSelectedHub([]);
    } catch (err) {
      console.error('Error fetching rider options:', err);
    }
  };

  const toValues = (arr) =>
  Array.isArray(arr)
    ? arr
        .map(x => (x && typeof x === 'object' ? x.value : x))
        .filter(v => v !== null && v !== undefined && String(v).trim() !== '')
    : [];

  // Hubs by selected rider(s)
// Hubs by selected rider(s)
const fetchHubsByRiders = async (riderCodes) => {
  const values = toValues(riderCodes);
  if (values.length === 0) {
    setHubOptions([]);
    setSelectedHub([]);
    return;
  }
  try {
    const res = await axios.get('/api/GenericDropDown/hub', {
      params: { parentId: values.join(',') }
    });
    const data = res.data?.data ?? [];
    const formatted = data.map(item => ({ value: item.Id, label: item.Label }));
    setHubOptions(formatted);
    setSelectedHub([]); // let the user pick
  } catch (err) {
    console.error('Error fetching hubs by riders:', err);
  }
};


  const handleSearch = async () => {
    if (!selectedZones || selectedZones.length === 0) {
      alert('Please select at least one zone.');
      return;
    }
    setLoading(true);
    try {
        const filters = {
        ZoneCode: toValues(selectedZones).join(',') || null,
        BranchCode: toValues(selectedBranch).join(',') || null,
        RiderCode: toValues(selectedrider).join(',') || null,
        HubId:    toValues(selectedHub).join(',') || null,
        AccountNumbers: accountNumbersText,
        PageNumber: pageNumber,
        PageSize: pageSize,
        IsExport: false
      };
      const res = await axios.get('/api/COD/DeliveredNoRRReport', { params: filters });
      const items = res.data.data || [];
      setData(items);
      setHeaders(items.length > 0 ? Object.keys(items[0]) : []);
      setTotalCount(res.data.totalCount || items.length);
      setHasSearched(true);
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
        ZoneCode: toValues(selectedZones).join(',') || null,
        BranchCode: toValues(selectedBranch).join(',') || null,
        RiderCode: toValues(selectedrider).join(',') || null,
        HubId:    toValues(selectedHub).join(',') || null,
        AccountNumbers: accountNumbersText,
        PageNumber: pageNumber,
        PageSize: pageSize,
        IsExport: false
      };
      const res = await axios.get('/api/COD/DeliveredNoRRReportExcel', {
        params: filters,
        responseType: 'blob'
      });
      clearInterval(progressTimer);
      setDownloadProgress(100);
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'DeliveredNoRRReport.xlsx';
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

  const totalPages = Math.ceil(totalCount / pageSize);
  const visibleHeaders = headers.filter(h => !hiddenHeaders.includes(h));
  const startPage = Math.floor((pageNumber - 1) / 10) * 10 + 1;
  const endPage = Math.min(startPage + 9, totalPages);

  // ---- detail opener (clickable cells) ----
  const openDetail = (row) => {
    const detailParams = {
      ZoneCode: row.zoneCode || null, // adjust to row.ZoneCode if API uses that casing
      BranchCode: selectedBranch.length > 0 ? selectedBranch.join(',') : null,
      RiderCode: selectedrider.length > 0 ? selectedrider.join(',') : null,
      HubId: selectedHub.length > 0 ? selectedHub.join(',') : null,
      AccountNumbers: accountNumbersText || null,
      PageNumber: pageNumber,
      PageSize: pageSize,
      IsExport: false
    };
    sessionStorage.setItem('DeliveredNoRRDetailParams', JSON.stringify(detailParams));
    window.open('/MIS/DeliveredNoRRDetail', '_blank');
  };

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="flex-grow-1 text-center">
          <h3 className="report-title m-0">Delivered with No RR Report</h3>
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
          <div style={{ width: '300px' }}>
            <label className="form-label">Zones</label>
            <GenericDropdown
              dropdownOptions={zoneOptions}
              placeholder="Select Zones"
              onChange={(v) => {
                setSelectedZones(v || []);
                fetchBranches(v || []);
                // reset downstream
                setSelectedBranch([]); setriderOptions([]); setSelectedrider([]);
                setHubOptions([]); setSelectedHub([]);
              }}
            />
          </div>

          <div style={{ width: '220px' }}>
            <label className="form-label">Branch</label>
            <GenericDropdown
              dropdownOptions={branchOptions}
              placeholder="Select Branch"
              onChange={(v) => {
                setSelectedBranch(v || []);
                fetchRiders(v || []);
              }}
            />
          </div>

          <div style={{ width: '300px' }}>
            <label className="form-label">Rider</label>
            <GenericDropdown
              dropdownOptions={riderOptions}
              placeholder="Select Rider"
              onChange={(v) => {
                setSelectedrider(v || []);
                fetchHubsByRiders(v || []);
              }}
            />
          </div>

          <div style={{ width: '300px' }}>
            <label className="form-label">Hub</label>
             <GenericDropdown
            dropdownOptions={riderOptions}
            placeholder="Select Hub"
            onChange={(v) => {
              const values = toValues(v || []);
              setSelectedrider(values);       // store primitives
              fetchHubsByRiders(values);      // call with primitives
            }}
          />
          </div>

          <div style={{ width: '300px' }}>
            <label className="form-label">Account Number</label>
            <input
              className="form-control"
              placeholder="Enter Account Numbers"
              value={accountNumbersText}
              onChange={(e) => setAccountNumbersText(e.target.value)}
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
          <div className="table-responsive-wrapper mb-3">
            <table className="table table-bordered table-hover">
              {data.length > 0 && (
                <thead className="table-dark">
                  <tr>
                    <th>S.No.</th>
                    {visibleHeaders.map((header, i) => (
                      <th key={i} onClick={() => handleSort(header)} style={{ cursor: 'pointer' }}>
                        {header} {sortColumn === header && (sortDirection === 'asc' ? '🔼' : '🔽')}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}

              <tbody>
                {data.length > 0 ? (
                  data
                    .filter(row =>
                      !searchText ||
                      visibleHeaders.some(col =>
                        (row[col] ?? '').toString().toLowerCase().includes(searchText)
                      )
                    )
                    .map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        <td>{(pageNumber - 1) * pageSize + rowIndex + 1}</td>
                        {visibleHeaders.map((col, colIndex) => {
                          const cellValue = formatValue(row[col]);
                          const isClickable = cellValue !== '-' && row.Zone !== 'Grand Total';
                          return (
                            <td key={colIndex}>
                              {isClickable ? (
                                <span
                                  onClick={() => openDetail(row)}
                                  style={{ textDecoration: 'underline', color: '#007bff', cursor: 'pointer' }}
                                  title="View detail"
                                >
                                  {cellValue}
                                </span>
                              ) : (
                                cellValue
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                ) : (
                  hasSearched && !loading && (
                    <tr>
                      <td colSpan={visibleHeaders.length + 1} className="text-center text-muted">
                        No records found
                      </td>
                    </tr>
                  )
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
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPageNumber(1); }}
                >
                  {[50, 100, 500, 1000].map((size) => <option key={size} value={size}>{size}</option>)}
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
          )}
        </>
      )}
    </div>
  );
}

function formatValue(value) {
  if (value === null || value === '') return '-';
  if (typeof value === 'string' && value.includes('T00:00:00')) return new Date(value).toLocaleDateString();
  return value;
}

export default DeliveredNoRR;
