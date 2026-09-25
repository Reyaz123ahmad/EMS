import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useBulkImportEmployees } from '../../hooks/useEmployee.js';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import * as XLSX from 'xlsx';

export function BulkImportEmployeesPage() {
  const navigate = useNavigate();
  const bulkImportMutation = useBulkImportEmployees();

  const [parsedRows, setParsedRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [results, setResults] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg('');
    setResults(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (!data || data.length === 0) {
          setErrorMsg('The selected spreadsheet contains no data rows.');
          return;
        }

        // Standardize format
        const rows = data.map((item, idx) => ({
          _rowId: idx + 1,
          firstName: item.firstName || item['First Name'] || item['first_name'] || '',
          lastName: item.lastName || item['Last Name'] || item['last_name'] || '',
          email: item.email || item['Email'] || item['email_address'] || '',
          phone: item.phone || item['Phone'] || item['mobile'] || '',
          employeeCode: item.employeeCode || item['Employee Code'] || item['code'] || '',
          employmentType: item.employmentType || item['Employment Type'] || 'FULL_TIME'
        }));

        setParsedRows(rows);
      } catch (err) {
        setErrorMsg('Failed to parse file. Please upload a valid CSV or Excel spreadsheet.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (!parsedRows.length) return;
    setErrorMsg('');
    try {
      const response = await bulkImportMutation.mutateAsync({ rows: parsedRows });
      setResults(response.data || response);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Bulk import failed to process.');
    }
  };

  const downloadSampleTemplate = () => {
    const sampleData = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1555123456',
        employeeCode: 'EMP-1001',
        employmentType: 'FULL_TIME'
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+1555987654',
        employeeCode: 'EMP-1002',
        employmentType: 'FULL_TIME'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employees');
    XLSX.writeFile(wb, 'employees_import_sample.xlsx');
  };

  const previewColumns = [
    { header: '#', key: '_rowId', width: '50px' },
    {
      header: 'Name',
      key: 'name',
      render: (r) => (
        <span className="font-medium text-slate-200">
          {r.firstName} {r.lastName}
        </span>
      )
    },
    { header: 'Email', key: 'email' },
    { header: 'Phone', key: 'phone' },
    { header: 'Employee Code', key: 'employeeCode' },
    { header: 'Type', key: 'employmentType' }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
            <Link to="/employees" className="hover:text-white transition-colors">Employees</Link>
            <span>/</span>
            <span className="text-slate-200">Bulk Import</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Bulk Import Employees
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Upload CSV or Excel spreadsheets to onboard multiple employees simultaneously.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadSampleTemplate}
            className="border-slate-700 hover:bg-slate-800"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Sample CSV
          </Button>

          <Link to="/employees">
            <Button variant="outline" size="sm" className="border-slate-700">
              Back to List
            </Button>
          </Link>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Upload Box */}
      {!results && (
        <Card className="p-8 bg-slate-900/70 border-slate-800 backdrop-blur-md text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white">Upload Spreadsheet</h3>
              <p className="text-xs text-slate-400 mt-1">
                Drag and drop your .xlsx or .csv file here, or click to browse
              </p>
            </div>

            <input
              type="file"
              accept=".csv, .xlsx, .xls"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload-input"
            />
            <label htmlFor="file-upload-input">
              <Button
                type="button"
                variant="outline"
                className="border-slate-700 cursor-pointer"
                onClick={() => document.getElementById('file-upload-input').click()}
              >
                {fileName ? fileName : 'Select Spreadsheet'}
              </Button>
            </label>
          </div>
        </Card>
      )}

      {/* Preview Table */}
      {parsedRows.length > 0 && !results && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">
              Parsed Preview ({parsedRows.length} rows)
            </h2>
            <Button
              onClick={handleImport}
              isLoading={bulkImportMutation.isPending}
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              Confirm & Import {parsedRows.length} Employees
            </Button>
          </div>

          <DataTable columns={previewColumns} data={parsedRows} />
        </div>
      )}

      {/* Results View */}
      {results && (
        <Card className="p-6 bg-slate-900/70 border-slate-800 backdrop-blur-md space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-white">Import Summary</h2>
              <p className="text-sm text-slate-400 mt-1">
                Successfully processed {results.total || results.successful + results.failed} employee records.
              </p>
            </div>
            <Button
              onClick={() => navigate('/employees')}
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              Go to Employees Directory
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400 uppercase tracking-wider">Total Rows</span>
              <div className="text-2xl font-bold text-white mt-1">{results.total || (results.successful + results.failed)}</div>
            </div>
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-xs text-emerald-400 uppercase tracking-wider">Created Successfully</span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">{results.successful || 0}</div>
            </div>
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <span className="text-xs text-red-400 uppercase tracking-wider">Failed / Skipped</span>
              <div className="text-2xl font-bold text-red-400 mt-1">{results.failed || 0}</div>
            </div>
          </div>

          {results.errors && results.errors.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-300">Errors & Warnings</h3>
              <div className="max-h-48 overflow-y-auto space-y-1 p-3 rounded-lg bg-slate-950/80 border border-slate-800 font-mono text-xs text-red-400">
                {results.errors.map((err, i) => (
                  <div key={i}>Row {err.row}: {err.email ? `[${err.email}] ` : ''}{err.error}</div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

export default BulkImportEmployeesPage;
