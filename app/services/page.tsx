'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Plus,
  Search,
  LayoutGrid,
  List,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Tag,
  DollarSign,
  Layers,
  Check,
  Package,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { serviceService } from '@/lib/api/serviceService';
import { ServiceCatalogItem } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Sound: { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-500/30' },
  DJ: { bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-500/30' },
  Lighting: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-500/30' },
  LED: { bg: 'bg-cyan-50 dark:bg-cyan-500/10', text: 'text-cyan-700 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-500/30' },
  Production: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-500/30' },
  'Special FX': { bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-500/30' },
  Other: { bg: 'bg-slate-100 dark:bg-slate-500/10', text: 'text-slate-700 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-500/30' },
};


export default function ServicesPage() {
  const { showToast } = useToast();

  const [services, setServices] = useState<ServiceCatalogItem[]>([]);
  const [backendCategories, setBackendCategories] = useState<string[]>([]);
  const [backendPresets, setBackendPresets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceCatalogItem | null>(null);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [formData, setFormData] = useState<{
    name: string;
    category: string;
    description: string;
    unitPrice: number;
    duration: string;
    features: string;
    isActive: boolean;
  }>({
    name: '',
    category: 'Sound',
    description: '',
    unitPrice: 50000,
    duration: 'Per Event',
    features: '',
    isActive: true,
  });

  // Delete Dialog State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ServiceCatalogItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [servicesData, categoriesData, presetsData] = await Promise.all([
        serviceService.getServices(),
        serviceService.getCategories(),
        serviceService.getPresets(),
      ]);

      if (Array.isArray(servicesData)) {
        setServices(servicesData);
      }
      if (Array.isArray(categoriesData) && categoriesData.length > 0) {
        setBackendCategories(categoriesData);
      }
      if (Array.isArray(presetsData)) {
        setBackendPresets(presetsData);
      }
    } catch (err: any) {
      showToast(err.message || 'Error loading services', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('seekers_services_updated', loadData);
    return () => window.removeEventListener('seekers_services_updated', loadData);
  }, []);

  // Compute live display categories from backend data and current services
  const displayCategories = useMemo(() => {
    const set = new Set<string>();
    backendCategories.forEach((c) => { if (c) set.add(c); });
    services.forEach((s) => { if (s.category) set.add(s.category); });
    const list = Array.from(set);
    return ['All', ...(list.length > 0 ? list : ['Sound', 'DJ', 'Lighting', 'LED', 'Production', 'Special FX'])];
  }, [backendCategories, services]);

  // Compute categories available in the modal dropdown
  const modalCategories = useMemo(() => {
    const set = new Set<string>();
    backendCategories.forEach((c) => { if (c && c !== 'All') set.add(c); });
    services.forEach((s) => { if (s.category && s.category !== 'All') set.add(s.category); });
    const list = Array.from(set);
    return list.length > 0 ? list : ['Sound', 'DJ', 'Lighting', 'LED', 'Production', 'Special FX'];
  }, [backendCategories, services]);

  // Filtered Services
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchesCategory =
        selectedCategory === 'All' || s.category.toLowerCase() === selectedCategory.toLowerCase();
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        s.name.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        (s.features && s.features.some((f) => f.toLowerCase().includes(q)));
      return matchesCategory && matchesSearch;
    });
  }, [services, selectedCategory, searchQuery]);

  // KPIs
  const totalCount = services.length;
  const activeCount = services.filter((s) => s.isActive !== false).length;
  const avgPrice = totalCount > 0 ? Math.round(services.reduce((sum, s) => sum + s.unitPrice, 0) / totalCount) : 0;

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    services.forEach((s) => {
      counts[s.category] = (counts[s.category] || 0) + 1;
    });
    return counts;
  }, [services]);

  // Dynamically extract real equipment and feature tags from database services
  const dynamicFeatureTags = useMemo(() => {
    const tagSet = new Set<string>();
    services.forEach((s) => {
      if (Array.isArray(s.features)) {
        s.features.forEach((feat) => {
          if (feat && feat.trim()) tagSet.add(feat.trim());
        });
      }
    });
    return Array.from(tagSet).slice(0, 15);
  }, [services]);

  const topCategory = useMemo(() => {
    let top = 'Sound';
    let max = 0;
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      if (count > max) {
        max = count;
        top = cat;
      }
    });
    return top;
  }, [categoryCounts]);

  const handleOpenAdd = () => {
    setEditingService(null);
    setIsCustomCategory(false);
    setCustomCategory('');
    setFormData({
      name: '',
      category: modalCategories[0] || 'Sound',
      description: '',
      unitPrice: 50000,
      duration: 'Per Event',
      features: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (service: ServiceCatalogItem) => {
    setEditingService(service);
    setIsCustomCategory(false);
    setCustomCategory('');
    setFormData({
      name: service.name,
      category: service.category,
      description: service.description || '',
      unitPrice: service.unitPrice,
      duration: service.duration || 'Per Event',
      features: service.features ? service.features.join('\n') : '',
      isActive: service.isActive !== false,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Please enter a package name', 'error');
      return;
    }

    const targetCategory = isCustomCategory ? customCategory.trim() : formData.category;
    if (!targetCategory) {
      showToast('Please select or specify a category', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedFeatures = formData.features
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean);

      const payload = {
        name: formData.name.trim(),
        category: targetCategory,
        description: formData.description.trim(),
        unitPrice: Number(formData.unitPrice) || 0,
        duration: formData.duration.trim() || 'Per Event',
        features: parsedFeatures,
        isActive: formData.isActive,
      };

      if (editingService) {
        await serviceService.updateService(editingService.id, payload);
        showToast('✓ Service package updated successfully');
      } else {
        await serviceService.createService(payload);
        showToast('✓ New service package created successfully');
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save service', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await serviceService.deleteService(itemToDelete.id);
      showToast(`✓ Service "${itemToDelete.name}" deleted successfully`);
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete service', 'error');
    }
  };

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Header */}
        <PageHeader
          title="Services & Rate Cards Catalog"
          subtitle="Manage professional sound packages, DJ gear, intelligent lighting trusses, LED walls, and event rates"
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Services Catalog' },
          ]}
          actions={
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 rounded-xl bg-[#00e5c9] px-4 py-2.5 text-xs font-bold text-[#041618] hover:bg-[#1affda] transition-all shadow-lg shadow-[#00e5c9]/15"
            >
              <Plus className="h-4 w-4" />
              <span>Add Service Package</span>
            </button>
          }
        />

        {/* Stats KPIs */}
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <StatCard
            compact
            title="Total Services"
            value={totalCount}
            icon={Sparkles}
            change={`${activeCount} active`}
            trend="up"
            accentColor="teal"
            onClick={() => setSelectedCategory('All')}
            className={selectedCategory === 'All' ? 'ring-2 ring-[#00a894] dark:ring-[#00e5c9]' : ''}
          />
          <StatCard
            compact
            title="Active Packages"
            value={activeCount}
            icon={Package}
            change="Ready for quotes"
            trend="up"
            accentColor="purple"
          />
          <StatCard
            compact
            title="Top Category"
            value={topCategory}
            icon={Layers}
            change={`${categoryCounts[topCategory] || 0} packages`}
            trend="neutral"
            accentColor="amber"
            onClick={() => setSelectedCategory(topCategory)}
            className={selectedCategory === topCategory ? 'ring-2 ring-[#ffb703]' : ''}
          />
          <StatCard
            compact
            title="Average Rate"
            value={formatCurrency(avgPrice, true)}
            icon={DollarSign}
            change="Catalog benchmark"
            trend="up"
            accentColor="emerald"
          />
        </div>

        {/* Controls: Search, Category Filters, and View Toggle */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 dark:border-[#1b293a] bg-white dark:bg-[#0c1420] p-3 shadow-sm">
          {/* Dynamic Category Tabs from Backend */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
            {displayCategories.map((cat) => {
              const count = cat === 'All' ? services.length : categoryCounts[cat] || 0;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${isSelected
                      ? 'bg-[#00e5c9] text-black shadow-md shadow-[#00e5c9]/20 font-bold'
                      : 'bg-slate-100 dark:bg-[#142030] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1a2c42] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-transparent'
                    }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${isSelected ? 'bg-black/20 text-black font-bold' : 'bg-slate-200 dark:bg-[#21344c] text-slate-600 dark:text-slate-400'
                      }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & View Mode */}
          <div className="flex items-center gap-2">
            <div className="relative min-w-[200px] flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search packages, features..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] py-1.5 pl-8 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-[#00a894] dark:focus:border-[#00e5c9] focus:outline-none"
              />
            </div>
            <div className="flex rounded-lg border border-slate-200 dark:border-[#233549] bg-slate-100 dark:bg-[#111c29] p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-[#1e2f42] text-[#00897b] dark:text-[#00e5c9] shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                title="Grid Cards"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`rounded p-1.5 transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-[#1e2f42] text-[#00897b] dark:text-[#00e5c9] shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                title="Table View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content View */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 dark:border-[#1b293a] bg-white dark:bg-[#0c1420]">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00e5c9] border-t-transparent" />
              <p className="text-xs text-slate-400">Loading services catalog...</p>
            </div>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-slate-200 dark:border-[#1b293a] bg-white dark:bg-[#0c1420] text-center p-6">
            <Sparkles className="h-10 w-10 text-slate-600 mb-3" />
            <p className="font-semibold text-slate-900 dark:text-white">No services found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              {searchQuery
                ? `No service matches "${searchQuery}". Try a different search term.`
                : 'No services available in this category. Click the button below to add one.'}
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#00e5c9] px-4 py-2 text-xs font-bold text-[#051319] hover:bg-[#1affda] transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add First Package</span>
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View Cards */
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredServices.map((service) => {
              const catTheme = CATEGORY_COLORS[service.category] || CATEGORY_COLORS.Other;
              return (
                <div
                  key={service.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-[#1c2a3d] bg-white dark:bg-[#0c1420] p-5 shadow-xl transition-all duration-300 hover:border-[#00e5c9]/50 hover:shadow-2xl hover:shadow-[#00e5c9]/5"
                >
                  <div>
                    {/* Top Badges & Actions */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-md border px-2.5 py-0.5 text-[11px] font-semibold ${catTheme.bg} ${catTheme.text} ${catTheme.border}`}
                        >
                          {service.category}
                        </span>
                        {service.duration && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-[#162232] px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent">
                            <Clock className="h-3 w-3 text-slate-400" />
                            <span>{service.duration}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(service)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#192738] hover:text-slate-900 dark:hover:text-white transition-colors"
                          title="Edit Service"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setItemToDelete(service);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                          title="Delete Service"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white group-hover:text-[#00e5c9] transition-colors line-clamp-1">
                      {service.name}
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {service.description || 'Standard high-grade event production specification.'}
                    </p>

                    {/* Features Checklist */}
                    {service.features && service.features.length > 0 && (
                      <div className="mt-4 space-y-1.5 border-t border-[#182535] pt-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Included Hardware & Personnel
                        </p>
                        <div className="space-y-1">
                          {service.features.slice(0, 4).map((feat, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                              <CheckCircle2 className="h-3.5 w-3.5 text-[#00e5c9] shrink-0" />
                              <span className="line-clamp-1">{feat}</span>
                            </div>
                          ))}
                          {service.features.length > 4 && (
                            <p className="text-[11px] text-slate-500 pl-5">
                              +{service.features.length - 4} more features included
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Price & Status Footer */}
                  <div className="mt-5 flex items-center justify-between border-t border-[#182535] pt-3.5">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Rate Card</span>
                      <span className="text-lg font-extrabold text-[#00e5c9] font-mono">
                        {formatCurrency(service.unitPrice)}
                      </span>
                    </div>
                    <div>
                      {service.isActive !== false ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2.5 py-1 text-[11px] font-semibold text-slate-400 border border-slate-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                          Archived
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-[#1c2a3d] bg-white dark:bg-[#0c1420] shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-[#1c2a3d] bg-slate-50 dark:bg-[#0f1926] text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Package Name & Spec</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Features Included</th>
                    <th className="py-3 px-4 text-right">Standard Rate</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#172433]">
                  {filteredServices.map((service) => {
                    const catTheme = CATEGORY_COLORS[service.category] || CATEGORY_COLORS.Other;
                    return (
                      <tr key={service.id} className="hover:bg-slate-50 dark:hover:bg-[#111c29] transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900 dark:text-white">{service.name}</p>
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {service.description || 'No description provided'}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${catTheme.bg} ${catTheme.text} ${catTheme.border}`}
                          >
                            {service.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300 font-mono">
                          {service.duration || 'Per Event'}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {service.features && service.features.length > 0 ? (
                            <span className="line-clamp-1">{service.features.join(', ')}</span>
                          ) : (
                            <span className="text-slate-500 italic">None specified</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#00e5c9]">
                          {formatCurrency(service.unitPrice)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {service.isActive !== false ? (
                            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                              Active
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-500/10 px-2 py-0.5 text-[10px] font-semibold text-slate-400 border border-slate-500/20">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(service)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#192738] hover:text-slate-900 dark:hover:text-white transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setItemToDelete(service);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add/Edit Service Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingService ? 'Edit Production Package' : 'Create New Service Package'}
          subtitle="Configure rate cards, durations, and bundled gear for live quotations"
          maxWidth="lg"
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            {/* Quick 1-Click Templates from Backend Presets */}
            {!editingService && backendPresets.length > 0 && (
              <div className="rounded-xl border border-slate-200 dark:border-[#1d2d3e] bg-slate-50 dark:bg-[#0f1722] p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-[#00e5c9]" /> Live 1-Click Package Templates
                  </span>
                  <span className="text-[10px] text-slate-500"></span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {backendPresets.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setIsCustomCategory(false);
                        setFormData({
                          name: preset.name,
                          category: preset.category,
                          unitPrice: preset.unitPrice,
                          duration: preset.duration || 'Per Event',
                          features: Array.isArray(preset.features)
                            ? preset.features.join('\n')
                            : (preset.features || ''),
                          description: preset.description || '',
                          isActive: true,
                        });
                        showToast(`✓ Loaded template: ${preset.name}`);
                      }}
                      className="rounded-lg border border-slate-300 dark:border-[#233549] bg-slate-100 dark:bg-[#142030] px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#192a3e] transition-all"
                    >
                      + {preset.name} ({formatCurrency(preset.unitPrice)})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Package Name */}
            <div>
              <label className="block font-medium text-slate-300 mb-1">Package / Service Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Luxury Wedding Audio & Moving Head Lighting"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white focus:border-[#00e5c9] focus:outline-none"
              />
            </div>

            {/* Category & Duration */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-medium text-slate-300">Production Category *</label>
                  <button
                    type="button"
                    onClick={() => setIsCustomCategory(!isCustomCategory)}
                    className="text-[10px] text-[#00e5c9] hover:underline"
                  >
                    {isCustomCategory ? 'Choose Existing' : '+ Custom Category'}
                  </button>
                </div>
                {isCustomCategory ? (
                  <input
                    type="text"
                    required
                    placeholder="Type new category (e.g. Drones, Staging)"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full rounded-lg border border-[#00a894] dark:border-[#00e5c9]/60 bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white focus:border-[#00e5c9] focus:outline-none"
                  />
                ) : (
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white focus:border-[#00e5c9] focus:outline-none"
                  >
                    {modalCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block font-medium text-slate-300 mb-1">Standard Duration / Timeslot</label>
                <input
                  type="text"
                  placeholder="e.g. 6 Hours, Per Event, Per Day"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white focus:border-[#00e5c9] focus:outline-none"
                />
              </div>
            </div>

            {/* Price & Active Status */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 items-center">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Standard Rate Card (LKR) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500">Rs.</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    placeholder="120000"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] py-2.5 pl-10 pr-3 font-mono font-bold text-slate-900 dark:text-white focus:border-[#00e5c9] focus:outline-none"
                  />
                </div>
              </div>
              <div className="pt-5">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] text-[#00897b] dark:text-[#00e5c9] focus:ring-0 focus:ring-offset-0"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">Active Package</span>
                    <span className="text-[11px] text-slate-400 block">Available for selection in quotations & events</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Included Features */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-medium text-slate-300">
                  Included Features & Hardware (One item per line)
                </label>
                {dynamicFeatureTags.length > 0 && (
                  <span className="text-[10px] text-slate-500">Quick add tags</span>
                )}
              </div>
              {dynamicFeatureTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {dynamicFeatureTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        const current = formData.features ? formData.features.trim().split('\n') : [];
                        if (!current.includes(tag)) {
                          setFormData({
                            ...formData,
                            features: [...current, tag].join('\n'),
                          });
                        }
                      }}
                      className="rounded bg-slate-100 dark:bg-[#162332] border border-slate-200 dark:border-[#233549] px-2 py-0.5 text-[10px] text-slate-600 dark:text-slate-400 hover:text-[#00e5c9] hover:border-[#00e5c9]/50 transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              )}
              <textarea
                rows={4}
                placeholder="Line Array Speakers x4&#10;Wireless Microphones x2&#10;Moving Head Stage Spotlights x4&#10;Sound Tech Included"
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 font-mono text-xs text-slate-900 dark:text-white focus:border-[#00e5c9] focus:outline-none"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Enter items separated by newlines. These appear as bullet points on client rate cards.
              </span>
            </div>

            {/* Description */}
            <div>
              <label className="block font-medium text-slate-300 mb-1">Detailed Description</label>
              <textarea
                rows={2}
                placeholder="Comprehensive description of the package, ideal audience, venue requirements, etc."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white focus:border-[#00e5c9] focus:outline-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-[#1c2a3a] pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg border border-slate-300 dark:border-[#233549] bg-slate-100 dark:bg-[#142030] px-4 py-2 font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1a2c42]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-[#00a894] dark:bg-[#00e5c9] px-5 py-2 font-bold text-slate-900 dark:text-white dark:text-[#051319] hover:bg-[#1affda] disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : editingService ? 'Save Changes' : 'Create Package'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDelete}
          title="Delete Service Package?"
          message={`Are you sure you want to permanently delete "${itemToDelete?.name}" from your catalog? Existing quotations and events will retain their locked rates.`}
          confirmLabel="Delete Package"
        />
      </div>
    </AppShell>
  );
}
