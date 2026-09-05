'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building,
  Save,
  RotateCcw,
  Sparkles,
  Layers,
  Users,
  CreditCard,
  Sun,
  Moon,
  Laptop,
  Palette,
  CheckCircle2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { settingsService } from '@/lib/api/reportService';
import { serviceService } from '@/lib/api/serviceService';
import { CompanyProfile, ServiceCatalogItem } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';
import { useTheme, Theme } from '@/lib/theme/ThemeContext';
import { formatCurrency } from '@/lib/utils';

export default function SettingsPage() {
  const { showToast } = useToast();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [profile, setProfile] = useState<CompanyProfile>({
    name: 'Seekers’s Entertainment (pvt) Ltd',
    tagline: 'Premier Audio-Visual Production, DJ & Event Technology',
    email: 'ops@seekersentertainment.lk',
    phone: `+94 71 035 87 23 (Voice / WhatsApp)
+94 76 468 00 00
+971 54 544 66 09 (UAE)`,
    address: 'No. 42, Independence Avenue, Colombo 07, Sri Lanka',
    taxNumber: 'TIN-109482710-8000',
    businessRegistration: 'PV-0028941',
    currency: 'LKR',
    bankName: 'BOC bank',
    bankAccount: '94630427',
    bankBranch: 'Walgama',
    logoUrl: '/seekers-logo.svg',
    invoiceTerms: `* Payment method can be cash, bank transfer.
* Payment must be made in full without deducting any tax.
* Transportation, handling, food, labor charges, are included in this rate.
* Make all checks payable to “ Seekers’s Entertainment (pvt) Ltd”`,
  });
  const [services, setServices] = useState<ServiceCatalogItem[]>([]);

  // New service quick add form
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCat, setNewServiceCat] = useState<any>('Production');
  const [newServicePrice, setNewServicePrice] = useState(50000);

  const loadData = () => {
    settingsService.getCompanyProfile().then((p) => {
      if (p && p.name) setProfile(p);
    });
    serviceService.getServices().then((s) => {
      if (Array.isArray(s) && s.length > 0) setServices(s);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await settingsService.updateCompanyProfile(profile);
      showToast('✓ Company profile settings saved');
    } catch (err: any) {
      showToast(err.message || 'Failed to save settings', 'error');
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    try {
      await serviceService.createService({
        name: newServiceName,
        category: newServiceCat,
        description: 'Custom configured production package',
        unitPrice: Number(newServicePrice),
      });

      setNewServiceName('');
      loadData();
      showToast('✓ New service added to catalog');
    } catch (err: any) {
      showToast(err.message || 'Failed to add service', 'error');
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Clear local cache and refresh settings from backend?')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('seekers_company_profile');
        localStorage.removeItem('seekers_services_list');
      }
      loadData();
      showToast('✓ Settings refreshed from live backend');
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="System & Workspace Settings"
          subtitle="Configure company details, standard service rate cards, banking remittance, and operational preferences"
          breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Settings' }]}
          actions={
            <button
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-900/50 bg-rose-950/20 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-950/40 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset to Demo Data</span>
            </button>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Company Profile Form (2 cols) */}
          <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-[#1d2b3c] bg-white dark:bg-[#0c1420] p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-[#1a2738]">
              <Building className="h-5 w-5 text-[#00897b] dark:text-[#00e5c9]" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Company Profile & Invoicing Details</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">These details appear on customer invoices and official proposals</p>
              </div>
            </div>

            <form onSubmit={handleSaveCompany} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Company Registered Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#00e5c9]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Brand Tagline</label>
                  <input
                    type="text"
                    value={profile.tagline}
                    onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#00e5c9]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#00e5c9]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Contact Numbers (Hotline / WhatsApp / Overseas)
                  </label>
                  <textarea
                    rows={3}
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#00e5c9] text-xs font-mono"
                    placeholder="+94 71 035 87 23 (Voice / WhatsApp)&#10;+94 76 468 00 00&#10;+971 54 544 66 09 (UAE)"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">One number per line. These display in the quotation and invoice headers.</p>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Head Office Address</label>
                <input
                  type="text"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#00e5c9]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Tax Identification Number (TIN)</label>
                  <input
                    type="text"
                    value={profile.taxNumber}
                    onChange={(e) => setProfile({ ...profile, taxNumber: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#00e5c9]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Business Registration No (BR)</label>
                  <input
                    type="text"
                    value={profile.businessRegistration}
                    onChange={(e) => setProfile({ ...profile, businessRegistration: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#00e5c9]"
                  />
                </div>
              </div>

              {/* Remittance Bank Details */}
              <div className="rounded-xl border border-slate-200 dark:border-[#233549] bg-slate-50 dark:bg-[#0c1420] p-4 space-y-3">
                <span className="font-semibold text-slate-900 dark:text-white block">Remittance Bank Account (For Invoices)</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 text-[11px] mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={profile.bankName}
                      onChange={(e) => setProfile({ ...profile, bankName: e.target.value })}
                      className="w-full rounded border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#00e5c9]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 text-[11px] mb-1">Account Number</label>
                    <input
                      type="text"
                      value={profile.bankAccount}
                      onChange={(e) => setProfile({ ...profile, bankAccount: e.target.value })}
                      className="w-full rounded border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-[#00e5c9]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 text-[11px] mb-1">Branch</label>
                    <input
                      type="text"
                      value={profile.bankBranch}
                      onChange={(e) => setProfile({ ...profile, bankBranch: e.target.value })}
                      className="w-full rounded border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#00e5c9]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Invoice Payment Terms & Conditions</label>
                <textarea
                  value={profile.invoiceTerms}
                  onChange={(e) => setProfile({ ...profile, invoiceTerms: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#00e5c9]"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#00a894] dark:bg-[#00e5c9] px-5 py-2 text-xs font-bold text-white dark:text-[#041816] hover:bg-[#008f7e] dark:hover:bg-[#1affda] shadow-sm transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Company Settings</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Theme Settings & Service Rate Cards (1 col) */}
          <div className="space-y-6">
            {/* Appearance & Theme Configuration Card */}
            <div className="rounded-xl border border-slate-200 dark:border-[#1d2b3c] bg-white dark:bg-[#0c1420] p-6 shadow-sm space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1a2738]">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-[#00897b] dark:text-[#00e5c9]" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Appearance & Theme
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-[#00897b] dark:text-[#00e5c9] bg-[#00e5c9]/10 px-2 py-0.5 rounded-full capitalize font-semibold">
                  {theme === 'system' ? `System (${resolvedTheme})` : theme}
                </span>
              </div>

              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Customize your operational console appearance. Preferences are automatically saved to your browser.
              </p>

              <div className="grid grid-cols-1 gap-2.5">
                {/* Dark Console Card */}
                <button
                  type="button"
                  onClick={() => {
                    setTheme('dark');
                    showToast('✓ Dark console theme activated');
                  }}
                  className={`group relative flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                    theme === 'dark'
                      ? 'border-[#00e5c9] bg-[#00e5c9]/10 shadow-sm'
                      : 'border-slate-200 dark:border-[#1e2e42] bg-slate-50 dark:bg-[#111c29] hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-[#090d12] border border-slate-300 dark:border-[#233549] text-[#00897b] dark:text-[#00e5c9]">
                      <Moon className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="block font-semibold text-slate-900 dark:text-white">Dark Console</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Cyber Teal & deep obsidian night</span>
                    </div>
                  </div>
                  {theme === 'dark' && <CheckCircle2 className="h-4 w-4 text-[#00897b] dark:text-[#00e5c9]" />}
                </button>

                {/* Light Theme Card */}
                <button
                  type="button"
                  onClick={() => {
                    setTheme('light');
                    showToast('✓ Light theme activated');
                  }}
                  className={`group relative flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                    theme === 'light'
                      ? 'border-[#00a894] dark:border-[#00e5c9] bg-[#00a894]/10 dark:bg-[#00e5c9]/10 shadow-sm'
                      : 'border-slate-200 dark:border-[#1e2e42] bg-slate-50 dark:bg-[#111c29] hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f8fafc] border border-[#cbd5e1] text-amber-500 shadow-sm">
                      <Sun className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="block font-semibold text-slate-900 dark:text-white">Clean Light</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Crisp high-contrast day mode</span>
                    </div>
                  </div>
                  {theme === 'light' && <CheckCircle2 className="h-4 w-4 text-[#00897b] dark:text-[#00e5c9]" />}
                </button>

                {/* System Default Card */}
                <button
                  type="button"
                  onClick={() => {
                    setTheme('system');
                    showToast('✓ Following operating system theme');
                  }}
                  className={`group relative flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                    theme === 'system'
                      ? 'border-[#00a894] dark:border-[#00e5c9] bg-[#00a894]/10 dark:bg-[#00e5c9]/10 shadow-sm'
                      : 'border-slate-200 dark:border-[#1e2e42] bg-slate-50 dark:bg-[#111c29] hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#090d12] to-[#f8fafc] border border-slate-200 dark:border-[#233549] text-indigo-500 dark:text-indigo-400 shadow-sm">
                      <Laptop className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="block font-semibold text-slate-900 dark:text-white">Sync with System</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Automatic OS theme detection</span>
                    </div>
                  </div>
                  {theme === 'system' && <CheckCircle2 className="h-4 w-4 text-[#00897b] dark:text-[#00e5c9]" />}
                </button>
              </div>
            </div>

            {/* Production Services & Catalog */}
            <div className="rounded-xl border border-slate-200 dark:border-[#1d2b3c] bg-white dark:bg-[#0c1420] p-6 shadow-sm space-y-4 text-xs">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Production Services & Catalog
              </h2>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {services.map((srv: any) => (
                  <div
                    key={srv.id}
                    className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 dark:bg-[#0f1724] border border-slate-200 dark:border-[#1d2a3a]"
                  >
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white block">{srv.name}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">{srv.category}</span>
                    </div>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(srv.unitPrice)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Add Service */}
              <form onSubmit={handleAddService} className="pt-3 border-t border-slate-100 dark:border-[#1c2a3a] space-y-2.5">
                <span className="font-semibold text-slate-900 dark:text-white block">Add Service to Catalog</span>
                <input
                  type="text"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  placeholder="e.g. 4x Sparkular Pyrotechnics"
                  className="w-full rounded border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#00e5c9]"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newServiceCat}
                    onChange={(e) => setNewServiceCat(e.target.value)}
                    className="w-full rounded border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#00e5c9]"
                  >
                    <option value="DJ">DJ</option>
                    <option value="Sound">Sound</option>
                    <option value="Lighting">Lighting</option>
                    <option value="LED">LED Screen</option>
                    <option value="Production">Production</option>
                  </select>
                  <input
                    type="number"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(Number(e.target.value))}
                    placeholder="Rate"
                    className="w-full rounded border border-slate-300 dark:border-[#233549] bg-white dark:bg-[#111c29] p-2 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-[#00e5c9]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-slate-100 dark:bg-[#192738] border border-slate-300 dark:border-[#233549] py-2 text-xs font-semibold text-[#00897b] dark:text-[#00e5c9] hover:bg-slate-200 dark:hover:bg-[#203144] transition-colors"
                >
                  + Add Service Package
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
