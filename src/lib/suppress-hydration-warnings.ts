/**
 * Suppress hydration warnings caused by browser extensions
 * This is safe because these warnings are caused by third-party extensions
 * adding attributes like 'fdprocessedidat' to DOM elements
 */

if (typeof window !== 'undefined') {
  // Only suppress in development
  if (process.env.NODE_ENV === 'development') {
    const originalError = console.error;
    
    console.error = (...args: any[]) => {
      // Suppress specific hydration warnings from browser extensions
      const firstArg = args[0];
      
      if (typeof firstArg === 'string') {
        // Check for hydration warnings related to browser extensions
        if (
          firstArg.includes('Extra attributes from the server') ||
          firstArg.includes('fdprocessedidat') ||
          firstArg.includes('Hydration failed because')
        ) {
          // Check if it's specifically about browser extension attributes
          const stackTrace = args.join(' ');
          if (stackTrace.includes('fdprocessedidat')) {
            return; // Suppress this warning
          }
        }
      }
      
      // Call original console.error for all other errors
      originalError.apply(console, args);
    };
  }
  
  // Clean up browser extension attributes after mount
  if (typeof document !== 'undefined') {
    const cleanupAttributes = () => {
      const elements = document.querySelectorAll('[fdprocessedidat]');
      elements.forEach((el) => {
        el.removeAttribute('fdprocessedidat');
      });
    };
    
    // Run cleanup after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', cleanupAttributes);
    } else {
      cleanupAttributes();
    }
    
    // Also run periodically to catch dynamically added elements
    setInterval(cleanupAttributes, 1000);
  }
}

export {};
