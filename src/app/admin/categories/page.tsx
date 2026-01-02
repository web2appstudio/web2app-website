'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '../components/DashboardLayout';
import type { Category } from '@/lib/types';
import { CATEGORY_COLORS, WINDOW_PRESETS } from '@/lib/types';
import '../admin.css';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch categories');
      }

      setCategories(data.categories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const getCategoryColor = (categoryId: string) => {
    return CATEGORY_COLORS[categoryId] || '#6366f1';
  };

  const getWindowSize = (category: Category) => {
    if (!category.configuration) return 'N/A';
    const config = category.configuration;
    if (config.windowWidth && config.windowHeight) {
      return `${config.windowWidth}x${config.windowHeight}`;
    }
    const preset = WINDOW_PRESETS[config.windowPreset];
    if (preset) {
      return `${preset.width}x${preset.height}`;
    }
    return config.windowPreset;
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">
            Manage category default configurations for app building
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Categories</div>
          <div className="stat-value">{categories.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">With Notifications</div>
          <div className="stat-value">
            {categories.filter(c => c.configuration?.notifications).length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">With Ad Blocking</div>
          <div className="stat-value">
            {categories.filter(c => c.configuration?.adBlocking).length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">With Tabs</div>
          <div className="stat-value">
            {categories.filter(c => c.configuration?.tabbedBrowsing).length}
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="form-section" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" style={{ width: 20, height: 20, flexShrink: 0, marginTop: 2 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <div>
            <h3 className="form-section-title" style={{ marginBottom: 4 }}>
              Category Configurations
            </h3>
            <p style={{ color: '#888', fontSize: 14, margin: 0 }}>
              These settings are applied as defaults when users select a category in the Build Studio.
              Changes here will sync to the desktop app automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Loading categories...</p>
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
          <h3 className="empty-state-title">Error Loading Categories</h3>
          <p className="empty-state-text">{error}</p>
          <button className="btn btn-primary" onClick={fetchCategories}>
            Try Again
          </button>
        </div>
      ) : categories.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h3 className="empty-state-title">No categories found</h3>
          <p className="empty-state-text">
            Category configuration files need to be created in the GitHub repository.
          </p>
        </div>
      ) : (
        <div className="template-table">
          <div className="table-header" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 100px' }}>
            <div>Category</div>
            <div>Window</div>
            <div>Tabs</div>
            <div>Notifications</div>
            <div>Ad Block</div>
            <div>Actions</div>
          </div>

          {categories.map(category => (
            <div key={category.id} className="table-row" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 100px' }}>
              <div className="template-info">
                <div
                  className="template-icon"
                  style={{
                    backgroundColor: getCategoryColor(category.id),
                    fontSize: '18px',
                  }}
                >
                  {category.emoji || category.icon?.charAt(0) || '?'}
                </div>
                <div className="template-details">
                  <div className="template-name">{category.name}</div>
                  <div className="template-url">{category.shortDescription || category.description}</div>
                </div>
              </div>

              <div style={{ fontSize: 13 }}>
                <span style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  background: '#1a1a1a',
                  borderRadius: 4,
                  color: '#888'
                }}>
                  {category.configuration?.windowStyle || 'normal'} • {getWindowSize(category)}
                </span>
              </div>

              <div>
                {category.configuration?.tabbedBrowsing ? (
                  <span className="badge badge-tier">Yes</span>
                ) : (
                  <span className="badge badge-free">No</span>
                )}
              </div>

              <div>
                {category.configuration?.notifications ? (
                  <span className="badge badge-tier">Yes</span>
                ) : (
                  <span className="badge badge-free">No</span>
                )}
              </div>

              <div>
                {category.configuration?.adBlocking ? (
                  <span className="badge badge-tier">Yes</span>
                ) : (
                  <span className="badge badge-free">No</span>
                )}
              </div>

              <div className="table-actions">
                <Link
                  href={`/admin/categories/${category.id}`}
                  className="action-btn"
                  title="Edit"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
