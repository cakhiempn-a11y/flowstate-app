import React from 'react';
import * as Icons from 'lucide-react';

export function DynamicIcon({ name, ...props }: { name: string, [key: string]: any }) {
  // Convert kebab-case or string to PascalCase if needed, but the demo data has 'book', 'briefcase'.
  // Actually lucide-react exports PascalCase. Let's map it.
  const toPascal = (str: string) => str.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
  const IconComponent = (Icons as any)[toPascal(name)] || Icons.Circle;
  return <IconComponent {...props} />;
}
