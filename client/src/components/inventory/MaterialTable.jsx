import React, { useState, useMemo } from 'react';
import { Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export default function MaterialTable({ materials = [], onEdit, onDelete, onSelectMaterial, selectedMaterialId }) {
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedMaterials = useMemo(() => {
    return [...materials].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      }

      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [materials, sortField, sortDirection]);

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-emerald-600" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
    );
  };

  const getStockBadge = (stock, reorderLevel, unit) => {
    const s = Number(stock) || 0;
    const r = Number(reorderLevel) || 0;

    let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    let statusText = 'Optimal';

    if (s <= r) {
      badgeClass = 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse';
      statusText = 'Low Stock';
    } else if (s <= r * 1.5) {
      badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
      statusText = 'Reorder Soon';
    }

    return (
      <div className="flex flex-col">
        <span className="font-mono font-semibold text-slate-900 text-xs">
          {s.toLocaleString()} <span className="text-[11px] font-normal text-slate-400">{unit}</span>
        </span>
        <span className={`inline-flex items-center px-1.5 py-0.2 mt-0.5 rounded text-[10px] font-mono font-semibold border w-max ${badgeClass}`}>
          {statusText}
        </span>
      </div>
    );
  };

  return (
    <div className="overflow-x-auto bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <table className="min-w-full divide-y divide-slate-100 text-sm text-left">
        <thead className="bg-slate-50/90 text-slate-500 font-mono text-[11px] uppercase tracking-wider sticky top-0 z-10 select-none border-b border-slate-200/80">
          <tr>
            <th
              onClick={() => handleSort('sku')}
              className="group px-4 py-3 cursor-pointer hover:bg-slate-100 transition"
            >
              <div className="flex items-center space-x-1">
                <span>SKU</span>
                {renderSortIcon('sku')}
              </div>
            </th>
            <th
              onClick={() => handleSort('name')}
              className="group px-4 py-3 cursor-pointer hover:bg-slate-100 transition"
            >
              <div className="flex items-center space-x-1">
                <span>Material Name</span>
                {renderSortIcon('name')}
              </div>
            </th>
            <th
              onClick={() => handleSort('category')}
              className="group px-4 py-3 cursor-pointer hover:bg-slate-100 transition"
            >
              <div className="flex items-center space-x-1">
                <span>Category</span>
                {renderSortIcon('category')}
              </div>
            </th>
            <th
              onClick={() => handleSort('currentStock')}
              className="group px-4 py-3 cursor-pointer hover:bg-slate-100 transition"
            >
              <div className="flex items-center space-x-1">
                <span>Current Stock</span>
                {renderSortIcon('currentStock')}
              </div>
            </th>
            <th
              onClick={() => handleSort('reorderLevel')}
              className="group px-4 py-3 cursor-pointer hover:bg-slate-100 transition"
            >
              <div className="flex items-center space-x-1">
                <span>Reorder Point</span>
                {renderSortIcon('reorderLevel')}
              </div>
            </th>
            <th
              onClick={() => handleSort('costPerUnit')}
              className="group px-4 py-3 cursor-pointer hover:bg-slate-100 transition"
            >
              <div className="flex items-center space-x-1">
                <span>Cost / Unit</span>
                {renderSortIcon('costPerUnit')}
              </div>
            </th>
            <th
              onClick={() => handleSort('shelfLifeDays')}
              className="group px-4 py-3 cursor-pointer hover:bg-slate-100 transition"
            >
              <div className="flex items-center space-x-1">
                <span>Shelf Life</span>
                {renderSortIcon('shelfLifeDays')}
              </div>
            </th>
            <th className="px-4 py-3">Stability</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {sortedMaterials.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-6 py-12 text-center text-slate-400 font-mono text-xs">
                No materials found matching criteria.
              </td>
            </tr>
          ) : (
            sortedMaterials.map((item) => {
              const isSelected = selectedMaterialId === (item._id || item.id);
              return (
                <tr
                  key={item._id || item.id}
                  onClick={() => onSelectMaterial && onSelectMaterial(item)}
                  className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                    isSelected ? 'bg-emerald-50/60 ring-1 ring-inset ring-emerald-500/30' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">
                    {item.sku}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 text-xs">
                    {item.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {getStockBadge(item.currentStock, item.reorderLevel, item.unit)}
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                    {item.reorderLevel} {item.unit}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-800">
                    ${Number(item.costPerUnit || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                    {item.shelfLifeDays ? `${item.shelfLifeDays}d` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {item.isPerishable ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        Perishable
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        Stable
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div
                      className="inline-flex items-center space-x-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition"
                        title="Edit Material"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                        title="Delete Material"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
