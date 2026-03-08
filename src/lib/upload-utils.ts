/**
 * Upload utilities for R2R document upload
 */

/**
 * Uploads a single file to R2R API with async processing
 *
 * @param file - File to upload
 * @param baseUrl - R2R API base URL
 * @param accessToken - Authentication token
 * @param metadata - Document metadata
 * @param collectionsToUse - Collection IDs to add document to
 * @param ingestionMode - Ingestion mode (hi-res, fast, custom)
 * @param abortSignal - AbortSignal for cancellation
 * @returns Promise with upload result
 */
export async function uploadSingleFile(
  file: File,
  baseUrl: string,
  accessToken: string,
  metadata: Record<string, any>,
  collectionsToUse: string[],
  ingestionMode: string,
  abortSignal: AbortSignal
): Promise<{ success: boolean; documentId?: string; error?: string }> {
  // Extract only filename without path
  const getFileNameOnly = (filePath: string): string => {
    const parts = filePath.split(/[/\\]/);
    return parts[parts.length - 1] || filePath;
  };
  const fileNameOnly = getFileNameOnly(file.name);

  // Build final metadata
  const fileMetadata: Record<string, any> = {
    title: fileNameOnly,
    ...metadata,
  };

  // Create FormData
  const formData = new FormData();
  formData.append('file', file);
  formData.append('ingestion_mode', ingestionMode);
  // CRITICAL: Enable async processing so server doesn't block
  formData.append('run_with_orchestration', 'true');

  if (Object.keys(fileMetadata).length > 0) {
    formData.append('metadata', JSON.stringify(fileMetadata));
  }

  if (collectionsToUse.length > 0) {
    formData.append('collection_ids', JSON.stringify(collectionsToUse));
  }

  try {
    // Create timeout controller (5 minutes for large files with hi-res processing)
    const timeoutId = setTimeout(() => {
      console.warn(`Upload timeout for file - R2R may still be processing`);
    }, 300000); // 5 min warning

    console.log(`📤 Starting upload: ${file.name} (${file.size} bytes)`);

    const response = await fetch(`${baseUrl}/v3/documents`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
      signal: abortSignal,
    });

    clearTimeout(timeoutId);
    console.log(`📥 Response received for: ${file.name}`);

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { detail: errorText };
      }

      // Handle 409 Conflict - document already exists
      if (response.status === 409) {
        const errorMessage = errorData?.detail || JSON.stringify(errorData);
        const uuidMatch = errorMessage.match(
          /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i
        );

        if (uuidMatch) {
          // Delete existing and retry
          const existingDocId = uuidMatch[1];
          await fetch(`${baseUrl}/v3/documents/${existingDocId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          // Retry upload
          const retryResponse = await fetch(`${baseUrl}/v3/documents`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` },
            body: formData,
            signal: abortSignal,
          });

          if (retryResponse.ok) {
            const result = await retryResponse.json();
            const documentId =
              result?.results?.id || result?.results?.document_id || result?.id;
            return { success: true, documentId };
          }
        }
        return {
          success: false,
          error: `Document already exists: ${errorMessage}`,
        };
      }

      return {
        success: false,
        error: `HTTP ${response.status}: ${errorData?.detail || errorText}`,
      };
    }

    const result = await response.json();
    const documentId =
      result?.results?.id || result?.results?.document_id || result?.id;

    return { success: true, documentId };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { success: false, error: 'Upload cancelled' };
    }
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Runs post-upload tasks in background (collection assignment, verification)
 *
 * @param documentId - Document ID
 * @param collectionsToUse - Collection IDs to add document to
 * @param baseUrl - R2R API base URL
 * @param accessToken - Authentication token
 */
export async function runPostUploadTasks(
  documentId: string,
  collectionsToUse: string[],
  baseUrl: string,
  accessToken: string
): Promise<void> {
  // All tasks run in background - fire and forget
  // 1. Add to collections (with retry)
  if (collectionsToUse.length > 0) {
    for (const collectionId of collectionsToUse) {
      let retries = 3;
      while (retries > 0) {
        try {
          const addResponse = await fetch(
            `${baseUrl}/v3/collections/${collectionId}/documents/${documentId}`,
            {
              method: 'POST',
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          if (addResponse.ok || addResponse.status === 409) {
            console.log(
              `✅ Document ${documentId} added to collection ${collectionId}`
            );
            break;
          }
        } catch {
          // Ignore errors in background
        }
        retries--;
        if (retries > 0) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    }
  }

  // 2. Brief verification (optional, non-blocking)
  try {
    const verifyResponse = await fetch(
      `${baseUrl}/v3/documents/${documentId}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (verifyResponse.ok) {
      const data = await verifyResponse.json();
      console.log(`✅ Document ${documentId} verified:`, data?.results?.id);
    }
  } catch {
    // Ignore verification errors
  }
}
