import React, { useEffect, useState } from 'react';
import axios from '../utils/axios';
import './Common.css';
import excelImg from '../assets/images/ExcelFile.png';
import GenericDropdown, { SimpleDropdown } from '../components/GenericDropdown';
import DatePicker from 'react-datepicker';
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
  const [selectedZones, setSelectedZones] = useState([]);
  const [zoneOptions, setZoneOptions] = useState([]);
  const hiddenHeaders = ['zoneCode'];
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [GetCODStatusOptions, setGetCODStatusOptions] = useState([]);
  const [selectedGetCODStatus, setSelectedGetCODStatus] = useState(null);
  const [CustomerOptions, setCustomerOptions] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const fetchZones = async () => {
      const res = await axios.get('/api/GenericDropDown/zone');
      const data = res.data.data || [];
      setZoneOptions(data.map(item => ({ value: item.Id, label: item.Label })));
    };
    fetchZones();
  }, []);

  useEffect(() => {
    const fetchGetCODStatus = async () => {
      const res = await axios.get('/api/GenericDropDown/CODStatus');
      const data = res.data.data || [];
      setGetCODStatusOptions(data.map(item => ({ value: item.Id, label: item.Label })));
    };
    fetchGetCODStatus();
  }, []);

  useEffect(() => {
    if (selectedZones.length > 0) handleSearch();
  }, [pageNumber, pageSize]);

  const fetchCustomeres = async (zoneIds) => {
    const res = await axios.get(`/api/GenericDropDown/GetCustomer?parentId=${zoneIds.join(',')}`);
    const data = res.data.data || [];
    setCustomerOptions(data.map(item => ({ value: item.Id, label: item.Label })));
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleSearch = async () => {
    if (!startDate || !endDate) return alert('Please select both Start Date and End Date.');
    setLoading(true);
    try {
      const filters = {
        ZoneCode: selectedZones.join(',') || null,
        CustomerList: selectedCustomer.join(',') || null,
        StartDate: startDate.toLocaleDateString('en-CA'),
        EndDate: endDate.toLocaleDateString('en-CA'),
        CODStatus: selectedGetCODStatus?.value ?? 'All',
        PageNumber: pageNumber,
        PageSize: pageSize,
        IsExport: false,
      };
      const res = await axios.get('/api/COD/ReversePickupReport', { params: filters });
      const items = res.data.data || [];
      setData(items);
      setHeaders(items.length > 0 ? Object.keys(items[0]) : []);
      setTotalCount(res.data.totalCount || items.length);
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
        ZoneCode: selectedZones.join(',') || null,
        CustomerList: selectedCustomer.join(',') || null,
        StartDate: startDate.toLocaleDateString('en-CA'),
        EndDate: endDate.toLocaleDateString('en-CA'),
        CODStatus: selectedGetCODStatus?.value ?? 'All',
        PageNumber: pageNumber,
        PageSize: pageSize,
        IsExport: true,
      };
      const res = await axios.get('/api/COD/ReversePickupReportExcel', {
        params: filters,
        responseType: 'blob',
      });
      clearInterval(progressTimer);
      setDownloadProgress(100);
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ReversePickupReport.xlsx';
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
  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn) return 0;
    const valA = a[sortColumn];
    const valB = b[sortColumn];
    if (valA === null || valA === undefined) return 1;
    if (valB === null || valB === undefined) return -1;
    return sortDirection === 'asc'
      ? valA.toString().localeCompare(valB.toString())
      : valB.toString().localeCompare(valA.toString());
  });

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="flex-grow-1 text-center">
          <h3 className="report-title m-0">Reverse Pickup Report</h3>
          {/* <p className="text-muted m-0">Total Count: {totalCount}</p> */}
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

      <div className="p-3 border rounded mb-2">
        <div className="d-flex flex-wrap gap-2 align-items-end">
          <div style={{ width: '170px' }}>
            <label className="form-label">Start Date</label>
            <DatePicker selected={startDate} onChange={(d) => setStartDate(d)} dateFormat="MM/dd/yyyy" className="form-control" />
          </div>
          <div style={{ width: '170px' }}>
            <label className="form-label">End Date</label>
            <DatePicker selected={endDate} onChange={(d) => setEndDate(d)} dateFormat="MM/dd/yyyy" className="form-control" />
          </div>
          <div style={{ width: '200px' }}>
            <label className="form-label">Zones</label>
            <GenericDropdown dropdownOptions={zoneOptions} placeholder="Zones" onChange={(v) => { setSelectedZones(v || []); fetchCustomeres(v || []); }} />
          </div>
          <div style={{ width: '250px' }}>
            <label className="form-label">Customer</label>
            <GenericDropdown dropdownOptions={CustomerOptions} placeholder="Customer" onChange={(v) => setSelectedCustomer(v || [])} />
          </div>
          <div style={{ width: '150px' }}>
            <label className="form-label">Status</label>
            <SimpleDropdown dropdownOptions={GetCODStatusOptions} placeholder="Status" onChange={(v) => setSelectedGetCODStatus(v)} />
          </div>
        </div>
        <div className="mt-3 text-end">
          <button className="btn btn-primary" onClick={handleSearch}>Search</button>
        </div>
      </div>

      {/* 🔍 Search Text Box below filter box on right */}
      <div className="text-end mb-3">
        <input
          type="text"
          className="form-control w-auto d-inline-block"
          style={{ minWidth: '250px' }}
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
                        {header} {sortColumn === header && (sortDirection === 'asc' ? ' 🔼' : ' 🔽')}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
            {sortedData.length > 0 ? (
              sortedData
                .filter(row =>
                  !searchText || visibleHeaders.some(col =>
                    (row[col] || '').toString().toLowerCase().includes(searchText)
                  )
                )
                .map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td>{(pageNumber - 1) * pageSize + rowIndex + 1}</td>
                    {visibleHeaders.map((col, colIndex) => (
                      <td key={colIndex}>{formatValue(row[col])}</td>
                    ))}
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
                <select className="form-select form-select-sm w-auto d-inline-block" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPageNumber(1); }}>
                  {[50, 100, 500, 1000].map(size => <option key={size} value={size}>{size}</option>)}
                </select>
              </div>
              <div>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                  <button key={num} className={`btn btn-sm mx-1 ${num === pageNumber ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setPageNumber(num)}>
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
  return value;
}

export default MainMethod;
