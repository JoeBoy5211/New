import { AdminLayout } from '@/components/AdminLayout';
import { PageHeader } from '@/components/PageHeader';
import { HomeBannersManager } from '@/components/HomeBannersManager';

export default function Settings() {
  return (
    <AdminLayout>
      <PageHeader title="Settings" description="Manage platform preferences and configuration." />
      <HomeBannersManager />
    </AdminLayout>
  );
}
