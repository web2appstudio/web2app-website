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
const USER_AGENTS = ['default', 'chrome', 'safari', 'firefox', 'mobileSafari', 'custom'] as const;

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

  // Window Settings
  const [windowStyle, setWindowStyle] = useState(config.windowStyle);
  const [windowPreset, setWindowPreset] = useState(config.windowPreset);
  const [windowWidth, setWindowWidth] = useState<number | null>(config.windowWidth);
  const [windowHeight, setWindowHeight] = useState<number | null>(config.windowHeight);

  // Standard Features
  const [showNavigationControls, setShowNavigationControls] = useState(config.showNavigationControls ?? true);
  const [showPageURL, setShowPageURL] = useState(config.showPageURL ?? true);
  const [cookiePersistence, setCookiePersistence] = useState(config.cookiePersistence);
  const [enableKeyboardShortcuts, setEnableKeyboardShortcuts] = useState(config.enableKeyboardShortcuts ?? true);
  const [enableDockBadge, setEnableDockBadge] = useState(config.enableDockBadge ?? false);
  const [enablePasswordAutoFill, setEnablePasswordAutoFill] = useState(config.enablePasswordAutoFill ?? true);
  const [launchAtLogin, setLaunchAtLogin] = useState(config.launchAtLogin ?? false);
  const [floatOnTop, setFloatOnTop] = useState(config.floatOnTop ?? false);
  const [enableDeveloperTools, setEnableDeveloperTools] = useState(config.enableDeveloperTools ?? false);

  // Pro Features
  const [tabbedBrowsing, setTabbedBrowsing] = useState(config.tabbedBrowsing);
  const [notifications, setNotifications] = useState(config.notifications);
  const [adBlocking, setAdBlocking] = useState(config.adBlocking);

  // Link Behavior
  const [internalLinkBehavior, setInternalLinkBehavior] = useState(config.internalLinkBehavior);
  const [externalLinkBehavior, setExternalLinkBehavior] = useState(config.externalLinkBehavior);

  // User Agent
  const [userAgent, setUserAgent] = useState(config.userAgent);
  const [customUserAgentString, setCustomUserAgentString] = useState(config.customUserAgentString ?? '');

  // Toolbar
  const [useCustomToolbarColor, setUseCustomToolbarColor] = useState(config.useCustomToolbarColor ?? false);
  const [toolbarColor, setToolbarColor] = useState(config.toolbarColor ?? '#000000');

  // Permissions
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
          // Window Settings
          windowStyle,
          windowPreset,
          windowWidth: windowPreset === 'custom' ? windowWidth : null,
          windowHeight: windowPreset === 'custom' ? windowHeight : null,

          // Standard Features
          showNavigationControls,
          showPageURL,
          cookiePersistence,
          enableKeyboardShortcuts,
          enableDockBadge,
          enablePasswordAutoFill,
          launchAtLogin,
          floatOnTop,
          enableDeveloperTools,

          // Pro Features
          tabbedBrowsing,
          notifications,
          adBlocking,

          // Link Behavior
          internalLinkBehavior,
          externalLinkBehavior,

          // User Agent
          userAgent,
          customUserAgentString: userAgent === 'custom' ? customUserAgentString : null,

          // Toolbar
          useCustomToolbarColor,
          toolbarColor: useCustomToolbarColor ? toolbarColor : null,

          // Permissions
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
        </div>
      </div>

      {/* Standard Features */}
      <div className="form-section">
        <h3 className="form-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          Standard Features
        </h3>

        <p style={{ color: '#888', fontSize: 14, marginBottom: 16 }}>
          These features are available to all users in the free tier.
        </p>

        <div className="form-grid">
          <div className="form-group">
            <div className="form-checkbox-group">
              <input
                type="checkbox"
                id="showNavigationControls"
                className="form-checkbox"
                checked={showNavigationControls}
                onChange={e => setShowNavigationControls(e.target.checked)}
              />
              <label htmlFor="showNavigationControls" className="form-checkbox-label">
                Navigation Controls
                <span style={{ color: '#666', fontSize: 12, display: 'block' }}>Back/forward buttons</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <div className="form-checkbox-group">
              <input
                type="checkbox"
                id="showPageURL"
                className="form-checkbox"
                checked={showPageURL}
                onChange={e => setShowPageURL(e.target.checked)}
              />
              <label htmlFor="showPageURL" className="form-checkbox-label">
                Show Page URL
                <span style={{ color: '#666', fontSize: 12, display: 'block' }}>Display current URL</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <div className="form-checkbox-group">
              <input
                type="checkbox"
                id="cookiePersistence"
                className="form-checkbox"
                checked={cookiePersistence}
                onChange={e => setCookiePersistence(e.target.checked)}
              />
              <label htmlFor="cookiePersistence" className="form-checkbox-label">
                Cookie Persistence
                <span style={{ color: '#666', fontSize: 12, display: 'block' }}>Save login sessions</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <div className="form-checkbox-group">
              <input
                type="checkbox"
                id="enableKeyboardShortcuts"
                className="form-checkbox"
                checked={enableKeyboardShortcuts}
                onChange={e => setEnableKeyboardShortcuts(e.target.checked)}
              />
              <label htmlFor="enableKeyboardShortcuts" className="form-checkbox-label">
                Keyboard Shortcuts
                <span style={{ color: '#666', fontSize: 12, display: 'block' }}>Cmd+L, Cmd+R, etc.</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <div className="form-checkbox-group">
              <input
                type="checkbox"
                id="enableDockBadge"
                className="form-checkbox"
                checked={enableDockBadge}
                onChange={e => setEnableDockBadge(e.target.checked)}
              />
              <label htmlFor="enableDockBadge" className="form-checkbox-label">
                Dock Badge
                <span style={{ color: '#666', fontSize: 12, display: 'block' }}>Show unread counts</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <div className="form-checkbox-group">
              <input
                type="checkbox"
                id="enablePasswordAutoFill"
                className="form-checkbox"
                checked={enablePasswordAutoFill}
                onChange={e => setEnablePasswordAutoFill(e.target.checked)}
              />
              <label htmlFor="enablePasswordAutoFill" className="form-checkbox-label">
                Password AutoFill
                <span style={{ color: '#666', fontSize: 12, display: 'block' }}>System password autofill</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <div className="form-checkbox-group">
              <input
                type="checkbox"
                id="launchAtLogin"
                className="form-checkbox"
                checked={launchAtLogin}
                onChange={e => setLaunchAtLogin(e.target.checked)}
              />
              <label htmlFor="launchAtLogin" className="form-checkbox-label">
                Launch at Login
                <span style={{ color: '#666', fontSize: 12, display: 'block' }}>Start app when you log in</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <div className="form-checkbox-group">
              <input
                type="checkbox"
                id="floatOnTop"
                className="form-checkbox"
                checked={floatOnTop}
                onChange={e => setFloatOnTop(e.target.checked)}
              />
              <label htmlFor="floatOnTop" className="form-checkbox-label">
                Float on Top
                <span style={{ color: '#666', fontSize: 12, display: 'block' }}>Keep window above others</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <div className="form-checkbox-group">
              <input
                type="checkbox"
                id="enableDeveloperTools"
                className="form-checkbox"
                checked={enableDeveloperTools}
                onChange={e => setEnableDeveloperTools(e.target.checked)}
              />
              <label htmlFor="enableDeveloperTools" className="form-checkbox-label">
                Developer Tools
                <span style={{ color: '#666', fontSize: 12, display: 'block' }}>Enable Web Inspector</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Pro Features */}
      <div className="form-section">
        <h3 className="form-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          Pro Features
        </h3>

        <p style={{ color: '#888', fontSize: 14, marginBottom: 16 }}>
          These features require a Pro license.
        </p>

        <div className="form-grid">
          <div className="form-group">
            <div className="form-checkbox-group">
              <input
                type="checkbox"
                id="tabbedBrowsing"
                className="form-checkbox"
                checked={tabbedBrowsing}
                onChange={e => setTabbedBrowsing(e.target.checked)}
              />
              <label htmlFor="tabbedBrowsing" className="form-checkbox-label">
                Tabbed Browsing
                <span style={{ color: '#666', fontSize: 12, display: 'block' }}>Multiple tabs in one window</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <div className="form-checkbox-group">
              <input
                type="checkbox"
                id="notifications"
                className="form-checkbox"
                checked={notifications}
                onChange={e => setNotifications(e.target.checked)}
              />
              <label htmlFor="notifications" className="form-checkbox-label">
                Notifications
                <span style={{ color: '#666', fontSize: 12, display: 'block' }}>Push & web notifications</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <div className="form-checkbox-group">
              <input
                type="checkbox"
                id="adBlocking"
                className="form-checkbox"
                checked={adBlocking}
                onChange={e => setAdBlocking(e.target.checked)}
              />
              <label htmlFor="adBlocking" className="form-checkbox-label">
                Block Ads & Popups
                <span style={{ color: '#666', fontSize: 12, display: 'block' }}>Remove ads, trackers, and popups</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Link Behavior */}
      <div className="form-section">
        <h3 className="form-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
          </svg>
          Link Behavior
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
            <span style={{ color: '#666', fontSize: 12, marginTop: 4, display: 'block' }}>
              Links within the same domain
            </span>
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
            <span style={{ color: '#666', fontSize: 12, marginTop: 4, display: 'block' }}>
              Links to other domains
            </span>
          </div>
        </div>
      </div>

      {/* User Agent */}
      <div className="form-section">
        <h3 className="form-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
          </svg>
          User Agent
        </h3>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">User Agent</label>
            <select
              className="form-select"
              value={userAgent || 'default'}
              onChange={e => setUserAgent(e.target.value === 'default' ? null : e.target.value as typeof userAgent)}
            >
              {USER_AGENTS.map(agent => (
                <option key={agent} value={agent}>
                  {agent === 'default' ? 'Safari (Default)' :
                   agent === 'mobileSafari' ? 'Mobile Safari' :
                   agent.charAt(0).toUpperCase() + agent.slice(1)}
                </option>
              ))}
            </select>
            <span style={{ color: '#666', fontSize: 12, marginTop: 4, display: 'block' }}>
              How the app identifies itself to websites
            </span>
          </div>

          {userAgent === 'custom' && (
            <div className="form-group">
              <label className="form-label">Custom User Agent String</label>
              <input
                type="text"
                className="form-input"
                value={customUserAgentString}
                onChange={e => setCustomUserAgentString(e.target.value)}
                placeholder="Mozilla/5.0 ..."
              />
            </div>
          )}
        </div>
      </div>

      {/* Toolbar Appearance */}
      <div className="form-section">
        <h3 className="form-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="13.5" cy="6.5" r="2.5" />
            <circle cx="17.5" cy="10.5" r="2.5" />
            <circle cx="8.5" cy="7.5" r="2.5" />
            <circle cx="6.5" cy="12.5" r="2.5" />
            <path d="M12 22a9 9 0 100-18 9 9 0 000 18z" />
          </svg>
          Toolbar Appearance
        </h3>

        <div className="form-grid">
          <div className="form-group">
            <div className="form-checkbox-group">
              <input
                type="checkbox"
                id="useCustomToolbarColor"
                className="form-checkbox"
                checked={useCustomToolbarColor}
                onChange={e => setUseCustomToolbarColor(e.target.checked)}
              />
              <label htmlFor="useCustomToolbarColor" className="form-checkbox-label">
                Custom Toolbar Color
                <span style={{ color: '#666', fontSize: 12, display: 'block' }}>Use a custom color for the toolbar</span>
              </label>
            </div>
          </div>

          {useCustomToolbarColor && (
            <div className="form-group">
              <label className="form-label">Toolbar Color</label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <input
                  type="color"
                  value={toolbarColor}
                  onChange={e => setToolbarColor(e.target.value)}
                  style={{ width: 48, height: 32, padding: 0, border: '1px solid #333', borderRadius: 4, cursor: 'pointer' }}
                />
                <input
                  type="text"
                  className="form-input"
                  value={toolbarColor}
                  onChange={e => setToolbarColor(e.target.value)}
                  placeholder="#000000"
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          )}
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
