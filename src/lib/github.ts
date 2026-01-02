import { GITHUB_API_URL, GITHUB_ORG, GITHUB_REPO, GITHUB_BRANCH } from './constants';
import type { Template, Manifest, Category } from './types';

interface GitHubFileContent {
  sha: string;
  content: string;
  encoding: string;
}

interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  type: 'file' | 'dir';
  download_url: string | null;
}

// Get file SHA (needed for updates)
export async function getFileSHA(
  path: string,
  accessToken: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `${GITHUB_API_URL}/repos/${GITHUB_ORG}/${GITHUB_REPO}/contents/${path}?ref=${GITHUB_BRANCH}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Web2App-Studio-Admin',
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data: GitHubFileContent = await response.json();
    return data.sha;
  } catch {
    return null;
  }
}

// Create or update a file in the repo
export async function createOrUpdateFile(
  path: string,
  content: string,
  message: string,
  accessToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if file exists to get SHA
    const existingSHA = await getFileSHA(path, accessToken);

    const body: Record<string, string> = {
      message,
      content: Buffer.from(content).toString('base64'),
      branch: GITHUB_BRANCH,
    };

    if (existingSHA) {
      body.sha = existingSHA;
    }

    const response = await fetch(
      `${GITHUB_API_URL}/repos/${GITHUB_ORG}/${GITHUB_REPO}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Web2App-Studio-Admin',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || 'Failed to save file' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// Delete a file from the repo
export async function deleteFile(
  path: string,
  message: string,
  accessToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const sha = await getFileSHA(path, accessToken);

    if (!sha) {
      return { success: false, error: 'File not found' };
    }

    const response = await fetch(
      `${GITHUB_API_URL}/repos/${GITHUB_ORG}/${GITHUB_REPO}/contents/${path}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Web2App-Studio-Admin',
        },
        body: JSON.stringify({
          message,
          sha,
          branch: GITHUB_BRANCH,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || 'Failed to delete file' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// Fetch manifest
export async function fetchManifest(accessToken: string): Promise<Manifest | null> {
  try {
    const response = await fetch(
      `${GITHUB_API_URL}/repos/${GITHUB_ORG}/${GITHUB_REPO}/contents/manifest.json?ref=${GITHUB_BRANCH}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3.raw',
          'User-Agent': 'Web2App-Studio-Admin',
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}

// Fetch all templates
export async function fetchAllTemplates(
  accessToken: string
): Promise<Template[]> {
  const templates: Template[] = [];

  try {
    // Fetch manifest to get categories
    const manifest = await fetchManifest(accessToken);
    if (!manifest) return [];

    // Fetch templates for each category
    for (const category of manifest.categories) {
      const categoryTemplates = await fetchCategoryTemplates(category.id, accessToken);
      templates.push(...categoryTemplates);
    }

    return templates;
  } catch (error) {
    console.error('Failed to fetch all templates:', error);
    return [];
  }
}

// Fetch templates for a specific category
export async function fetchCategoryTemplates(
  categoryId: string,
  accessToken: string
): Promise<Template[]> {
  try {
    const dirResponse = await fetch(
      `${GITHUB_API_URL}/repos/${GITHUB_ORG}/${GITHUB_REPO}/contents/templates/${categoryId}?ref=${GITHUB_BRANCH}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Web2App-Studio-Admin',
        },
      }
    );

    if (!dirResponse.ok) {
      return [];
    }

    const files: GitHubFile[] = await dirResponse.json();
    const jsonFiles = files.filter(f => f.name.endsWith('.json'));

    const templates = await Promise.all(
      jsonFiles.map(async (file) => {
        try {
          const fileResponse = await fetch(file.download_url!, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'User-Agent': 'Web2App-Studio-Admin',
            },
          });
          return await fileResponse.json();
        } catch {
          return null;
        }
      })
    );

    return templates.filter((t): t is Template => t !== null);
  } catch {
    return [];
  }
}

// Fetch a single template by ID
export async function fetchTemplate(
  templateId: string,
  categoryId: string,
  accessToken: string
): Promise<Template | null> {
  try {
    const response = await fetch(
      `${GITHUB_API_URL}/repos/${GITHUB_ORG}/${GITHUB_REPO}/contents/templates/${categoryId}/${templateId}.json?ref=${GITHUB_BRANCH}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3.raw',
          'User-Agent': 'Web2App-Studio-Admin',
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}

// Save a template (create or update)
export async function saveTemplate(
  template: Template,
  accessToken: string,
  isNew: boolean = false
): Promise<{ success: boolean; error?: string }> {
  const path = `templates/${template.category}/${template.id}.json`;
  const content = JSON.stringify(template, null, 2);
  const message = isNew
    ? `Add template: ${template.name}`
    : `Update template: ${template.name}`;

  return createOrUpdateFile(path, content, message, accessToken);
}

// Delete a template
export async function deleteTemplate(
  templateId: string,
  categoryId: string,
  accessToken: string
): Promise<{ success: boolean; error?: string }> {
  const path = `templates/${categoryId}/${templateId}.json`;
  return deleteFile(path, `Delete template: ${templateId}`, accessToken);
}

// Update manifest (e.g., to update template counts)
export async function updateManifest(
  manifest: Manifest,
  accessToken: string
): Promise<{ success: boolean; error?: string }> {
  const content = JSON.stringify(manifest, null, 2);
  return createOrUpdateFile('manifest.json', content, 'Update manifest', accessToken);
}

// Recalculate and update category template counts
export async function updateTemplateCounts(
  accessToken: string
): Promise<{ success: boolean; error?: string }> {
  const manifest = await fetchManifest(accessToken);
  if (!manifest) {
    return { success: false, error: 'Failed to fetch manifest' };
  }

  // Update counts for each category
  for (const category of manifest.categories) {
    const templates = await fetchCategoryTemplates(category.id, accessToken);
    category.templateCount = templates.length;
  }

  manifest.lastUpdated = new Date().toISOString().split('T')[0];

  return updateManifest(manifest, accessToken);
}

// Upload an icon image to the repo
export async function uploadIcon(
  templateId: string,
  imageData: string, // Base64 encoded image data (with or without data URL prefix)
  accessToken: string
): Promise<{ success: boolean; iconUrl?: string; error?: string }> {
  try {
    // Remove data URL prefix if present (e.g., "data:image/png;base64,")
    let base64Data = imageData;
    if (imageData.includes(',')) {
      base64Data = imageData.split(',')[1];
    }

    const path = `icons/${templateId}.png`;
    const message = `Add icon for template: ${templateId}`;

    // Check if file exists to get SHA
    const existingSHA = await getFileSHA(path, accessToken);

    const body: Record<string, string> = {
      message,
      content: base64Data,
      branch: GITHUB_BRANCH,
    };

    if (existingSHA) {
      body.sha = existingSHA;
    }

    const response = await fetch(
      `${GITHUB_API_URL}/repos/${GITHUB_ORG}/${GITHUB_REPO}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Web2App-Studio-Admin',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || 'Failed to upload icon' };
    }

    return { success: true, iconUrl: path };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// Delete an icon from the repo
export async function deleteIcon(
  templateId: string,
  accessToken: string
): Promise<{ success: boolean; error?: string }> {
  const path = `icons/${templateId}.png`;
  return deleteFile(path, `Delete icon for template: ${templateId}`, accessToken);
}

// Get the raw URL for an icon
export function getIconRawUrl(iconPath: string): string {
  // Use our API endpoint to serve icons from the private repo
  // This works for both server-side and client-side rendering
  return `/api/icons/${iconPath}`;
}
