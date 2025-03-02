// src/components/ui/slider.tsx
import React from 'react';
import { cn } from '../../utils/cn';

interface SliderProps {
  id?: string;
  min?: number;
  max?: number;
  step?: number;
  value: number[];
  onValueChange?: (value: number[]) => void;
  disabled?: boolean;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({ 
  id, 
  min = 0, 
  max = 100, 
  step = 1, 
  value, 
  onValueChange,
  disabled = false,
  className
}) => {
  const [sliderValue, setSliderValue] = React.useState<number>(value[0] || min);
  
  React.useEffect(() => {
    setSliderValue(value[0] || min);
  }, [value, min]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    setSliderValue(newValue);
    if (onValueChange) {
      onValueChange([newValue]);
    }
  };

  const percent = ((sliderValue - min) / (max - min)) * 100;

  return (
    <div className={cn("w-full", className)}>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={sliderValue}
        onChange={handleChange}
        disabled={disabled}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percent}%, #e5e7eb ${percent}%, #e5e7eb 100%)`
        }}
      />
    </div>
  );
};

export default Slider;