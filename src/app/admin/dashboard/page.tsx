'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '../components/DashboardLayout';
import DeleteModal from '../components/DeleteModal';
import type { Template, Category } from '@/lib/types';
import { CATEGORY_COLORS, ICON_SHAPE_RADIUS } from '@/lib/types';
import { getIconRawUrl } from '@/lib/github';
import '../admin.css';

export default function DashboardPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFetchingIcons, setIsFetchingIcons] = useState(false);
  const [iconFetchResult, setIconFetchResult] = useState<{
    success: number;
    failed: number;
    skipped: number;
  } | null>(null);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/templates');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch templates');
      }

      setTemplates(data.templates);
      setCategories(data.categories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all' || template.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/admin/templates/${deleteTarget.id}?category=${deleteTarget.category}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete template');
      }

      // Remove from local state
      setTemplates(prev => prev.filter(t => t.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete template');
    } finally {
      setIsDeleting(false);
    }
  };

  const getCategoryColor = (categoryId: string) => {
    return CATEGORY_COLORS[categoryId] || '#6366f1';
  };

  const handleBulkIconFetch = async () => {
    if (isFetchingIcons) return;

    const confirmed = window.confirm(
      'This will fetch and upload icons for all templates that don\'t have one yet. This may take a few minutes. Continue?'
    );

    if (!confirmed) return;

    setIsFetchingIcons(true);
    setIconFetchResult(null);

    try {
      const response = await fetch('/api/admin/icon/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: false }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch icons');
      }

      setIconFetchResult({
        success: data.summary.success,
        failed: data.summary.failed,
        skipped: data.summary.skipped,
      });

      // Refresh templates to show new icons
      await fetchTemplates();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to fetch icons');
    } finally {
      setIsFetchingIcons(false);
    }
  };

  // Count templates without icons
  const templatesWithoutIcons = templates.filter(t => !t.iconUrl).length;

  // Get border radius for icon based on shape
  const getIconBorderRadius = (template: Template): number => {
    const shape = template.iconShape || 'rounded';
    // Scale down for 44px icon (from 256px base)
    const ratio = 44 / 256;
    return ICON_SHAPE_RADIUS[shape] * ratio;
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Templates</h1>
          <p className="page-subtitle">
            Manage pre-configured templates for Web2App Studio
          </p>
        </div>

        <Link href="/admin/templates/new" className="btn btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          New Template
        </Link>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Templates</div>
          <div className="stat-value">{templates.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Categories</div>
          <div className="stat-value">{categories.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pro Templates</div>
          <div className="stat-value">
            {templates.filter(t => t.metadata?.tier > 1).length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Free Templates</div>
          <div className="stat-value">
            {templates.filter(t => !t.metadata?.tier || t.metadata.tier === 1).length}
          </div>
        </div>
      </div>

      {/* Bulk Icon Fetch */}
      {templatesWithoutIcons > 0 && (
        <div className="form-section" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 className="form-section-title" style={{ marginBottom: 4 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="4" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21,15 16,10 5,21" />
                </svg>
                Missing Icons
              </h3>
              <p style={{ color: '#666', fontSize: 14 }}>
                {templatesWithoutIcons} template{templatesWithoutIcons !== 1 ? 's' : ''} without icons.
                Fetch them automatically from website favicons.
              </p>
            </div>
            <button
              className="btn btn-secondary"
              onClick={handleBulkIconFetch}
              disabled={isFetchingIcons}
            >
              {isFetchingIcons ? (
                <>
                  <span className="spinner-small"></span>
                  Fetching Icons...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="7,10 12,15 17,10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Fetch All Icons
                </>
              )}
            </button>
          </div>
          {iconFetchResult && (
            <div style={{ marginTop: 16, padding: 12, background: '#0f0f0f', borderRadius: 8 }}>
              <p style={{ color: '#22c55a', fontSize: 14 }}>
                Completed: {iconFetchResult.success} succeeded, {iconFetchResult.failed} failed, {iconFetchResult.skipped} skipped
              </p>
            </div>
          )}
        </div>
      )}

      {/* Search & Filter */}
      <div className="search-bar">
        <div className="search-input-wrapper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="filter-select"
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name} ({cat.templateCount})
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Loading templates...</p>
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
          <h3 className="empty-state-title">Error Loading Templates</h3>
          <p className="empty-state-text">{error}</p>
          <button className="btn btn-primary" onClick={fetchTemplates}>
            Try Again
          </button>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="9" x2="15" y2="15" />
              <line x1="15" y1="9" x2="9" y2="15" />
            </svg>
          </div>
          <h3 className="empty-state-title">
            {searchQuery || categoryFilter !== 'all'
              ? 'No templates found'
              : 'No templates yet'}
          </h3>
          <p className="empty-state-text">
            {searchQuery || categoryFilter !== 'all'
              ? 'Try adjusting your search or filter'
              : 'Create your first template to get started'}
          </p>
          {!searchQuery && categoryFilter === 'all' && (
            <Link href="/admin/templates/new" className="btn btn-primary">
              Create Template
            </Link>
          )}
        </div>
      ) : (
        <div className="template-table">
          <div className="table-header">
            <div>Template</div>
            <div>Category</div>
            <div>Tier</div>
            <div>Updated</div>
            <div>Actions</div>
          </div>

          {filteredTemplates.map(template => (
            <div key={template.id} className="table-row">
              <div className="template-info">
                {template.iconUrl ? (
                  <img
                    src={getIconRawUrl(template.iconUrl)}
                    alt={template.name}
                    className="template-icon-image"
                    style={{
                      borderRadius: getIconBorderRadius(template),
                    }}
                  />
                ) : (
                  <div
                    className="template-icon"
                    style={{ backgroundColor: getCategoryColor(template.category) }}
                  >
                    {template.icon}
                  </div>
                )}
                <div className="template-details">
                  <div className="template-name">{template.name}</div>
                  <div className="template-url">{template.url}</div>
                </div>
              </div>

              <div>
                <span className="badge badge-category">{template.category}</span>
              </div>

              <div>
                {template.metadata?.tier > 1 ? (
                  <span className="badge badge-tier">Pro</span>
                ) : (
                  <span className="badge badge-free">Free</span>
                )}
              </div>

              <div style={{ color: '#666', fontSize: '13px' }}>
                {template.metadata?.lastUpdated || 'N/A'}
              </div>

              <div className="table-actions">
                <Link
                  href={`/admin/templates/${template.id}?category=${template.category}`}
                  className="action-btn"
                  title="Edit"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </Link>

                <a
                  href={template.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="action-btn"
                  title="Visit Site"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                    <polyline points="15,3 21,3 21,9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>

                <button
                  className="action-btn delete"
                  title="Delete"
                  onClick={() => setDeleteTarget(template)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18" />
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
                    <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <DeleteModal
          templateName={deleteTarget.name}
          isDeleting={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </DashboardLayout>
  );
}
