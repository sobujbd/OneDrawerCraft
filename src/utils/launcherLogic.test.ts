import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_ANDROID_APPS, REFERENCE_NOW } from '../data/appsData';
import {
  computeRadarMetrics,
  filterApps,
  formatStorageSize,
  getAppInitials,
  getSmartStoreAction,
  getTotalAppSizeMb,
  matchesOmniSearch,
  sortApps,
  textToT9,
} from './launcherLogic';

test('textToT9 converts app names into accurate T9 keypad digits', () => {
  assert.equal(textToT9('WhatsApp'), '94287277');
  assert.equal(textToT9('Termux'), '837689');
  assert.equal(textToT9('VLC'), '852');
});

test('getAppInitials extracts multi-word and camelCase initials', () => {
  assert.equal(getAppInitials('Google Play Services'), 'gps');
  assert.equal(getAppInitials('WhatsApp'), 'wa');
  assert.equal(getAppInitials('LocalSend LAN'), 'll');
});

test('matchesOmniSearch supports name, initials, package ID, permissions, and T9 digits', () => {
  const whatsapp = INITIAL_ANDROID_APPS.find((a) => a.id === 'whatsapp')!;
  const shizuku = INITIAL_ANDROID_APPS.find((a) => a.id === 'shizuku')!;

  // Initials match
  assert.equal(matchesOmniSearch(whatsapp, 'wa'), true);
  // Package name match
  assert.equal(matchesOmniSearch(shizuku, 'moe.shizuku'), true);
  // Permission match
  assert.equal(matchesOmniSearch(shizuku, 'WRITE_SECURE_SETTINGS'), true);
  // T9 digits match ("9428" -> "what")
  assert.equal(matchesOmniSearch(whatsapp, '9428'), true);
  // Non-matching query
  assert.equal(matchesOmniSearch(whatsapp, 'nonexistentxyz'), false);
});

test('filterApps respects category pills, system app toggle, and vault isolation', () => {
  // Vault apps should not appear in ALL
  const allWithoutSystem = filterApps(INITIAL_ANDROID_APPS, 'ALL', '', false, REFERENCE_NOW);
  assert.equal(allWithoutSystem.some((a) => a.isHiddenInVault), false);
  assert.equal(allWithoutSystem.some((a) => a.isSystem), false);

  // System apps appear when SYSTEM category is selected
  const systemOnly = filterApps(INITIAL_ANDROID_APPS, 'SYSTEM', '', false, REFERENCE_NOW);
  assert.equal(systemOnly.length > 0, true);
  assert.equal(systemOnly.every((a) => a.isSystem), true);

  // Vault category returns only vault-hidden apps
  const vaultOnly = filterApps(INITIAL_ANDROID_APPS, 'VAULT', '', true, REFERENCE_NOW);
  assert.equal(vaultOnly.length >= 3, true);
  assert.equal(vaultOnly.every((a) => a.isHiddenInVault), true);
});

test('sortApps orders accurately across SIZE_DESC, MOST_USED, and SDK_ASC', () => {
  const bySize = sortApps(INITIAL_ANDROID_APPS, 'SIZE_DESC');
  assert.equal(
    getTotalAppSizeMb(bySize[0]) >= getTotalAppSizeMb(bySize[1]),
    true
  );

  const byUsed = sortApps(INITIAL_ANDROID_APPS, 'MOST_USED');
  assert.equal(byUsed[0].launchCount >= byUsed[1].launchCount, true);

  const bySdk = sortApps(INITIAL_ANDROID_APPS, 'SDK_ASC');
  assert.equal(bySdk[0].targetSdk <= bySdk[bySdk.length - 1].targetSdk, true);
});

test('getSmartStoreAction differentiates PLAY_STORE vs SIDELOADED/SYSTEM apps', () => {
  const spotify = INITIAL_ANDROID_APPS.find((a) => a.id === 'spotify')!;
  const termux = INITIAL_ANDROID_APPS.find((a) => a.id === 'termux')!;

  const playAction = getSmartStoreAction(spotify);
  assert.equal(playAction.type, 'PLAY_STORE');
  assert.equal(playAction.primaryLabel, 'Open in Google Play Store');
  assert.equal(playAction.marketUri, 'market://details?id=com.spotify.music');

  const sideloadAction = getSmartStoreAction(termux);
  assert.equal(sideloadAction.type, 'APK_OR_WEB_LOOKUP');
  assert.equal(sideloadAction.primaryLabel, 'Search Package Online / Export APK');
  assert.equal(sideloadAction.marketUri, null);
});

test('computeRadarMetrics identifies storage hogs, unused 30d+ apps, and outdated SDKs', () => {
  const metrics = computeRadarMetrics(INITIAL_ANDROID_APPS, REFERENCE_NOW);
  assert.equal(metrics.storageHogs.length, 8);
  assert.equal(metrics.unusedApps.length > 0, true);
  assert.equal(metrics.outdatedSdkApps.some((a) => a.targetSdk <= 30), true);
  assert.equal(formatStorageSize(2048), '2.00 GB');
});
