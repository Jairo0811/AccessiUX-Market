# Accessible invoice – design notes

The AccessiUX Market invoice is delivered as semantic HTML first and can be printed or saved as PDF by the browser.

## Accessibility behavior

- The invoice exposes a concise screen-reader summary with invoice number, completed state, payment method and total.
- The visible status includes the text label `Estado:` so completion is never communicated by color alone.
- The invoice exposes shortcuts for the existing global accessibility preferences: large text, high contrast and simple reading mode.
- Those controls reuse `AccessibilityPreferencesService`, so the same persisted preferences continue to apply across the application.
- Keyboard focus remains visible on invoice controls and the scrollable item table.
- High-contrast and forced-colors modes reinforce borders, underlines and text rather than relying on gradients or color alone.
- Printing hides interactive controls and keeps the commercial document itself clean.
- Default print typography is intentionally larger than the previous compact invoice. When the user enables large text, print typography grows further even if the invoice needs additional pages.
- The item table repeats its header across printed pages and avoids splitting individual rows when possible.

## PDF scope

Browser “Save as PDF” output is provided as a convenience. The source HTML is semantic and accessible, but browser-generated PDF tagging varies by browser and operating system. AccessiUX Market therefore does not claim that every generated PDF is a fully tagged PDF/UA document.
