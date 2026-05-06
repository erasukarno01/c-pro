import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, HelpCircle, Keyboard, Maximize2, Minimize2, Moon, Settings, Sun, Type, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  darkMode: boolean;
  fontSize: "small" | "medium" | "large" | "extra-large";
  zoomLevel: number;
}

export function AccessibilityFeatures() {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReader: false,
    keyboardNavigation: false,
    darkMode: false,
    fontSize: "medium",
    zoomLevel: 1,
  });
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const announceToScreenReader = useCallback((message: string) => {
    const el = document.createElement("div");
    el.setAttribute("aria-live", "polite");
    el.setAttribute("aria-atomic", "true");
    el.className = "sr-only";
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 1000);
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    root.classList.toggle("high-contrast", settings.highContrast);
    root.classList.toggle("large-text", settings.largeText);
    root.classList.toggle("reduced-motion", settings.reducedMotion);
    root.classList.toggle("dark-mode", settings.darkMode);
    root.classList.toggle("screen-reader-mode", settings.screenReader);

    const sizeMap: Record<AccessibilitySettings["fontSize"], string> = {
      small: "14px",
      medium: "16px",
      large: "18px",
      "extra-large": "20px",
    };
    root.style.fontSize = sizeMap[settings.fontSize];
    root.style.transform = `scale(${settings.zoomLevel})`;
    root.style.transformOrigin = "top left";

    if (settings.reducedMotion) {
      root.style.setProperty("--transition-duration", "0s");
      root.style.setProperty("--animation-duration", "0s");
    } else {
      root.style.removeProperty("--transition-duration");
      root.style.removeProperty("--animation-duration");
    }

    if (settings.screenReader) announceToScreenReader("Accessibility settings updated");
  }, [settings, announceToScreenReader]);

  const updateSetting = useCallback(
    <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
      if (settings.screenReader) announceToScreenReader(`${key} updated`);
    },
    [announceToScreenReader, settings.screenReader],
  );

  const handleShortcut = useCallback(
    (event: KeyboardEvent) => {
      if (!event.altKey) return;
      switch (event.key.toLowerCase()) {
        case "h":
          event.preventDefault();
          setIsHelpOpen((v) => !v);
          break;
        case "c":
          event.preventDefault();
          updateSetting("highContrast", !settings.highContrast);
          break;
        case "t":
          event.preventDefault();
          updateSetting("largeText", !settings.largeText);
          break;
        case "m":
          event.preventDefault();
          updateSetting("reducedMotion", !settings.reducedMotion);
          break;
        case "d":
          event.preventDefault();
          updateSetting("darkMode", !settings.darkMode);
          break;
      }
    },
    [settings.darkMode, settings.highContrast, settings.largeText, settings.reducedMotion, updateSetting],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, [handleShortcut]);

  const sizes: AccessibilitySettings["fontSize"][] = ["small", "medium", "large", "extra-large"];
  const currentSizeIndex = sizes.indexOf(settings.fontSize);

  return (
    <div className="accessibility-features">
      <Card className="p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Accessibility</h3>
          <Button variant="ghost" size="sm" onClick={() => setIsHelpOpen((v) => !v)} aria-label="Accessibility help">
            <HelpCircle className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant={settings.highContrast ? "default" : "outline"} size="sm" onClick={() => updateSetting("highContrast", !settings.highContrast)}>
            <Eye className="h-4 w-4 mr-2" />
            High Contrast
          </Button>
          <Button variant={settings.largeText ? "default" : "outline"} size="sm" onClick={() => updateSetting("largeText", !settings.largeText)}>
            <Type className="h-4 w-4 mr-2" />
            Large Text
          </Button>
          <Button variant={settings.reducedMotion ? "default" : "outline"} size="sm" onClick={() => updateSetting("reducedMotion", !settings.reducedMotion)}>
            <Settings className="h-4 w-4 mr-2" />
            Reduced Motion
          </Button>
          <Button variant={settings.darkMode ? "default" : "outline"} size="sm" onClick={() => updateSetting("darkMode", !settings.darkMode)}>
            {settings.darkMode ? <Moon className="h-4 w-4 mr-2" /> : <Sun className="h-4 w-4 mr-2" />}
            Dark Mode
          </Button>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <span className="text-sm font-medium">Font Size</span>
          <Button variant="outline" size="sm" onClick={() => updateSetting("fontSize", sizes[Math.max(0, currentSizeIndex - 1)])}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm min-w-[90px] text-center capitalize">{settings.fontSize.replace("-", " ")}</span>
          <Button variant="outline" size="sm" onClick={() => updateSetting("fontSize", sizes[Math.min(sizes.length - 1, currentSizeIndex + 1)])}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-3 mt-3">
          <span className="text-sm font-medium">Zoom</span>
          <Button variant="outline" size="sm" onClick={() => updateSetting("zoomLevel", Math.max(0.5, settings.zoomLevel - 0.1))}>
            <Minimize2 className="h-4 w-4" />
          </Button>
          <span className="text-sm min-w-[60px] text-center">{Math.round(settings.zoomLevel * 100)}%</span>
          <Button variant="outline" size="sm" onClick={() => updateSetting("zoomLevel", Math.min(2, settings.zoomLevel + 0.1))}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-3 mt-3">
          <Button variant={settings.keyboardNavigation ? "default" : "outline"} size="sm" onClick={() => updateSetting("keyboardNavigation", !settings.keyboardNavigation)}>
            <Keyboard className="h-4 w-4 mr-2" />
            Keyboard Navigation
          </Button>
        </div>
      </Card>

      {isHelpOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="max-w-xl w-full p-5 max-h-[80vh] overflow-auto">
            <h2 className="text-lg font-semibold mb-3">Accessibility Help</h2>
            <div className="text-sm space-y-2">
              <p><kbd>Alt + H</kbd> open/close help</p>
              <p><kbd>Alt + C</kbd> toggle high contrast</p>
              <p><kbd>Alt + T</kbd> toggle large text</p>
              <p><kbd>Alt + M</kbd> toggle reduced motion</p>
              <p><kbd>Alt + D</kbd> toggle dark mode</p>
            </div>
            <div className="mt-4">
              <Button onClick={() => setIsHelpOpen(false)} className="w-full">Close</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export function AccessibleForm({
  children,
  onSubmit,
  ariaLabel,
  describedBy,
}: {
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  ariaLabel?: string;
  describedBy?: string;
}) {
  return (
    <form onSubmit={onSubmit} aria-label={ariaLabel} aria-describedby={describedBy} noValidate>
      {children}
    </form>
  );
}

export function AccessibleInput({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  required = false,
  error,
  helperText,
  id,
  ...props
}: {
  label: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  error?: string;
  helperText?: string;
  id?: string;
  [key: string]: unknown;
}) {
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helperText ? `${inputId}-helper` : undefined;

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        required={required}
        aria-invalid={!!error}
        aria-describedby={[errorId, helperId].filter(Boolean).join(" ") || undefined}
        className={cn(
          "w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          error && "border-red-500 focus:ring-red-500 focus:border-red-500",
        )}
        {...props}
      />
      {error && <div id={errorId} className="text-sm text-red-600">{error}</div>}
      {helperText && !error && <div id={helperId} className="text-sm text-gray-600">{helperText}</div>}
    </div>
  );
}

export function AccessibleButton({
  children,
  onClick,
  variant = "default",
  size = "default",
  disabled = false,
  loading = false,
  ariaLabel,
  describedBy,
  ...props
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "sm" | "default" | "lg";
  disabled?: boolean;
  loading?: boolean;
  ariaLabel?: string;
  describedBy?: string;
  [key: string]: unknown;
}) {
  return (
    <Button
      onClick={onClick}
      variant={variant}
      size={size}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-describedby={describedBy}
      aria-busy={loading}
      {...props}
    >
      {loading ? "Loading..." : children}
    </Button>
  );
}

export function SkipToMainContent() {
  return (
    <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50">
      Skip to main content
    </a>
  );
}

export function useFocusManagement(isOpen: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      const firstFocusable = containerRef.current?.querySelector(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
      ) as HTMLElement | null;
      if (firstFocusable) firstFocusable.focus();
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [isOpen]);

  return containerRef;
}
