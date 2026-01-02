'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';
import CategoryForm from '../../components/CategoryForm';
import type { Category } from '@/lib/types';
import '../../admin.css';

function EditCategoryContent() {
  const params = useParams();
  const id = params.id as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Category ID is required');
      setIsLoading(false);
      return;
    }

    fetch(`/api/admin/categories/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setCategory(data.category);
        }
      })
      .catch(err => {
        setError(err.message || 'Failed to load category');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Loading category...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !category) {
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
          <h3 className="empty-state-title">Error Loading Category</h3>
          <p className="empty-state-text">{error || 'Category not found'}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Edit Category</h1>
          <p className="page-subtitle">
            Configure default settings for {category.name} apps
          </p>
        </div>
      </div>

      <CategoryForm category={category} />
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

export default function EditCategoryPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <EditCategoryContent />
    </Suspense>
  );
}
