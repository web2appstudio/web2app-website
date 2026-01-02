'use client';

import { useEffect, useState, use } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import CategoryForm from '../../components/CategoryForm';
import type { Category } from '@/lib/types';
import '../../admin.css';

export default function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const response = await fetch(`/api/admin/categories/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch category');
        }

        setCategory(data.category);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategory();
  }, [id]);

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Edit Category</h1>
          <p className="page-subtitle">
            Configure default settings for {category?.name || id} apps
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Loading category...</p>
        </div>
      ) : error ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3 className="empty-state-title">Error Loading Category</h3>
          <p className="empty-state-text">{error}</p>
        </div>
      ) : category ? (
        <CategoryForm category={category} />
      ) : null}
    </DashboardLayout>
  );
}
