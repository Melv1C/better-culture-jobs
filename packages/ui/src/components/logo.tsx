import { Layers } from 'lucide-react';

export const Logo = () => {
  return (
    <div className="flex items-center space-x-2">
      <Layers className="h-8 w-8 text-primary" />
      <span className="text-2xl font-bold text-primary">TurboKit</span>
    </div>
  );
};
