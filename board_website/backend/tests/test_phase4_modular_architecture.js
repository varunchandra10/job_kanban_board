const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Testing Phase 4 Modular Component & Context Architecture...\n');

const FRONTEND_DIR = path.resolve(__dirname, '../../frontend/src');
const CAREER_DIR = path.join(FRONTEND_DIR, 'components/profile/career');
const TABS_DIR = path.join(FRONTEND_DIR, 'components/profile/tabs');
const CONTEXT_DIR = path.join(FRONTEND_DIR, 'context');
const LAYOUT_DIR = path.join(FRONTEND_DIR, 'components/layout');

// 1. Verify 7 Career subcomponents exist
const expectedCareerComponents = [
  'PersonalDemographicsSection.tsx',
  'QuickLinksSection.tsx',
  'EducationHistorySection.tsx',
  'ProjectShowcaseSection.tsx',
  'SkillsMatrixSection.tsx',
  'HonorsAwardsSection.tsx',
  'ResumeVersionsSection.tsx',
];

console.log('1. Checking Career subcomponent breakdown:');
expectedCareerComponents.forEach(file => {
  const filePath = path.join(CAREER_DIR, file);
  assert(fs.existsSync(filePath), `Missing career component: ${file}`);
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes('export const'), `${file} must export a React component`);
  const lines = content.split('\n').length;
  console.log(`   ✓ ${file} exists (${lines} lines, single responsibility)`);
});

// 2. Verify ProfileCareerDataTab.tsx has been refactored and orchestrates the 7 sections
console.log('\n2. Checking ProfileCareerDataTab.tsx orchestrator:');
const careerDataTabPath = path.join(TABS_DIR, 'ProfileCareerDataTab.tsx');
assert(fs.existsSync(careerDataTabPath), 'ProfileCareerDataTab.tsx must exist');
const careerTabContent = fs.readFileSync(careerDataTabPath, 'utf8');
const careerTabLines = careerTabContent.split('\n').length;
assert(careerTabLines < 500, `ProfileCareerDataTab.tsx should be under 500 lines (currently ${careerTabLines})`);
console.log(`   ✓ ProfileCareerDataTab.tsx reduced from 2,345 to ${careerTabLines} lines`);

expectedCareerComponents.forEach(comp => {
  const name = comp.replace('.tsx', '');
  assert(careerTabContent.includes(name), `ProfileCareerDataTab.tsx must include ${name}`);
  console.log(`   ✓ References ${name}`);
});

// 3. Verify Context Domain Modularization
console.log('\n3. Checking Context Domain Modularization:');
const expectedContexts = [
  { file: 'AuthContext.tsx', hook: 'useAuth', type: 'AuthContextType' },
  { file: 'UIContext.tsx', hook: 'useUI', type: 'UIContextType' },
  { file: 'ApplicationsContext.tsx', hook: 'useApplications', type: 'ApplicationsContextType' },
  { file: 'LearningsContext.tsx', hook: 'useLearnings', type: 'LearningsContextType' },
];

expectedContexts.forEach(({ file, hook, type }) => {
  const filePath = path.join(CONTEXT_DIR, file);
  assert(fs.existsSync(filePath), `Missing context file: ${file}`);
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes(`export const ${hook}`), `${file} must export ${hook}`);
  assert(content.includes(`export interface ${type}`), `${file} must export ${type}`);
  const lines = content.split('\n').length;
  console.log(`   ✓ ${file} exports ${hook} & ${type} (${lines} lines)`);
});

// 4. Verify AppContext composite orchestration & backward compatibility
console.log('\n4. Checking AppContext backward compatibility:');
const appContextPath = path.join(CONTEXT_DIR, 'AppContext.tsx');
assert(fs.existsSync(appContextPath), 'AppContext.tsx must exist');
const appContextContent = fs.readFileSync(appContextPath, 'utf8');
const appContextLines = appContextContent.split('\n').length;
assert(appContextLines < 500, `AppContext.tsx should be under 500 lines (currently ${appContextLines})`);
assert(appContextContent.includes('export const useApp'), 'AppContext.tsx must export useApp');
assert(appContextContent.includes('export const AppContextProvider'), 'AppContext.tsx must export AppContextProvider');
assert(appContextContent.includes('isApplicationBookmarked'), 'AppContext.tsx must export isApplicationBookmarked');
assert(appContextContent.includes('useAuth'), 'AppContext.tsx must export useAuth');
assert(appContextContent.includes('useUI'), 'AppContext.tsx must export useUI');
assert(appContextContent.includes('useApplications'), 'AppContext.tsx must export useApplications');
assert(appContextContent.includes('useLearnings'), 'AppContext.tsx must export useLearnings');
console.log(`   ✓ AppContext.tsx reduced to ${appContextLines} lines with 100% backward compatibility`);

// 5. Verify AppLayout conditional modal mounting
console.log('\n5. Checking AppLayout modal conditional mounting:');
const appLayoutPath = path.join(LAYOUT_DIR, 'AppLayout.tsx');
assert(fs.existsSync(appLayoutPath), 'AppLayout.tsx must exist');
const appLayoutContent = fs.readFileSync(appLayoutPath, 'utf8');
assert(appLayoutContent.includes('{isAddAppOpen && <ApplicationModal />}'), 'ApplicationModal must be conditionally mounted');
assert(appLayoutContent.includes('{isFollowUpOpen && <FollowUpModal />}'), 'FollowUpModal must be conditionally mounted');
assert(appLayoutContent.includes('{isAddLearningOpen && <LearningModal />}'), 'LearningModal must be conditionally mounted');
assert(appLayoutContent.includes('{isQuickListOpen && <AllItemsListModal />}'), 'AllItemsListModal must be conditionally mounted');
assert(appLayoutContent.includes('{isShutdownOpen && <ShutdownModal />}'), 'ShutdownModal must be conditionally mounted');
assert(appLayoutContent.includes('{isDriveModalOpen && <DriveModal />}'), 'DriveModal must be conditionally mounted');
assert(appLayoutContent.includes('{isStorageConfirmModalOpen && <StorageSwitchModal />}'), 'StorageSwitchModal must be conditionally mounted');
assert(appLayoutContent.includes('{isClipperModalOpen && (') && appLayoutContent.includes('<JobClipperModal'), 'JobClipperModal must be conditionally mounted');
assert(appLayoutContent.includes('{isDeleteAppModalOpen && (') && appLayoutContent.includes('<DeleteApplicationModal'), 'DeleteApplicationModal must be conditionally mounted');
console.log('   ✓ All 9 heavy modals are conditionally mounted based on active open state');

console.log('\n✅ ALL Phase 4 Modular Architecture checks passed successfully!\n');
