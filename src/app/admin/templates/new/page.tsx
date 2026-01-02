'use client';

import DashboardLayout from '../../components/DashboardLayout';
import TemplateForm from '../../components/TemplateForm';
import '../../admin.css';

export default function NewTemplatePage() {
  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">New Template</h1>
          <p className="page-subtitle">
            Create a new pre-configured template for Web2App Studio
          </p>
        </div>
      </div>

      <TemplateForm />
    </DashboardLayout>
  );
}
