import { slides } from '../src/slides.config';

// Helper to sanitize the configuration for JSON export
const sanitize = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(sanitize);
  }
  
  if (typeof data === 'object' && data !== null) {
    const newObj: any = {};
    for (const key in data) {
      const value = data[key];
      
      // Check if it's a Lucide Icon (function)
      if (key === 'icon' && typeof value === 'function') {
        // Use the function name (e.g. "Target", "PenLine")
        // or fall back to "Icon"
        // Lucide icons often have a displayName or just name
        newObj[key] = value.displayName || value.name || 'Icon';
      } else if (key === 'icon' && typeof value === 'object') {
        // Sometimes React elements are objects
        newObj[key] = 'Icon'; 
      } else {
        newObj[key] = sanitize(value);
      }
    }
    return newObj;
  }
  
  return data;
};

const sanitizedSlides = sanitize(slides);
console.log(JSON.stringify(sanitizedSlides, null, 2));
