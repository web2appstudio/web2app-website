'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Category, CategoryConfiguration } from '@/lib/types';
import { DEFAULT_CATEGORY_CONFIG, CATEGORY_COLORS, WINDOW_PRESETS } from '@/lib/types';

interface CategoryFormProps {
  category: Category;
}

const WINDOW_STYLES = ['normal', 'menuBar', 'sidebar'] as const;
const WINDOW_PRESET_OPTIONS = ['phone', 'tablet', 'desktop', 'fullHD', 'fourK', 'custom'] as const;
const LINK_BEHAVIORS = ['sameWindow', 'newTab', 'systemBrowser'] as const;
const USER_AGENTS = ['default', 'chrome', 'safari'] as const;

export default function CategoryForm({ category }: CategoryFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Basic Info
  const [name, setName] = useState(category.name);
  const [emoji, setEmoji] = useState(category.emoji || '');
  const [icon, setIcon] = useState(category.icon || '');
  const [shortDescription, setShortDescription] = useState(category.shortDescription || '');
  const [fullDescription, setFullDescription] = useState(category.fullDescription || '');
  const [description, setDescription] = useState(category.description || '');

  // Configuration
  const config = category.configuration || DEFAULT_CATEGORY_CONFIG;
  const [windowStyle, setWindowStyle] = useState(config.windowStyle);
  const [windowPreset, setWindowPreset] = useState(config.windowPreset);
  const [windowWidth, setWindowWidth] = useState<number | null>(config.windowWidth);
  const [windowHeight, setWindowHeight] = useState<number | null>(config.windowHeight);
  const [tabbedBrowsing, setTabbedBrowsing] = useState(config.tabbedBrowsing);
  const [notifications, setNotifications] = useState(config.notifications);
  const [internalLinkBehavior, setInternalLinkBehavior] = useState(config.internalLinkBehavior);
  const [externalLinkBehavior, setExternalLinkBehavior] = useState(config.externalLinkBehavior);
  const [cookiePersistence, setCookiePersistence] = useState(config.cookiePersistence);
  const [adBlocking, setAdBlocking] = useState(config.adBlocking);
  const [userAgent, setUserAgent] = useState(config.userAgent);
  const [allowMicrophone, setAllowMicrophone] = useState(config.allowMicrophone);
  const [allowCamera, setAllowCamera] = useState(config.allowCamera);

  const getCategoryColor = () => {
    return CATEGORY_COLORS[category.id] || '#6366f1';
  };

  const getPresetDimensions = (preset: string) => {
    return WINDOW_PRESETS[preset] || WINDOW_PRESETS.desktop;
  };

  const getDisplayDimensions = () => {
    if (windowPreset === 'custom' && windowWidth && windowHeight) {
      return `${windowWidth}x${windowHeight}`;
    }
    const dims = getPresetDimensions(windowPreset);
    return `${dims.width}x${dims.height}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSaving(true);

    try {
      const categoryData: Category = {
        id: category.id,
        name,
        icon,
        emoji,
        shortDescription,
        fullDescription,
        description,
        templateCount: category.templateCount,
        configuration: {
          windowStyle,
          windowPreset,
          windowWidth: windowPreset === 'custom' ? windowWidth : null,
          windowHeight: windowPreset === 'custom' ? windowHeight : null,
          tabbedBrowsing,
          notifications,
          internalLinkBehavior,
          externalLinkBehavior,
          cookiePersistence,
          adBlocking,
          userAgent,
          allowMicrophone,
          allowCamera,
        } as CategoryConfiguration,
      };

      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save category');
      }

      setSuccessMessage('Category saved successfully! Changes will sync to the desktop app.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      {error && (
        <div className="login-error" style={{ marginBottom: 24 }}>
          {error}
        </div>
      )}

      {successMessage && (
        <div style={{
          marginBottom: 24,
          padding: '12px 16px',
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: 8,
          color: '#22c55e',
          fontSize: 14,
        }}>
          {successMessage}
        </div>
      )}

      {/* Preview Card */}
      <div className="form-section">
        <h3 className="form-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          Preview
        </h3>

        <div className="preview-card">
          <div className="preview-titlebar">
            <div className="preview-titlebar-dots">
              <div className="preview-titlebar-dot red"></div>
              <div className="preview-titlebar-dot yellow"></div>
              <div className="preview-titlebar-dot green"></div>
            </div>
            <div className="preview-titlebar-text">{name} App</div>
          </div>
          <div className="preview-content" style={{ background: `${getCategoryColor()}15` }}>
            <div
              className="preview-content-icon"
              style={{ backgroundColor: getCategoryColor(), color: '#fff', fontSize: 32 }}
            >
              {emoji || '?'}
            </div>
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>{name}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{shortDescription}</div>
              <div style={{ fontSize: 11, color: '#666', marginTop: 8 }}>
                {windowStyle} • {getDisplayDimensions()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="form-section">
        <h3 className="form-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14,2 14,8 20,8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          Basic Information
        </h3>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Category ID</label>
            <input
              type="text"
              className="form-input"
              value={category.id}
              disabled
              style={{ opacity: 0.6 }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Display Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Productivity"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Emoji</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., 📋"
              maxLength={4}
              value={emoji}
              onChange={e => setEmoji(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">SF Symbol Icon</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., chart.bar.fill"
              value={icon}
              onChange={e => setIcon(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Short Description</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Work & Tasks"
              value={shortDescription}
              onChange={e => setShortDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              type="text"
              className="form-input"
              placeholder="Brief category description"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group full-width">
            <label className="form-label">Full Description</label>
            <textarea
              className="form-textarea"
              placeholder="Detailed description with example apps and settings..."
              value={fullDescription}
              onChange={e => setFullDescription(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Window Configuration */}
      <div className="form-section">
        <h3 className="form-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          Window Configuration
        </h3>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Window Style</label>
            <select
              className="form-select"
              value={windowStyle}
              onChange={e => setWindowStyle(e.target.value as typeof windowStyle)}
            >
              {WINDOW_STYLES.map(style => (
                <option key={style} value={style}>
                  {style === 'menuBar' ? 'Menu Bar' : style.charAt(0).toUpperCase() + style.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Window Preset</label>
            <select
              className="form-select"
              value={windowPreset}
              onChange={e => setWindowPreset(e.target.value as typeof windowPreset)}
            >
              {WINDOW_PRESET_OPTIONS.map(preset => {
                const dims = getPresetDimensions(preset);
                return (
                  <option key={preset} value={preset}>
                    {preset.charAt(0).toUpperCase() + preset.slice(1)} ({dims.width}x{dims.height})
                  </option>
                );
              })}
            </select>
          </div>

          {windowPreset === 'custom' && (
            <>
              <div className="form-group">
                <label className="form-label">Custom Width</label>
                <input
                  type="number"
                  className="form-input"
                  value={windowWidth || ''}
                  onChange={e => setWindowWidth(e.target.value ? Number(e.target.value) : null)}
                  placeholder="1200"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Custom Height</label>
                <input
                  type="number"
                  className="form-input"
                  value={windowHeight || ''}
                  onChange={e => setWindowHeight(e.target.value ? Number(e.target.value) : null)}
                  placeholder="800"
                />
              </div>
            </>
          )}

          <div className="form-group">
            <div className="form-checkbox-group" style={{ marginTop: 24 }}>
              <input
                type="checkbox"
                id="tabbedBrowsing"
                className="form-checkbox"
                checked={tabbedBrowsing}
                onChange={e => setTabbedBrowsing(e.target.checked)}
              />
              <label htmlFor="tabbedBrowsing" className="form-checkbox-label">
                Enable Tabbed Browsing
              </label>
            </div>
          </div>

          <div className="form-group">
            <div className="form-checkbox-group" style={{ marginTop: 24 }}>
              <input
                type="checkbox"
                id="notifications"
                className="form-checkbox"
                checked={notifications}
                onChange={e => setNotifications(e.target.checked)}
              />
              <label htmlFor="notifications" className="form-checkbox-label">
                Enable Notifications
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Behavior Settings */}
      <div className="form-section">
        <h3 className="form-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
          Behavior Settings
        </h3>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Internal Links</label>
            <select
              className="form-select"
              value={internalLinkBehavior}
              onChange={e => setInternalLinkBehavior(e.target.value as typeof internalLinkBehavior)}
            >
              {LINK_BEHAVIORS.map(behavior => (
                <option key={behavior} value={behavior}>
                  {behavior === 'sameWindow' ? 'Same Window' :
                   behavior === 'newTab' ? 'New Tab' : 'System Browser'}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">External Links</label>
            <select
              className="form-select"
              value={externalLinkBehavior}
              onChange={e => setExternalLinkBehavior(e.target.value as typeof externalLinkBehavior)}
            >
              {LINK_BEHAVIORS.map(behavior => (
                <option key={behavior} value={behavior}>
                  {behavior === 'sameWindow' ? 'Same Window' :
                   behavior === 'newTab' ? 'New Tab' : 'System Browser'}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">User Agent</label>
            <select
              className="form-select"
              value={userAgent || 'default'}
              onChange={e => setUserAgent(e.target.value === 'default' ? null : e.target.value as 'chrome' | 'safari')}
            >
              {USER_AGENTS.map(agent => (
                <option key={agent} value={agent}>
                  {agent.charAt(0).toUpperCase() + agent.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <div className="form-checkbox-group" style={{ marginTop: 24 }}>
              <input
                type="checkbox"
                id="cookiePersistence"
                className="form-checkbox"
                checked={cookiePersistence}
                onChange={e => setCookiePersistence(e.target.checked)}
              />
              <label htmlFor="cookiePersistence" className="form-checkbox-label">
                Persistent Cookies
              </label>
            </div>
          </div>

          <div className="form-group">
            <div className="form-checkbox-group" style={{ marginTop: 24 }}>
              <input
                type="checkbox"
                id="adBlocking"
                className="form-checkbox"
                checked={adBlocking}
                onChange={e => setAdBlocking(e.target.checked)}
              />
              <label htmlFor="adBlocking" className="form-checkbox-label">
                Enable Ad Blocking
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Permissions */}
      <div className="form-section">
        <h3 className="form-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Permissions
        </h3>

        <p style={{ color: '#888', fontSize: 14, marginBottom: 16 }}>
          These permissions will be requested from users when they build apps in this category.
          Leave unchecked for default behavior (not requested).
        </p>

        <div className="form-grid">
          <div className="form-group">
            <div className="form-checkbox-group">
              <input
                type="checkbox"
                id="allowMicrophone"
                className="form-checkbox"
                checked={allowMicrophone === true}
                onChange={e => setAllowMicrophone(e.target.checked ? true : null)}
              />
              <label htmlFor="allowMicrophone" className="form-checkbox-label">
                Request Microphone Access
              </label>
            </div>
          </div>

          <div className="form-group">
            <div className="form-checkbox-group">
              <input
                type="checkbox"
                id="allowCamera"
                className="form-checkbox"
                checked={allowCamera === true}
                onChange={e => setAllowCamera(e.target.checked ? true : null)}
              />
              <label htmlFor="allowCamera" className="form-checkbox-label">
                Request Camera Access
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="form-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => router.push('/admin/categories')}
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Category'}
        </button>
      </div>
    </form>
  );
}
