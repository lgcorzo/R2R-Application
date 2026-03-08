import { DocumentResponse } from 'r2r-js';
import { useEffect, useRef, useCallback, useState } from 'react';

import { useUserContext } from '@/context/UserContext';
import logger from '@/lib/logger';
import { IngestionStatus, KGExtractionStatus } from '@/types';

interface UseDocumentPollingOptions {
  /**
   * Интервал polling в миллисекундах
   * @default 5000 (5 секунд)
   */
  interval?: number;

  /**
   * Включить polling только для документов с незавершенным статусом
   * @default true
   */
  onlyPending?: boolean;

  /**
   * Callback при успешном обновлении документов
   */
  onUpdate?: (documents: DocumentResponse[]) => void;

  /**
   * Максимальное количество попыток при ошибке
   * @default 3
   */
  maxRetries?: number;
}

/**
 * Custom hook для автоматического обновления статусов документов
 * через периодический polling R2R API
 */
export function useDocumentPolling(
  documentIds: string[],
  options: UseDocumentPollingOptions = {}
) {
  const {
    interval = 5000,
    onlyPending = true,
    onUpdate,
    maxRetries = 3,
  } = options;

  const { getClient } = useUserContext();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const isFetchingRef = useRef(false);

  // ИСПРАВЛЕНИЕ: Используем state вместо ref для реактивности
  const [isPolling, setIsPolling] = useState(false);

  /**
   * Проверяет нужен ли polling для документа
   */
  const needsPolling = useCallback(
    (doc: DocumentResponse): boolean => {
      if (!onlyPending) return true;

      const ingestionPending =
        doc.ingestionStatus !== IngestionStatus.SUCCESS &&
        doc.ingestionStatus !== IngestionStatus.FAILED;

      const extractionPending =
        doc.extractionStatus !== KGExtractionStatus.SUCCESS &&
        doc.extractionStatus !== KGExtractionStatus.FAILED;

      return ingestionPending || extractionPending;
    },
    [onlyPending]
  );

  /**
   * Останавливает polling
   */
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsPolling(false); // ИСПРАВЛЕНИЕ: обновляем state
      logger.info('Stopped document polling');
    }
  }, []);

  /**
   * Получает обновленные данные документов
   */
  const fetchDocumentUpdates = useCallback(async () => {
    if (documentIds.length === 0 || isFetchingRef.current) return;

    try {
      isFetchingRef.current = true;
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      // Получаем данные для каждого документа
      const promises = documentIds.map((id) =>
        client.documents.retrieve({ id }).catch((error) => {
          logger.warn('Failed to fetch document', { documentId: id, error });
          return null;
        })
      );

      const results = await Promise.all(promises);
      const documents = results
        .filter(
          (result): result is { results: DocumentResponse } => result !== null
        )
        .map((result) => result.results);

      // Сбрасываем счетчик ошибок при успехе
      retryCountRef.current = 0;

      // Фильтруем только те, которые еще нужно обновлять
      const pendingDocuments = documents.filter(needsPolling);

      if (onUpdate) {
        onUpdate(documents);
      }

      // Останавливаем polling если все документы завершены
      if (pendingDocuments.length === 0 && onlyPending) {
        logger.info('All documents completed, stopping polling');
        stopPolling();
      }
    } catch (error) {
      logger.error('Error polling document updates', error as Error);
      retryCountRef.current += 1;

      if (retryCountRef.current >= maxRetries) {
        logger.error('Max retries reached, stopping polling');
        stopPolling();
      }
    } finally {
      isFetchingRef.current = false;
    }
  }, [
    documentIds,
    getClient,
    needsPolling,
    onUpdate,
    onlyPending,
    maxRetries,
    stopPolling,
  ]);

  /**
   * Запускает polling
   */
  const startPolling = useCallback(() => {
    if (intervalRef.current) return; // Уже запущен

    logger.info('Starting document polling', {
      interval,
      documentCount: documentIds.length,
    });

    setIsPolling(true); // ИСПРАВЛЕНИЕ: обновляем state

    // Первый запрос сразу
    fetchDocumentUpdates();

    // Затем по интервалу
    intervalRef.current = setInterval(fetchDocumentUpdates, interval);
  }, [interval, documentIds.length, fetchDocumentUpdates]);

  /**
   * Перезапускает polling (полезно при изменении списка документов)
   */
  const restartPolling = useCallback(() => {
    stopPolling();
    if (documentIds.length > 0) {
      startPolling();
    }
  }, [stopPolling, startPolling, documentIds.length]);

  /**
   * Effect для автоматического управления lifecycle
   */
  useEffect(() => {
    if (documentIds.length > 0) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [documentIds.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    startPolling,
    stopPolling,
    restartPolling,
    isPolling, // Теперь реактивен!
  };
}
