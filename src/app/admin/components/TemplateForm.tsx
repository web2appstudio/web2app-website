'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Template, TemplateConfiguration, TemplateMetadata, IconShape } from '@/lib/types';
import { DEFAULT_TEMPLATE_CONFIG, CATEGORIES, CATEGORY_COLORS, ICON_SHAPE_RADIUS } from '@/lib/types';
import { getIconRawUrl } from '@/lib/github';

interface TemplateFormProps {
  template?: Template;
  isEditing?: boolean;
}

const WINDOW_STYLES = ['normal', 'menuBar', 'sidebar'] as const;
const LINK_BEHAVIORS = ['sameWindow', 'newTab', 'systemBrowser'] as const;
const COOKIE_POLICIES = ['persistent', 'session'] as const;
const USER_AGENTS = ['default', 'chrome', 'safari'] as const;
const AD_BLOCKING_OPTIONS = ['disabled', 'basic', 'advanced'] as const;
const ICON_SHAPES: IconShape[] = ['circular', 'rounded', 'square'];

export default function TemplateForm({ template, isEditing = false }: TemplateFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingIcon, setIsFetchingIcon] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Basic Info
  const [id, setId] = useState(template?.id || '');
  const [name, setName] = useState(template?.name || '');
  const [url, setUrl] = useState(template?.url || '');
  const [category, setCategory] = useState(template?.category || 'productivity');
  const [description, setDescription] = useState(template?.description || '');

  // Icon - letter fallback
  const [icon, setIcon] = useState(template?.icon || '');
  const [iconColor, setIconColor] = useState(template?.iconColor || '#6366f1');
  const [iconBackground, setIconBackground] = useState(template?.iconBackground || '#FFFFFF');

  // Icon - image
  const [iconUrl, setIconUrl] = useState(template?.iconUrl || '');
  const [iconShape, setIconShape] = useState<IconShape>(template?.iconShape || 'rounded');
  const [iconPreview, setIconPreview] = useState<string | null>(
    template?.iconUrl ? getIconRawUrl(template.iconUrl) : null
  );
  const [newIconData, setNewIconData] = useState<string | null>(null); // Base64 data for new icon to upload

  // Configuration
  const config = template?.configuration || DEFAULT_TEMPLATE_CONFIG;
  const [windowStyle, setWindowStyle] = useState(config.windowStyle);
  const [windowWidth, setWindowWidth] = useState(config.windowWidth);
  const [windowHeight, setWindowHeight] = useState(config.windowHeight);
  const [tabbedBrowsing, setTabbedBrowsing] = useState(config.tabbedBrowsing);
  const [notifications, setNotifications] = useState(config.notifications);
  const [internalLinkBehavior, setInternalLinkBehavior] = useState(config.internalLinkBehavior);
  const [externalLinkBehavior, setExternalLinkBehavior] = useState(config.externalLinkBehavior);
  const [cookiePolicy, setCookiePolicy] = useState(config.cookiePolicy);
  const [userAgent, setUserAgent] = useState(config.userAgent);
  const [adBlocking, setAdBlocking] = useState(config.adBlocking);

  // Metadata
  const [tier, setTier] = useState(template?.metadata?.tier || 1);
  const [tags, setTags] = useState(template?.metadata?.tags?.join(', ') || '');

  // Fetch icon from website
  const handleFetchIcon = async () => {
    if (!url) {
      setError('Please enter a URL first');
      return;
    }

    setIsFetchingIcon(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/icon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch icon');
      }

      setIconPreview(data.data);
      setNewIconData(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch icon');
    } finally {
      setIsFetchingIcon(false);
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setIconPreview(dataUrl);
      setNewIconData(dataUrl);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  // Clear icon (use letter instead)
  const handleClearIcon = () => {
    setIconPreview(null);
    setNewIconData(null);
    setIconUrl('');
  };

  // Get border radius for icon shape
  const getShapeBorderRadius = (shape: IconShape, size: number = 128): number => {
    const ratio = size / 256;
    return ICON_SHAPE_RADIUS[shape] * ratio;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    // Validation - icon letter only required if no image
    if (!id || !name || !url || !category || !description) {
      setError('Please fill in all required fields');
      setIsSaving(false);
      return;
    }

    if (!iconPreview && !icon) {
      setError('Please provide an icon (either upload an image or enter a letter)');
      setIsSaving(false);
      return;
    }

    try {
      // If there's new icon data to upload, upload it first
      let finalIconUrl = iconUrl;
      if (newIconData) {
        const uploadResponse = await fetch('/api/admin/icon/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateId: id.toLowerCase().replace(/\s+/g, '-'),
            imageData: newIconData,
          }),
        });

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok || !uploadData.success) {
          throw new Error(uploadData.error || 'Failed to upload icon');
        }

        finalIconUrl = uploadData.iconUrl;
      }

      // Build template object
      const templateData: Template = {
        id: id.toLowerCase().replace(/\s+/g, '-'),
        name,
        url,
        category,
        icon: icon || name.charAt(0).toUpperCase(),
        iconColor,
        iconBackground,
        ...(finalIconUrl && { iconUrl: finalIconUrl }),
        ...(iconShape && { iconShape }),
        description,
        configuration: {
          windowStyle,
          windowWidth,
          windowHeight,
          tabbedBrowsing,
          notifications,
          internalLinkBehavior,
          externalLinkBehavior,
          cookiePolicy,
          userAgent,
          adBlocking,
        } as TemplateConfiguration,
        metadata: {
          version: template?.metadata?.version || '1.0',
          author: template?.metadata?.author || 'Web2App Studio',
          lastUpdated: new Date().toISOString().split('T')[0],
          tier,
          tags: tags.split(',').map(t => t.trim()).filter(t => t),
        } as TemplateMetadata,
      };

      const response = await fetch('/api/admin/templates', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save template');
      }

      router.push('/admin/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const getCategoryColor = () => {
    return CATEGORY_COLORS[category] || iconColor;
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      {error && (
        <div className="login-error" style={{ marginBottom: 24 }}>
          {error}
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
            <div className="preview-titlebar-text">{name || 'Template Name'}</div>
          </div>
          <div className="preview-content" style={{ background: `${getCategoryColor()}15` }}>
            {iconPreview ? (
              <img
                src={iconPreview}
                alt="App icon"
                className="preview-content-image"
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: getShapeBorderRadius(iconShape, 80),
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div
                className="preview-content-icon"
                style={{ backgroundColor: iconColor, color: iconBackground }}
              >
                {icon || '?'}
              </div>
            )}
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
            <label className="form-label">Template ID *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., notion"
              value={id}
              onChange={e => setId(e.target.value)}
              disabled={isEditing}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Display Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Notion"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">URL *</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://example.com"
              value={url}
              onChange={e => setUrl(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category *</label>
            <select
              className="form-select"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group full-width">
            <label className="form-label">Description *</label>
            <textarea
              className="form-textarea"
              placeholder="Brief description of the app..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* App Icon */}
      <div className="form-section">
        <h3 className="form-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="4" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21,15 16,10 5,21" />
          </svg>
          App Icon
        </h3>

        {/* Icon Preview */}
        <div className="icon-editor">
          <div className="icon-preview-large">
            {iconPreview ? (
              <img
                src={iconPreview}
                alt="App icon preview"
                style={{
                  width: 128,
                  height: 128,
                  borderRadius: getShapeBorderRadius(iconShape, 128),
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div
                className="icon-letter-preview"
                style={{
                  width: 128,
                  height: 128,
                  borderRadius: getShapeBorderRadius(iconShape, 128),
                  backgroundColor: iconColor,
                  color: iconBackground,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 48,
                  fontWeight: 700,
                }}
              >
                {icon || '?'}
              </div>
            )}
          </div>

          {/* Icon Actions */}
          <div className="icon-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleFetchIcon}
              disabled={isFetchingIcon || !url}
            >
              {isFetchingIcon ? (
                <>
                  <span className="spinner-small"></span>
                  Fetching...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  Fetch from Website
                </>
              )}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17,8 12,3 7,8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload Icon
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />

            {iconPreview && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClearIcon}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Use Letter Instead
              </button>
            )}
          </div>
        </div>

        {/* Icon Shape Selector */}
        <div className="form-group" style={{ marginTop: 20 }}>
          <label className="form-label">Icon Shape</label>
          <div className="shape-selector">
            {ICON_SHAPES.map(shape => (
              <button
                key={shape}
                type="button"
                className={`shape-btn ${iconShape === shape ? 'active' : ''}`}
                onClick={() => setIconShape(shape)}
              >
                <div
                  className="shape-preview"
                  style={{
                    borderRadius: shape === 'circular' ? '50%' : shape === 'rounded' ? '6px' : '0',
                  }}
                />
                {shape.charAt(0).toUpperCase() + shape.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Background Color */}
        <div className="form-group" style={{ marginTop: 16 }}>
          <label className="form-label">Background Color</label>
          <div className="color-input-wrapper">
            <input
              type="color"
              value={iconBackground}
              onChange={e => setIconBackground(e.target.value)}
            />
            <input
              type="text"
              className="form-input"
              value={iconBackground}
              onChange={e => setIconBackground(e.target.value)}
              placeholder="#FFFFFF"
            />
          </div>
        </div>

        {/* Letter Fallback Settings (only shown when no image) */}
        {!iconPreview && (
          <div className="form-grid" style={{ marginTop: 16 }}>
            <div className="form-group">
              <label className="form-label">Fallback Letter</label>
              <input
                type="text"
                className="form-input"
                placeholder="N"
                maxLength={2}
                value={icon}
                onChange={e => setIcon(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Letter Color</label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  value={iconColor}
                  onChange={e => setIconColor(e.target.value)}
                />
                <input
                  type="text"
                  className="form-input"
                  value={iconColor}
                  onChange={e => setIconColor(e.target.value)}
                  placeholder="#6366f1"
                />
              </div>
            </div>
          </div>
        )}
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
            <label className="form-label">Window Width</label>
            <input
              type="number"
              className="form-input"
              value={windowWidth}
              onChange={e => setWindowWidth(Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Window Height</label>
            <input
              type="number"
              className="form-input"
              value={windowHeight}
              onChange={e => setWindowHeight(Number(e.target.value))}
            />
          </div>

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
            <label className="form-label">Cookie Policy</label>
            <select
              className="form-select"
              value={cookiePolicy}
              onChange={e => setCookiePolicy(e.target.value as typeof cookiePolicy)}
            >
              {COOKIE_POLICIES.map(policy => (
                <option key={policy} value={policy}>
                  {policy.charAt(0).toUpperCase() + policy.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">User Agent</label>
            <select
              className="form-select"
              value={userAgent}
              onChange={e => setUserAgent(e.target.value as typeof userAgent)}
            >
              {USER_AGENTS.map(agent => (
                <option key={agent} value={agent}>
                  {agent.charAt(0).toUpperCase() + agent.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Ad Blocking</label>
            <select
              className="form-select"
              value={adBlocking}
              onChange={e => setAdBlocking(e.target.value as typeof adBlocking)}
            >
              {AD_BLOCKING_OPTIONS.map(option => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="form-section">
        <h3 className="form-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
          Metadata
        </h3>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Tier (1 = Free, 2+ = Pro)</label>
            <input
              type="number"
              className="form-input"
              min={1}
              max={3}
              value={tier}
              onChange={e => setTier(Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tags (comma-separated)</label>
            <input
              type="text"
              className="form-input"
              placeholder="productivity, notes, collaboration"
              value={tags}
              onChange={e => setTags(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="form-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => router.push('/admin/dashboard')}
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : isEditing ? 'Update Template' : 'Create Template'}
        </button>
      </div>
    </form>
  );
}
