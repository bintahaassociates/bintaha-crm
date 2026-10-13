import { useState } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import Layout, { type PageId } from '@/components/Layout';
import ErrorBoundary from '@/components/ErrorBoundary';
import Dashboard from '@/pages/Dashboard';
import Properties from '@/pages/Properties';
import Leads from '@/pages/Leads';
import Dealers from '@/pages/Dealers';
import Allottees from '@/pages/Allottees';
import Services from '@/pages/Services';
import Bookings from '@/pages/Bookings';
import Projects from '@/pages/Projects';
import Staff from '@/pages/Staff';
import Settings from '@/pages/Settings';
import WebsiteManagement from '@/pages/WebsiteManagement';

const pageConfig: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Overview of your real estate business performance' },
  properties: { title: 'Property Inventory', subtitle: 'Manage and track all your plots and properties' },
  leads: { title: 'Leads & Clients', subtitle: 'Track your sales pipeline and client interactions' },
  dealers: { title: 'Dealers Directory', subtitle: 'Manage registered real estate dealers and network partners' },
  allottees: { title: 'Allottees Directory', subtitle: 'Verified plot files, owners registry, and block records' },
  services: { title: 'Services & Operations', subtitle: 'Manage construction, gray structure, and client service requests' },
  bookings: { title: 'Bookings & Installments', subtitle: 'Record sales, generate receipts, and track payment schedules' },
  projects: { title: 'Projects Overview', subtitle: 'Manage societies, buildings, and construction progress' },
  staff: { title: 'Agents & Staff Activity', subtitle: 'Monitor staff performance, call logs, and client interactions' },
  website: { title: 'Website Management', subtitle: 'Manage your public website content, banners, and inquiries' },
  settings: { title: 'Settings', subtitle: 'Manage your CRM preferences and configuration' },
};

function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');

  function renderPage() {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'properties': return <Properties />;
      case 'leads': return <Leads />;
      case 'dealers' as any: return <Dealers />;
      case 'allottees' as any: return <Allottees />;
      case 'services' as any: return <Services />;
      case 'bookings': return <Bookings />;
      case 'projects': return <Projects />;
      case 'staff': return <Staff />;
      case 'website': return <WebsiteManagement />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  }

  const config = pageConfig[currentPage] || {
    title: 'Bin Taha CRM',
    subtitle: 'Real Estate Management System',
  };

  return (
    <ThemeProvider>
      <Layout
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        title={config.title}
        subtitle={config.subtitle}
      >
        <ErrorBoundary key={currentPage}>
          {renderPage()}
        </ErrorBoundary>
      </Layout>
    </ThemeProvider>
  );
}

export default App;
