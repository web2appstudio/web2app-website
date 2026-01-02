'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { use } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import TemplateForm from '../../components/TemplateForm';
import type { Template } from '@/lib/types';
import '../../admin.css';

interface PageProps {
  params: Promise<{ id: string }>;
}

function EditTemplateContent({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const category = searchParams.get('category');

  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!category) {
      setError('Category parameter is required');
      setIsLoading(false);
      return;
    }

    fetch(`/api/admin/templates/${id}?category=${category}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setTemplate(data.template);
        }
      })
      .catch(err => {
        setError(err.message || 'Failed to load template');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id, category]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Loading template...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !template) {
    return (
      <DashboardLayout>
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3 className="empty-state-title">Error Loading Template</h3>
          <p className="empty-state-text">{error || 'Template not found'}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Edit Template</h1>
          <p className="page-subtitle">
            Update the configuration for {template.name}
          </p>
        </div>
      </div>

      <TemplateForm template={template} isEditing />
    </DashboardLayout>
  );
}

function LoadingFallback() {
  return (
    <DashboardLayout>
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Loading...</p>
      </div>
    </DashboardLayout>
  );
}

export default function EditTemplatePage({ params }: PageProps) {
  const { id } = use(params);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <EditTemplateContent id={id} />
    </Suspense>
  );
}
