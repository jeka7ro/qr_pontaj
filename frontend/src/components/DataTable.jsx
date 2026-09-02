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
  hideTitle = false,
  rowKey = 'id',
  expandable = false,
  expandedRowRender = null
}) {
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());
  const [expandedRowIds, setExpandedRowIds] = useState(new Set());

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

  const toggleRowExpanded = (id) => {
    const newExpanded = new Set(expandedRowIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRowIds(newExpanded);
  };

  const isAllPageSelected = paginatedData.length > 0 && paginatedData.every(item => selectedRowIds.has(item[rowKey]));

  const hasAggregates = columns.some(col => col.aggregate);
  const pageTotals = {};
  const globalTotals = {};
  if (hasAggregates) {
    columns.forEach(col => {
      if (col.aggregate) {
        if (typeof col.aggregate === 'function') {
          pageTotals[col.key] = col.aggregate(paginatedData);
          globalTotals[col.key] = col.aggregate(sortedData);
        } else {
          pageTotals[col.key] = paginatedData.reduce((sum, item) => sum + (Number(item[col.key]) || 0), 0);
          globalTotals[col.key] = sortedData.reduce((sum, item) => sum + (Number(item[col.key]) || 0), 0);
        }
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
          if (col.exportRender) {
            row[col.label] = col.exportRender(item);
          } else {
            row[col.label] = item[col.key] !== null && typeof item[col.key] === 'object' 
              ? JSON.stringify(item[col.key]) 
              : item[col.key];
          }
        }
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Date");
    
    const today = new Date();
    const dateString = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
    const baseName = title ? title.replace(/\s+/g, '_') : 'Raport';
    const fileName = `${baseName}_${dateString}.xlsx`;
    
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header (Titlu + Acțiuni Principale) */}
      {(title && !hideTitle || headerActions) && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          {title && !hideTitle ? (
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white dark:text-white">{title}</h2>
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
          <div className="flex-1 w-full max-w-full overflow-hidden">
            {filters ? (
              <div className="flex items-start xl:items-center gap-2 w-full flex-col xl:flex-row xl:flex-nowrap">
                <Filter size={16} className="text-slate-400 hidden xl:block shrink-0 mt-2 xl:mt-0" />
                <div className="flex-1 w-full min-w-0 pb-1 xl:pb-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                  {filters}
                </div>
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="block w-full h-10 text-[16px] md:text-sm rounded-full border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-white outline-none transition-all shadow-sm"
              style={{ paddingLeft: 36, paddingRight: search ? 80 : 16 }}
            />
            {/* Contor Rezultate */}
            {search && (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-primary-600 text-white rounded-full px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap">
                {filteredData.length} / {data.length}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Container Tabel (cu fundal alb și card) */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 dark:border-slate-700 shadow-sm flex flex-col flex-1 overflow-hidden min-h-[300px]">
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 dark:border-slate-700 sticky top-0 z-10">
              <tr>
                {selectable && (
                  <th className="pl-4 pr-2 py-3 w-10 text-center">
                    <input 
                      type="checkbox" 
                      checked={isAllPageSelected}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                  </th>
                )}
                {expandable && (
                  <th className="px-3 py-3 w-10"></th>
                )}
              {/* Coloana Nr. Crt. */}
              <th className="w-[50px] text-center px-3 py-3 text-slate-800 dark:text-white dark:text-slate-300 text-sm font-bold uppercase tracking-wider">
                Nr.
              </th>
              
              {columns.map((col, idx) => (
                <th 
                  key={idx}
                  onClick={() => col.sortable !== false ? handleSort(col.key) : null}
                  className={`px-4 py-3 text-slate-800 dark:text-white dark:text-slate-300 text-sm font-bold uppercase tracking-wider ${col.sortable !== false ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-700/50' : ''}`}
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
                const isExpanded = expandable && expandedRowIds.has(row[rowKey]);
                
                return (
                  <React.Fragment key={row[rowKey] || rowIndex}>
                    <tr 
                      className={`transition-colors group ${isSelected ? 'bg-primary-50/50 dark:bg-primary-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-700/50'} ${expandable ? 'cursor-pointer' : ''}`}
                      onClick={() => expandable && toggleRowExpanded(row[rowKey])}
                    >
                      {selectable && (
                        <td className="pl-4 pr-2 py-3 text-center" onClick={e => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => handleSelectRow(row[rowKey])}
                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500 cursor-pointer"
                          />
                        </td>
                      )}
                      {expandable && (
                        <td className="px-3 py-3 text-center text-slate-400">
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </td>
                      )}
                      <td className="px-3 py-3 text-center text-slate-500 dark:text-slate-400 font-medium text-[13px]">
                        {startIndex + rowIndex + 1}
                      </td>
                      {columns.map((col, colIdx) => (
                        <td key={colIdx} className="px-4 py-3 text-slate-800 dark:text-white dark:text-slate-200 font-medium">
                          {col.render ? col.render(row) : row[col.key] || '-'}
                        </td>
                      ))}
                    </tr>
                    {isExpanded && expandedRowRender && (
                      <tr>
                        <td colSpan={columns.length + (selectable ? 1 : 0) + (expandable ? 2 : 1)} className="p-0 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50/50 dark:bg-slate-900/50">
                          {expandedRowRender(row)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 dark:text-slate-400">
                  Nu au fost găsite înregistrări.
                </td>
              </tr>
            )}
          </tbody>
          
          {hasAggregates && (
            <tfoot className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
              <tr>
                {selectable && <td></td>}
                <td className="px-6 py-3 font-bold text-primary-700 text-sm uppercase tracking-wider">Total</td>
                {columns.map((col, idx) => (
                  <td key={idx} className="px-6 py-3 font-bold text-primary-700 text-sm">
                    {col.aggregate ? globalTotals[col.key] : ''}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Footer / Paginare */}
      <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col md:flex-row items-center justify-between rounded-b-lg">
        <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
          <span className="whitespace-nowrap flex items-center gap-1.5">
            Afișează
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-2 py-0.5 outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={9999}>Toți</option>
            </select>
          </span>
          <span className="whitespace-nowrap">
            Total înregistrări: <strong className="text-slate-900 dark:text-white">{totalItems}</strong>
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <span className="whitespace-nowrap mr-2">Pagina {currentPage} din {Math.max(1, totalPages)}</span>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
