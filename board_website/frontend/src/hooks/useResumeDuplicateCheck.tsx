import React, { useState, useCallback } from 'react';
import { api } from '../services/api';
import { DuplicateResumeModal } from '../components/common/DuplicateResumeModal';

export interface DuplicateResumeInfo {
  file: File;
  fileName: string;
  existingLink: string;
}

export interface UseResumeDuplicateCheckOptions {
  storageMode?: string;
  showToast?: (message: string) => void;
  onSelectSame?: (info: DuplicateResumeInfo) => void | Promise<void>;
  onSelectDifferent?: (
    renamedFile: File,
    newFileName: string,
    info: DuplicateResumeInfo
  ) => void | Promise<void>;
  onCancel?: () => void;
}

export function useResumeDuplicateCheck(options: UseResumeDuplicateCheckOptions = {}) {
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [duplicateResumeInfo, setDuplicateResumeInfo] = useState<DuplicateResumeInfo | null>(null);

  /**
   * Checks if a resume file with identical name already exists in Google Drive.
   * If collision is found, sets duplicateResumeInfo, opens the modal, and returns true.
   * If no collision or not using Google Drive, returns false.
   */
  const checkForDuplicate = useCallback(
    async (file: File, mode?: string): Promise<boolean> => {
      const activeMode = mode ?? options.storageMode;
      if (activeMode !== 'g_drive') {
        return false;
      }
      try {
        const checkRes = await api.checkDriveFile(file.name, 'resume');
        if (checkRes.exists && checkRes.file?.webViewLink) {
          setDuplicateResumeInfo({
            file,
            fileName: checkRes.file.name || file.name,
            existingLink: checkRes.file.webViewLink,
          });
          setIsDuplicateModalOpen(true);
          return true;
        }
      } catch (err) {
        console.warn('[Check Drive Resume Duplicate Error]:', err);
      }
      return false;
    },
    [options.storageMode]
  );

  const handleSelectSame = useCallback(async () => {
    if (!duplicateResumeInfo) return;
    const info = duplicateResumeInfo;
    setIsDuplicateModalOpen(false);
    setDuplicateResumeInfo(null);
    if (options.onSelectSame) {
      await options.onSelectSame(info);
    } else if (options.showToast) {
      options.showToast(`Linked existing "${info.fileName}" from Google Drive!`);
    }
  }, [duplicateResumeInfo, options]);

  const handleSelectDifferent = useCallback(
    async (newFileName: string) => {
      if (!duplicateResumeInfo) return;
      const info = duplicateResumeInfo;
      const originalFile = info.file;
      const renamedFile = new File([originalFile], newFileName, { type: originalFile.type });
      setIsDuplicateModalOpen(false);
      setDuplicateResumeInfo(null);
      if (options.onSelectDifferent) {
        await options.onSelectDifferent(renamedFile, newFileName, info);
      }
    },
    [duplicateResumeInfo, options]
  );

  const handleCancel = useCallback(() => {
    setIsDuplicateModalOpen(false);
    setDuplicateResumeInfo(null);
    if (options.onCancel) {
      options.onCancel();
    }
  }, [options]);

  /**
   * Optional helper to render the DuplicateResumeModal directly in parent JSX.
   */
  const renderDuplicateModal = useCallback(
    (company: string, role: string) => {
      if (!duplicateResumeInfo) return null;
      return (
        <DuplicateResumeModal
          isOpen={isDuplicateModalOpen}
          fileName={duplicateResumeInfo.fileName}
          existingLink={duplicateResumeInfo.existingLink}
          company={company}
          role={role}
          onSelectSame={handleSelectSame}
          onSelectDifferent={handleSelectDifferent}
          onCancel={handleCancel}
        />
      );
    },
    [duplicateResumeInfo, isDuplicateModalOpen, handleSelectSame, handleSelectDifferent, handleCancel]
  );

  return {
    isDuplicateModalOpen,
    duplicateResumeInfo,
    checkForDuplicate,
    handleSelectSame,
    handleSelectDifferent,
    handleCancel,
    setDuplicateResumeInfo,
    setIsDuplicateModalOpen,
    renderDuplicateModal,
  };
}

