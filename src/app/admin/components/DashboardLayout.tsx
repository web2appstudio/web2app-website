'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import type { GitHubUser } from '@/lib/types';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/session')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setUser(data.user);
        } else {
          router.push('/admin');
        }
        setIsLoading(false);
      })
      .catch(() => {
        router.push('/admin');
      });
  }, [router]);

  const handleLogout = async () => {
    window.location.href = '/api/admin/logout';
  };

  if (isLoading) {
    return (
      <div className="admin-container">
        <div className="loading-container" style={{ minHeight: '100vh' }}>
          <div className="spinner"></div>
          <p className="loading-text">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="admin-container">
      <div className="dashboard-layout">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">W</div>
            <div>
              <span className="sidebar-logo-text">Web2App</span>
              <span className="sidebar-logo-badge">Admin</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            <Link
              href="/admin/dashboard"
              className={`nav-item ${pathname === '/admin/dashboard' ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              Dashboard
            </Link>

            <Link
              href="/admin/categories"
              className={`nav-item ${pathname?.startsWith('/admin/categories') ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              Categories
            </Link>

            <Link
              href="/admin/templates/new"
              className={`nav-item ${pathname === '/admin/templates/new' ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              New Template
            </Link>
          </nav>

          <div className="sidebar-footer">
            <div className="user-info">
              <img
                src={user.avatar_url}
                alt={user.login}
                className="user-avatar"
              />
              <div className="user-details">
                <div className="user-name">{user.name || user.login}</div>
                <div className="user-login">@{user.login}</div>
              </div>
            </div>

            <button className="logout-button" onClick={handleLogout}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16,17 21,12 16,7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign Out
            </button>
          </div>
        </aside>

        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
