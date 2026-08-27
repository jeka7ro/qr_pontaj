import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  ChevronRight,
  Filter
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function DataTable({ 
  title, 
  data = [], 
  columns = [], 
  searchPlaceholder = 'Caută...',
  headerActions = null,
  filters = null,
  selectable = false,
  bulkActions = null,
  rowKey = 'id'
}) {
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());

  // 1. Căutare Globală
  const filteredData = useMemo(() => {
    if (!search) return data;
    return data.filter(item => {
      return Object.values(item).some(val => 
        String(val).toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [data, search]);

  // 2. Sortare
  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        // Handling for string comparison
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  // 3. Paginare
  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Safe page check
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const newSelected = new Set(selectedRowIds);
      paginatedData.forEach(item => newSelected.add(item[rowKey]));
      setSelectedRowIds(newSelected);
    } else {
      const newSelected = new Set(selectedRowIds);
      paginatedData.forEach(item => newSelected.delete(item[rowKey]));
      setSelectedRowIds(newSelected);
    }
  };

  const handleSelectRow = (id) => {
    const newSelected = new Set(selectedRowIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRowIds(newSelected);
  };

  const isAllPageSelected = paginatedData.length > 0 && paginatedData.every(item => selectedRowIds.has(item[rowKey]));

  const hasAggregates = columns.some(col => col.aggregate);
  const pageTotals = {};
  const globalTotals = {};
  if (hasAggregates) {
    columns.forEach(col => {
      if (col.aggregate) {
        pageTotals[col.key] = paginatedData.reduce((sum, item) => sum + (Number(item[col.key]) || 0), 0);
        globalTotals[col.key] = sortedData.reduce((sum, item) => sum + (Number(item[col.key]) || 0), 0);
      }
    });
  }

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleExport = () => {
    // Eliminăm coloanele de acțiuni sau alte randere UI din export
    const exportData = sortedData.map((item, index) => {
      const row = { 'Nr. Crt.': index + 1 };
      columns.forEach(col => {
        if (col.key !== 'actions' && col.exportable !== false) {
          row[col.label] = item[col.key];
        }
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Date");
    XLSX.writeFile(workbook, `${title.replace(/\s+/g, '_')}_Export.xlsx`);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header (Titlu + Acțiuni Principale) */}
      {(title || headerActions) && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          {title ? (
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
          ) : (
            <div></div>
          )}
          <div className="flex items-center gap-3">
            {headerActions}
          </div>
        </div>
      )}

      {/* Toolbar (Căutare, Filtre, Export) */}
      <div className="flex flex-col gap-4 mb-4">
        {/* Rândul 1: Filtre și Acțiuni (Export) */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 w-full">
          {/* Slot de filtre extra */}
          <div className="flex-1 w-full">
            {filters ? (
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-slate-400 hidden sm:block" />
                {filters}
              </div>
            ) : null}
          </div>

          {/* Export și Bulk Actions */}
          <div className="flex items-center gap-3 self-end lg:self-auto shrink-0">
            {bulkActions && selectedRowIds.size > 0 && (
              <div className="flex items-center gap-2 mr-2 animate-in fade-in slide-in-from-right-4">
                {bulkActions(selectedRowIds.size, handleClearSelection)}
              </div>
            )}
            
            <button 
              onClick={handleExport}
              className="flex items-center px-4 h-10 rounded-full bg-green-600 hover:bg-green-700 text-white text-sm font-bold shadow-sm transition-colors"
            >
              <Download size={16} className="mr-2" />
              Export Excel
            </button>
          </div>
        </div>

        {/* Rândul 2: Căutare */}
        <div className="w-full">
          {/* Căutare */}
          <div className="relative w-full max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="block w-full pl-10 pr-20 h-10 text-[16px] md:text-sm rounded-full border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-white outline-none transition-all shadow-sm"
            />
            {/* Contor Rezultate */}
            <div 
              className={`absolute inset-y-0 right-2 flex items-center transition-opacity duration-200 pointer-events-none ${search.length > 0 ? 'opacity-100' : 'opacity-0'}`}
            >
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-600 text-white shadow-sm">
                {filteredData.length} din {data.length}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Container Tabel (cu fundal alb și card) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col flex-1 overflow-hidden min-h-[300px]">
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
              <tr>
                {selectable && (
                  <th className="pl-4 pr-2 py-3 w-10 text-center">
                    <input 
                      type="checkbox" 
                      checked={isAllPageSelected}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                </th>
              )}
              {/* Coloana Nr. Crt. */}
              <th className="px-3 py-3 text-slate-800 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider w-14">
                #
              </th>
              
              {columns.map((col, idx) => (
                <th 
                  key={idx}
                  onClick={() => col.sortable !== false ? handleSort(col.key) : null}
                  className={`px-4 py-3 text-slate-800 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider ${col.sortable !== false ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50' : ''}`}
                >
                  <div className="flex items-center space-x-1">
                    <span>{col.label}</span>
                    {col.sortable !== false && (
                      <span className="flex flex-col opacity-50 ml-1">
                        <ChevronUp size={10} className={`${sortConfig.key === col.key && sortConfig.direction === 'asc' ? 'text-primary-600 opacity-100' : ''}`} />
                        <ChevronDown size={10} className={`${sortConfig.key === col.key && sortConfig.direction === 'desc' ? 'text-primary-600 opacity-100' : '-mt-1'}`} />
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => {
                const isSelected = selectable && selectedRowIds.has(row[rowKey]);
                return (
                  <tr key={row[rowKey] || rowIndex} className={`transition-colors group ${isSelected ? 'bg-primary-50/50 dark:bg-primary-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                    {selectable && (
                      <td className="pl-4 pr-2 py-3 text-center">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => handleSelectRow(row[rowKey])}
                          className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="px-3 py-3 text-slate-800 dark:text-slate-200 font-medium text-xs">
                      {startIndex + rowIndex + 1}
                    </td>
                    {columns.map((col, colIdx) => (
                      <td key={colIdx} className="px-4 py-3 text-slate-800 dark:text-slate-200 font-medium">
                        {col.render ? col.render(row) : row[col.key] || '-'}
                      </td>
                    ))}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                  Nu au fost găsite înregistrări.
                </td>
              </tr>
            )}
          </tbody>
          
          {hasAggregates && (
            <tfoot className="bg-slate-50 border-t border-slate-200">
              <tr>
                {selectable && <td></td>}
                <td className="px-6 py-3 font-bold text-slate-700 text-xs">Total Pagină</td>
                {columns.map((col, idx) => (
                  <td key={idx} className="px-6 py-3 font-bold text-slate-700 text-xs">
                    {col.aggregate ? pageTotals[col.key] : ''}
                  </td>
                ))}
              </tr>
              <tr className="border-t border-slate-100">
                {selectable && <td></td>}
                <td className="px-6 py-3 font-bold text-primary-700 text-xs">Total General</td>
                {columns.map((col, idx) => (
                  <td key={idx} className="px-6 py-3 font-bold text-primary-700 text-xs">
                    {col.aggregate ? globalTotals[col.key] : ''}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Footer / Paginare */}
      <div className="px-6 py-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4 rounded-b-2xl">
        <div className="flex flex-wrap items-center gap-4">
          {/* Rânduri pe pagină MUTAT EXTREMA STÂNGĂ */}
          <div className="flex items-center space-x-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Rânduri/Pagină:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 h-8 text-sm rounded-2xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-white outline-none transition-all cursor-pointer font-medium"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* Textul Se afișează după selector */}
          <div className="text-sm text-slate-600 dark:text-slate-400 font-medium border-l border-slate-200 dark:border-slate-700 pl-4">
            Se afișează <span className="font-bold text-slate-900 dark:text-white">{totalItems === 0 ? 0 : startIndex + 1}</span>–<span className="font-bold text-slate-900 dark:text-white">{Math.min(startIndex + itemsPerPage, totalItems)}</span> din <span className="font-bold text-slate-900 dark:text-white">{totalItems}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-primary-50 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
          </button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Simulare paginare de bază (doar arată câteva pagini)
              let pageNum = currentPage;
              if (currentPage <= 3) pageNum = i + 1;
              else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = currentPage - 2 + i;
              
              if (pageNum < 1 || pageNum > totalPages) return null;

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-full text-sm font-bold transition-colors flex items-center justify-center ${
                    currentPage === pageNum
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-primary-50 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
