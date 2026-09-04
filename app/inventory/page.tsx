'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Wrench,
  Tag,
  DollarSign,
  Package,
  Layers,
  ArrowUpDown,
  Filter,
  Eye,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { AppShell } from '@/components/layout/AppShell';
import { inventoryService } from '@/lib/api/inventoryService';
import { InventoryItem, InventoryCategory } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

export default function InventoryPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'items' | 'categories'>('items');

  // Data States
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Item Modal States
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemFormData, setItemFormData] = useState<Partial<InventoryItem>>({
    name: '',
    sku: '',
    category: '',
    unitPrice: 0,
    rentalRate: 0,
    totalStock: 1,
    availableQuantity: 1,
    unit: 'Unit',
    description: '',
    specifications: '',
    status: 'In Stock',
  });

  // Category Modal States
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<InventoryCategory | null>(null);
  const [categoryFormData, setCategoryFormData] = useState<Partial<InventoryCategory>>({
    name: '',
    code: '',
    description: '',
    color: '#00e5c9',
    status: 'Active',
  });

  // Delete Dialog States
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'item' | 'category';
    item: InventoryItem | InventoryCategory;
  } | null>(null);

  const loadData = async () => {
    try {
      const [itms, cats] = await Promise.all([
        inventoryService.getItems(),
        inventoryService.getCategories(),
      ]);
      if (Array.isArray(itms)) setItems(itms);
      if (Array.isArray(cats)) setCategories(cats);
    } catch {}
  };

  useEffect(() => {
    loadData();
    window.addEventListener('seekers_inventory_items_updated', loadData);
    window.addEventListener('seekers_inventory_categories_updated', loadData);
    return () => {
      window.removeEventListener('seekers_inventory_items_updated', loadData);
      window.removeEventListener('seekers_inventory_categories_updated', loadData);
    };
  }, []);

  // KPIs
  const totalValue = useMemo(() => {
    return items.reduce((sum, item) => sum + item.unitPrice * item.totalStock, 0);
  }, [items]);

  const lowStockCount = useMemo(() => {
    return items.filter((i) => i.status === 'Low Stock').length;
  }, [items]);

  const outOfStockCount = useMemo(() => {
    return items.filter((i) => i.status === 'Out of Stock').length;
  }, [items]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
      if (selectedStatus !== 'All' && item.status !== selectedStatus) return false;
      return true;
    });
  }, [items, searchQuery, selectedCategory, selectedStatus]);

  // Category Item Counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [items]);

  // Item Handlers
  const openCreateItemModal = () => {
    setEditingItem(null);
    setItemFormData({
      name: '',
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      category: categories[0]?.name || 'Sound & Audio Gear',
      unitPrice: 15000,
      rentalRate: 8500,
      totalStock: 5,
      availableQuantity: 5,
      unit: 'Unit',
      description: '',
      specifications: '',
      status: 'In Stock',
    });
    setIsItemModalOpen(true);
  };

  const openEditItemModal = (item: InventoryItem) => {
    setEditingItem(item);
    setItemFormData({ ...item });
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemFormData.name?.trim() || !itemFormData.category) {
      showToast('Item name and category are required', 'error');
      return;
    }

    const payload = {
      ...itemFormData,
      id: editingItem ? editingItem.id : undefined,
      name: itemFormData.name.trim(),
      category: itemFormData.category,
      unitPrice: Number(itemFormData.unitPrice || 0),
      rentalRate: Number(itemFormData.rentalRate || 0),
      totalStock: Number(itemFormData.totalStock || 1),
      availableQuantity: Number(itemFormData.availableQuantity ?? itemFormData.totalStock ?? 1),
    };

    if (editingItem) {
      await inventoryService.updateItem(editingItem.id, payload);
    } else {
      await inventoryService.createItem(payload as any);
    }

    showToast(
      editingItem ? 'Inventory item updated successfully' : 'New equipment added to inventory',
      'success'
    );
    setIsItemModalOpen(false);
    loadData();
  };

  const adjustStock = async (item: InventoryItem, delta: number) => {
    const newAvailable = Math.max(0, Math.min(item.totalStock, item.availableQuantity + delta));
    await inventoryService.updateItem(item.id, {
      ...item,
      availableQuantity: newAvailable,
    });
    showToast(`${item.name} stock updated to ${newAvailable}`, 'info');
    loadData();
  };

  // Category Handlers
  const openCreateCategoryModal = () => {
    setEditingCategory(null);
    setCategoryFormData({
      name: '',
      code: '',
      description: '',
      color: '#00e5c9',
      status: 'Active',
    });
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (cat: InventoryCategory) => {
    setEditingCategory(cat);
    setCategoryFormData({ ...cat });
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormData.name?.trim()) {
      showToast('Category name is required', 'error');
      return;
    }

    const code =
      categoryFormData.code?.trim() ||
      categoryFormData.name.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 10);

    const payload = {
      ...categoryFormData,
      id: editingCategory ? editingCategory.id : undefined,
      name: categoryFormData.name.trim(),
      code,
      color: categoryFormData.color || '#00e5c9',
      status: categoryFormData.status || 'Active',
    };

    if (editingCategory) {
      await inventoryService.updateCategory(editingCategory.id, payload);
    } else {
      await inventoryService.createCategory(payload as any);
    }

    showToast(
      editingCategory ? 'Category updated successfully' : 'New inventory category created',
      'success'
    );
    setIsCategoryModalOpen(false);
    loadData();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'item') {
      await inventoryService.deleteItem(deleteTarget.item.id);
      showToast(`Item "${deleteTarget.item.name}" removed from inventory`, 'success');
    } else {
      await inventoryService.deleteCategory(deleteTarget.item.id);
      showToast(`Category "${deleteTarget.item.name}" deleted`, 'success');
    }
    setDeleteTarget(null);
    loadData();
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
        title="Inventory & Equipment Management"
        subtitle="Manage audiovisual gear, rental rates, stock availability, and service items"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Inventory' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={openCreateCategoryModal}
              className="flex items-center gap-2 rounded-lg bg-slate-100 dark:bg-[#162333] border border-slate-300 dark:border-[#23354c] px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#1c2c40] transition-colors"
            >
              <Plus className="h-3.5 w-3.5 text-[#00897b] dark:text-[#00e5c9]" />
              New Category
            </button>
            <button
              onClick={openCreateItemModal}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#00e5c9] to-[#00b8a2] px-4 py-2 text-sm font-semibold text-black transition-all hover:brightness-110 shadow-lg shadow-[#00e5c9]/20"
            >
              <Plus className="h-4 w-4" />
              Add Equipment / Service
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total SKUs Tracked"
          value={items.length}
          icon={Package}
          accentColor="teal"
        />
        <StatCard
          title="Total Inventory Value"
          value={formatCurrency(totalValue)}
          icon={DollarSign}
          accentColor="emerald"
        />
        <StatCard
          title="Low Stock Alerts"
          value={lowStockCount}
          icon={AlertTriangle}
          accentColor="amber"
        />
        <StatCard
          title="Out of Stock / Maintenance"
          value={outOfStockCount}
          icon={Wrench}
          accentColor="purple"
        />
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#1d2b3c] pb-3">
        <button
          onClick={() => setActiveTab('items')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'items'
              ? 'bg-[#00e5c9] text-black shadow-md shadow-[#00e5c9]/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#121c2a] border border-slate-200 dark:border-transparent'
          }`}
        >
          <Boxes className="h-4 w-4" />
          Equipment & Service Items ({items.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'categories'
              ? 'bg-[#00e5c9] text-black shadow-md shadow-[#00e5c9]/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#121c2a] border border-slate-200 dark:border-transparent'
          }`}
        >
          <Layers className="h-4 w-4" />
          Categories ({categories.length})
        </button>
      </div>

      {/* TAB 1: EQUIPMENT & SERVICE ITEMS */}
      {activeTab === 'items' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col lg:flex-row gap-3 items-center justify-between rounded-xl bg-white dark:bg-[#0e1622] border border-slate-200 dark:border-[#1d2b3c] p-4 shadow-sm">
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search gear by name, SKU, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 text-xs bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#00a894] dark:focus:ring-[#00e5c9]"
              >
                <option value="All">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 text-xs bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#00a894] dark:focus:ring-[#00e5c9]"
              >
                <option value="All">All Stock Statuses</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-[#1d2b3c] bg-white dark:bg-[#0e1622] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-[#121c2b] text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-[#1d2b3c]">
                  <tr>
                    <th className="px-5 py-3.5">Item & SKU</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Stock Status</th>
                    <th className="px-5 py-3.5 text-right">Unit Price / Value</th>
                    <th className="px-5 py-3.5 text-right">Rental Rate</th>
                    <th className="px-5 py-3.5 text-center">Quick Adjust</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-[#1a2737]">
                  {filteredItems.map((item) => {
                    const stockPercent = Math.min(100, Math.round((item.availableQuantity / Math.max(1, item.totalStock)) * 100));
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-[#131d2b] transition-colors">
                        {/* Name & SKU */}
                        <td className="px-5 py-4">
                          <div className="font-medium text-slate-900 dark:text-white">{item.name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{item.sku}</span>
                            {item.unit && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#182637] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#23354b]">
                                {item.unit}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 dark:bg-[#162232] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#223348]">
                            {item.category}
                          </span>
                        </td>

                        {/* Stock Status & Quantity */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${
                                item.status === 'In Stock'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                                  : item.status === 'Low Stock'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                                  : item.status === 'Maintenance'
                                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/25'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                              }`}
                            >
                              {item.status}
                            </span>
                            <span className="text-xs font-semibold text-slate-900 dark:text-white">
                              {item.availableQuantity} / {item.totalStock}
                            </span>
                          </div>
                          {/* Stock Progress Bar */}
                          <div className="w-28 h-1.5 bg-slate-200 dark:bg-[#182637] rounded-full overflow-hidden mt-1.5">
                            <div
                              className={`h-full rounded-full transition-all ${
                                stockPercent > 50
                                  ? 'bg-[#00e5c9]'
                                  : stockPercent > 20
                                  ? 'bg-amber-400'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${stockPercent}%` }}
                            />
                          </div>
                        </td>

                        {/* Unit Price */}
                        <td className="px-5 py-4 text-right font-medium text-slate-800 dark:text-slate-200">
                          {formatCurrency(item.unitPrice)}
                        </td>

                        {/* Rental Rate */}
                        <td className="px-5 py-4 text-right font-semibold text-[#00897b] dark:text-[#00e5c9]">
                          {formatCurrency(item.rentalRate)}
                        </td>

                        {/* Quick Adjust */}
                        <td className="px-5 py-4 text-center">
                          <div className="inline-flex items-center rounded-lg border border-slate-300 dark:border-[#23354b] bg-slate-100 dark:bg-[#141e2b] p-0.5">
                            <button
                              onClick={() => adjustStock(item, -1)}
                              disabled={item.availableQuantity <= 0}
                              className="px-2 py-0.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1e2f45] rounded disabled:opacity-30"
                              title="Decrease available stock"
                            >
                              -
                            </button>
                            <span className="px-2 text-xs font-mono font-bold text-slate-900 dark:text-white">
                              {item.availableQuantity}
                            </span>
                            <button
                              onClick={() => adjustStock(item, 1)}
                              disabled={item.availableQuantity >= item.totalStock}
                              className="px-2 py-0.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1e2f45] rounded disabled:opacity-30"
                              title="Increase available stock"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditItemModal(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#182535] transition-colors"
                              title="Edit item"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ type: 'item', item })}
                              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                              title="Delete item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredItems.length === 0 && (
                <div className="text-center py-16">
                  <Boxes className="mx-auto h-12 w-12 text-slate-600 mb-3" />
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">No Equipment Items Found</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    {searchQuery || selectedCategory !== 'All' || selectedStatus !== 'All'
                      ? 'No inventory items matched your active search or filters.'
                      : 'Add your first piece of audiovisual gear or service item to get started.'}
                  </p>
                  <button
                    onClick={openCreateItemModal}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#00a894] dark:bg-[#00e5c9] px-4 py-2 text-xs font-semibold text-white dark:text-black hover:bg-[#008f7e] dark:hover:brightness-110 shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Equipment
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INVENTORY CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((cat) => {
              const count = categoryCounts[cat.name] || 0;
              return (
                <div
                  key={cat.id}
                  className="group relative rounded-xl bg-white dark:bg-[#0e1622] border border-slate-200 dark:border-[#1d2b3c] p-5 hover:border-slate-300 dark:hover:border-[#2b3e55] transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-md"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold shadow-inner"
                          style={{
                            backgroundColor: `${cat.color}20`,
                            border: `1px solid ${cat.color}50`,
                            color: cat.color,
                          }}
                        >
                          <Boxes className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-[#00897b] dark:group-hover:text-[#00e5c9] transition-colors">
                            {cat.name}
                          </h3>
                          <span className="inline-flex items-center text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-[#162232] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#213348] mt-0.5">
                            {cat.code}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          cat.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                            : 'bg-slate-500/10 text-slate-400 border border-slate-500/25'
                        }`}
                      >
                        {cat.status}
                      </span>
                    </div>

                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {cat.description || 'No description added.'}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-[#1a2636] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <Package className="h-3.5 w-3.5 text-[#00897b] dark:text-[#00e5c9]" />
                      <span>
                        <strong className="text-slate-900 dark:text-white">{count}</strong> inventory {count === 1 ? 'item' : 'items'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditCategoryModal(cat)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#182535] transition-colors"
                        title="Edit category"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ type: 'category', item: cat })}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                        title="Delete category"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add / Edit Equipment Item Modal */}
      <Modal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        title={editingItem ? 'Edit Equipment / Service Item' : 'Add New Equipment / Service Item'}
      >
        <form onSubmit={handleSaveItem} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Item Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. L-Acoustics K2 Line Array Speaker Module"
              value={itemFormData.name || ''}
              onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                SKU / Asset Code <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="SKU-SND-001"
                value={itemFormData.sku || ''}
                onChange={(e) => setItemFormData({ ...itemFormData, sku: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 font-mono uppercase bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Category <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={itemFormData.category || ''}
                onChange={(e) => setItemFormData({ ...itemFormData, category: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Unit Asset Value (LKR)
              </label>
              <input
                type="number"
                min="0"
                value={itemFormData.unitPrice ?? 0}
                onChange={(e) => setItemFormData({ ...itemFormData, unitPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Standard Event Rental Rate (LKR) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={itemFormData.rentalRate ?? 0}
                onChange={(e) => setItemFormData({ ...itemFormData, rentalRate: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded-lg text-slate-900 dark:text-white font-semibold text-[#00897b] dark:text-[#00e5c9] focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Total Stock</label>
              <input
                type="number"
                min="1"
                required
                value={itemFormData.totalStock ?? 1}
                onChange={(e) => {
                  const total = Number(e.target.value);
                  setItemFormData({
                    ...itemFormData,
                    totalStock: total,
                    availableQuantity: Math.min(total, itemFormData.availableQuantity ?? total),
                  });
                }}
                className="w-full px-3 py-2 bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Available Now</label>
              <input
                type="number"
                min="0"
                max={itemFormData.totalStock || 9999}
                value={itemFormData.availableQuantity ?? 1}
                onChange={(e) => setItemFormData({ ...itemFormData, availableQuantity: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Unit of Measure</label>
              <input
                type="text"
                placeholder="Unit, Set, Day"
                value={itemFormData.unit || 'Unit'}
                onChange={(e) => setItemFormData({ ...itemFormData, unit: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="Features, accessories included in package..."
              value={itemFormData.description || ''}
              onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Technical Specifications</label>
            <input
              type="text"
              placeholder="Power wattage, DMX channels, throw distance, dimensions..."
              value={itemFormData.specifications || ''}
              onChange={(e) => setItemFormData({ ...itemFormData, specifications: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-[#1d2b3c]">
            <button
              type="button"
              onClick={() => setIsItemModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-[#162232] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1d2d42] text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#00a894] to-[#00897b] dark:from-[#00e5c9] dark:to-[#00b8a2] text-white dark:text-black text-xs font-semibold hover:brightness-110 shadow-md shadow-[#00e5c9]/20"
            >
              {editingItem ? 'Save Changes' : 'Add to Inventory'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create Inventory Category'}
      >
        <form onSubmit={handleSaveCategory} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Category Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sound & Audio Gear, Stage Lighting"
              value={categoryFormData.name || ''}
              onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Category Code</label>
              <input
                type="text"
                placeholder="e.g. SOUND, LIGHTING"
                value={categoryFormData.code || ''}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 font-mono uppercase bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
              <select
                value={categoryFormData.status || 'Active'}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, status: e.target.value as any })}
                className="w-full px-3 py-2 bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="What types of equipment belong here..."
              value={categoryFormData.description || ''}
              onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-[#131d2a] border border-slate-300 dark:border-[#1f2f42] rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#00a894] dark:focus:border-[#00e5c9]"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-[#1d2b3c]">
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-[#162232] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1d2d42] text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#00a894] to-[#00897b] dark:from-[#00e5c9] dark:to-[#00b8a2] text-white dark:text-black text-xs font-semibold hover:brightness-110 shadow-md shadow-[#00e5c9]/20"
            >
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          title={deleteTarget?.type === 'item' ? 'Delete Equipment Item' : 'Delete Category'}
          message={`Are you sure you want to delete "${deleteTarget?.item?.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          isDestructive={true}
        />
      </div>
    </AppShell>
  );
}
