import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';

export interface AccessibilityPreferences {
  simpleReadingMode: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
}

const STORAGE_KEY = 'accessiux.accessibility-preferences.v1';
const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  simpleReadingMode: false,
  reducedMotion: false,
  highContrast: false,
  largeText: false,
};

@Injectable({ providedIn: 'root' })
export class AccessibilityPreferencesService {
  private readonly document = inject(DOCUMENT);
  private readonly initialPreferences = this.readStoredPreferences();

  readonly simpleReadingMode = signal(this.initialPreferences.simpleReadingMode);
  readonly reducedMotion = signal(this.initialPreferences.reducedMotion);
  readonly highContrast = signal(this.initialPreferences.highContrast);
  readonly largeText = signal(this.initialPreferences.largeText);

  constructor() {
    effect(() => {
      const preferences: AccessibilityPreferences = {
        simpleReadingMode: this.simpleReadingMode(),
        reducedMotion: this.reducedMotion(),
        highContrast: this.highContrast(),
        largeText: this.largeText(),
      };

      this.applyToDocument(preferences);
      this.persist(preferences);
    });
  }

  setSimpleReadingMode(enabled: boolean): void {
    this.simpleReadingMode.set(enabled);
  }

  setReducedMotion(enabled: boolean): void {
    this.reducedMotion.set(enabled);
  }

  setHighContrast(enabled: boolean): void {
    this.highContrast.set(enabled);
  }

  setLargeText(enabled: boolean): void {
    this.largeText.set(enabled);
  }

  reset(): void {
    this.simpleReadingMode.set(DEFAULT_PREFERENCES.simpleReadingMode);
    this.reducedMotion.set(DEFAULT_PREFERENCES.reducedMotion);
    this.highContrast.set(DEFAULT_PREFERENCES.highContrast);
    this.largeText.set(DEFAULT_PREFERENCES.largeText);
  }

  private applyToDocument(preferences: AccessibilityPreferences): void {
    const root = this.document.documentElement;
    root.toggleAttribute('data-simple-reading', preferences.simpleReadingMode);
    root.toggleAttribute('data-reduce-motion', preferences.reducedMotion);
    root.toggleAttribute('data-high-contrast', preferences.highContrast);
    root.toggleAttribute('data-large-text', preferences.largeText);
  }

  private readStoredPreferences(): AccessibilityPreferences {
    const storage = this.document.defaultView?.localStorage;
    if (!storage) return { ...DEFAULT_PREFERENCES };

    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_PREFERENCES };

      const parsed = JSON.parse(raw) as Partial<AccessibilityPreferences>;
      return {
        simpleReadingMode: parsed.simpleReadingMode === true,
        reducedMotion: parsed.reducedMotion === true,
        highContrast: parsed.highContrast === true,
        largeText: parsed.largeText === true,
      };
    } catch {
      return { ...DEFAULT_PREFERENCES };
    }
  }

  private persist(preferences: AccessibilityPreferences): void {
    const storage = this.document.defaultView?.localStorage;
    if (!storage) return;

    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Storage may be unavailable in strict privacy modes. Preferences still apply for the current session.
    }
  }
}
