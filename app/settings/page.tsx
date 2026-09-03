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
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { mockStore } from '@/lib/mock/store';
import { CompanyProfile } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/utils';

export default function SettingsPage() {
  const { showToast } = useToast();
  const [profile, setProfile] = useState<CompanyProfile>(mockStore.getCompanyProfile());
  const [services, setServices] = useState(mockStore.getServicesCatalog());

  // New service quick add form
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCat, setNewServiceCat] = useState<any>('Production');
  const [newServicePrice, setNewServicePrice] = useState(50000);

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    mockStore.saveCompanyProfile(profile);
    showToast('✓ Company profile settings saved');
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    const updated = mockStore.saveService({
      name: newServiceName,
      category: newServiceCat,
      description: 'Custom configured production package',
      unitPrice: Number(newServicePrice),
    });

    setServices(updated);
    setNewServiceName('');
    showToast('✓ New service added to catalog');
  };

  const handleResetDefaults = () => {
    if (confirm('Reset entire system to initial demo state? All custom added events and payments will be refreshed.')) {
      mockStore.resetStoreToDefaults();
      setProfile(mockStore.getCompanyProfile());
      setServices(mockStore.getServicesCatalog());
      showToast('✓ Workspace reset to initial demo state');
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
          <div className="lg:col-span-2 rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#1a2738]">
              <Building className="h-5 w-5 text-[#00e5c9]" />
              <div>
                <h2 className="text-base font-bold text-white">Company Profile & Invoicing Details</h2>
                <p className="text-xs text-slate-400">These details appear on customer invoices and official proposals</p>
              </div>
            </div>

            <form onSubmit={handleSaveCompany} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Company Registered Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:outline-none focus:border-[#00e5c9]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Brand Tagline</label>
                  <input
                    type="text"
                    value={profile.tagline}
                    onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                    className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:outline-none focus:border-[#00e5c9]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Phone</label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Head Office Address</label>
                <input
                  type="text"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Tax Identification Number (TIN)</label>
                  <input
                    type="text"
                    value={profile.taxNumber}
                    onChange={(e) => setProfile({ ...profile, taxNumber: e.target.value })}
                    className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Business Registration No (BR)</label>
                  <input
                    type="text"
                    value={profile.businessRegistration}
                    onChange={(e) => setProfile({ ...profile, businessRegistration: e.target.value })}
                    className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Remittance Bank Details */}
              <div className="rounded-xl border border-[#233549] bg-[#0c1420] p-4 space-y-3">
                <span className="font-semibold text-white block">Remittance Bank Account (For Invoices)</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={profile.bankName}
                      onChange={(e) => setProfile({ ...profile, bankName: e.target.value })}
                      className="w-full rounded border border-[#233549] bg-[#111c29] p-2 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Account Number</label>
                    <input
                      type="text"
                      value={profile.bankAccount}
                      onChange={(e) => setProfile({ ...profile, bankAccount: e.target.value })}
                      className="w-full rounded border border-[#233549] bg-[#111c29] p-2 text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Branch</label>
                    <input
                      type="text"
                      value={profile.bankBranch}
                      onChange={(e) => setProfile({ ...profile, bankBranch: e.target.value })}
                      className="w-full rounded border border-[#233549] bg-[#111c29] p-2 text-white text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Invoice Payment Terms & Conditions</label>
                <textarea
                  value={profile.invoiceTerms}
                  onChange={(e) => setProfile({ ...profile, invoiceTerms: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-[#233549] bg-[#111c29] p-2.5 text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#00e5c9] px-5 py-2 text-xs font-bold text-black hover:bg-[#1affda]"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Company Settings</span>
                </button>
              </div>
            </form>
          </div>

          {/* Service Rate Card Configuration (1 col) */}
          <div className="space-y-6">
            <div className="rounded-xl border border-[#1d2b3c] bg-[#0c1420] p-6 shadow-sm space-y-4 text-xs">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Production Services & Catalog
              </h2>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {services.map((srv: any) => (
                  <div
                    key={srv.id}
                    className="flex justify-between items-center p-2.5 rounded-lg bg-[#0f1724] border border-[#1d2a3a]"
                  >
                    <div>
                      <span className="font-semibold text-white block">{srv.name}</span>
                      <span className="text-[10px] text-slate-400">{srv.category}</span>
                    </div>
                    <span className="font-mono font-semibold text-white">
                      {formatCurrency(srv.unitPrice)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Add Service */}
              <form onSubmit={handleAddService} className="pt-3 border-t border-[#1c2a3a] space-y-2.5">
                <span className="font-semibold text-white block">Add Service to Catalog</span>
                <input
                  type="text"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  placeholder="e.g. 4x Sparkular Pyrotechnics"
                  className="w-full rounded border border-[#233549] bg-[#111c29] p-2 text-white text-xs focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newServiceCat}
                    onChange={(e) => setNewServiceCat(e.target.value)}
                    className="w-full rounded border border-[#233549] bg-[#111c29] p-2 text-white text-xs focus:outline-none"
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
                    className="w-full rounded border border-[#233549] bg-[#111c29] p-2 text-white text-xs font-mono focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-[#192738] border border-[#233549] py-2 text-xs font-semibold text-[#00e5c9] hover:bg-[#203144]"
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
