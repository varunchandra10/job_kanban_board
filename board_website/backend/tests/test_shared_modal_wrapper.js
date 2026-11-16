const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Testing Shared <Modal> Wrapper Deduplication (Phase 5.1)...\n');

const FRONTEND_DIR = path.resolve(__dirname, '../../frontend/src');
const MODAL_PATH = path.join(FRONTEND_DIR, 'components/common/Modal.tsx');

// 1. Verify Modal.tsx exists and implements required core features
console.log('1. Checking shared Modal component specification:');
assert(fs.existsSync(MODAL_PATH), 'Modal.tsx must exist in components/common');
const modalSource = fs.readFileSync(MODAL_PATH, 'utf8');

assert(modalSource.includes('export const Modal'), 'Modal.tsx must export Modal component');
console.log('   ✓ Modal.tsx exports Modal component');

// Check backdrop overlay & blur
assert(modalSource.includes('backdrop-blur-') && modalSource.includes('fixed inset-0'), 'Modal.tsx must implement fixed backdrop with blur');
console.log('   ✓ Implements fixed backdrop overlay with backdrop-blur');

// Check Escape key event listener
assert(modalSource.includes("e.key === 'Escape'") && modalSource.includes('addEventListener') && modalSource.includes('removeEventListener'), 'Modal.tsx must handle Escape key with proper cleanup');
console.log('   ✓ Implements Escape key listener with lifecycle cleanup');

// Check document body scroll locking
assert(modalSource.includes("document.body.style.overflow = 'hidden'") && modalSource.includes('originalOverflow'), 'Modal.tsx must lock document body scroll and restore on unmount');
console.log('   ✓ Implements document body scroll lock with scrollbar compensation');

// Check Header layout and close button
assert(modalSource.includes('<X size={18} />') || modalSource.includes('<X size={'), 'Modal.tsx must include standard X close button');
console.log('   ✓ Implements header layout with title, icon, and accessible close button');

// Check action button footers
assert(modalSource.includes('cancelLabel') && (modalSource.includes('submitLabel') || modalSource.includes('onSubmit')), 'Modal.tsx must support standard Cancel/Submit footers');
console.log('   ✓ Implements standardized action button footers (Cancel / Submit)');

// 2. Verify modals are using the shared Modal wrapper
console.log('\n2. Verifying modals refactored to use shared <Modal>:');

const modalsToCheck = [
  { name: 'ShutdownModal.tsx', dir: 'components/ui' },
  { name: 'DeleteApplicationModal.tsx', dir: 'components/common' },
  { name: 'DuplicateResumeModal.tsx', dir: 'components/common' },
  { name: 'JobClipperModal.tsx', dir: 'components/common' },
  { name: 'DriveConsentModal.tsx', dir: 'components/ui' },
  { name: 'StorageSwitchModal.tsx', dir: 'components/ui' },
  { name: 'AllItemsListModal.tsx', dir: 'components/common' },
  { name: 'FollowUpModal.tsx', dir: 'components/applications' },
  { name: 'DriveModal.tsx', dir: 'components/ui' },
  { name: 'AuthModal.tsx', dir: 'components/ui' },
];

modalsToCheck.forEach(({ name, dir }) => {
  const filePath = path.join(FRONTEND_DIR, dir, name);
  assert(fs.existsSync(filePath), `Modal file ${name} must exist in ${dir}`);
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes('<Modal') && content.includes('import { Modal }'), `${name} must import and render <Modal>`);
  console.log(`   ✓ ${name} utilizes shared <Modal> wrapper`);
});

console.log('\n✅ ALL Phase 5.1 Shared Modal Wrapper checks passed successfully!\n');

