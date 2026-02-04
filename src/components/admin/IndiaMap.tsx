import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

// Major Indian cities with approximate SVG coordinates (simplified for prototype)
const cityCoordinates: Record<string, { x: number; y: number }> = {
  'bangalore': { x: 170, y: 320 },
  'bengaluru': { x: 170, y: 320 },
  'mumbai': { x: 115, y: 220 },
  'delhi': { x: 175, y: 95 },
  'new delhi': { x: 175, y: 95 },
  'chennai': { x: 190, y: 330 },
  'hyderabad': { x: 175, y: 260 },
  'kolkata': { x: 275, y: 195 },
  'pune': { x: 130, y: 240 },
  'ahmedabad': { x: 115, y: 175 },
  'jaipur': { x: 155, y: 130 },
  'mysore': { x: 165, y: 335 },
  'mysuru': { x: 165, y: 335 },
  'mangalore': { x: 145, y: 330 },
  'mangaluru': { x: 145, y: 330 },
  'kochi': { x: 155, y: 360 },
  'coimbatore': { x: 165, y: 350 },
  'lucknow': { x: 210, y: 130 },
  'chandigarh': { x: 170, y: 80 },
  'indore': { x: 155, y: 185 },
  'bhopal': { x: 170, y: 185 },
  'nagpur': { x: 185, y: 210 },
  'visakhapatnam': { x: 220, y: 260 },
  'patna': { x: 245, y: 145 },
  'gurgaon': { x: 170, y: 105 },
  'gurugram': { x: 170, y: 105 },
  'noida': { x: 180, y: 100 },
  'ghaziabad': { x: 180, y: 98 },
  'surat': { x: 115, y: 200 },
  'vadodara': { x: 120, y: 190 },
  'rajkot': { x: 100, y: 180 },
  'thiruvananthapuram': { x: 160, y: 385 },
  'varanasi': { x: 225, y: 140 },
  'agra': { x: 185, y: 120 },
  'madurai': { x: 175, y: 370 },
  'jalandhar': { x: 160, y: 75 },
  'ludhiana': { x: 160, y: 78 },
  'nashik': { x: 130, y: 220 },
  'ranchi': { x: 245, y: 180 },
  'raipur': { x: 210, y: 205 },
  'guwahati': { x: 310, y: 140 },
  'bhubaneswar': { x: 245, y: 220 },
};

interface CityData {
  city: string;
  count: number;
}

interface IndiaMapProps {
  franchisesByCity: CityData[];
}

export function IndiaMap({ franchisesByCity }: IndiaMapProps) {
  const [hoveredCity, setHoveredCity] = useState<CityData | null>(null);

  const getPinPosition = (city: string) => {
    const normalized = city.toLowerCase().trim();
    return cityCoordinates[normalized] || null;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Franchise Network Map
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <div className="relative w-full aspect-[3/4] max-h-[400px]">
          {/* Simplified India outline SVG */}
          <svg
            viewBox="0 0 400 450"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* India outline - simplified path */}
            <path
              d="M165,50 L180,45 L200,50 L220,55 L250,60 L280,65 L310,80 
                 L330,100 L340,130 L335,160 L320,180 L310,200 L295,210 
                 L280,200 L265,210 L255,230 L250,250 L255,270 L250,290 
                 L240,310 L230,330 L210,350 L195,370 L180,390 L170,400 
                 L165,395 L160,380 L155,360 L145,340 L130,320 L115,300 
                 L105,280 L100,260 L95,240 L90,220 L85,200 L90,180 
                 L95,160 L105,140 L115,120 L125,100 L140,80 L155,60 Z"
              fill="hsl(var(--muted))"
              stroke="hsl(var(--border))"
              strokeWidth="2"
              className="transition-colors"
            />
            
            {/* City pins */}
            {franchisesByCity.map((cityData) => {
              const pos = getPinPosition(cityData.city);
              if (!pos) return null;
              
              const isHovered = hoveredCity?.city === cityData.city;
              const pinSize = Math.min(8 + cityData.count * 2, 16);
              
              return (
                <g
                  key={cityData.city}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onMouseEnter={() => setHoveredCity(cityData)}
                  onMouseLeave={() => setHoveredCity(null)}
                  className="cursor-pointer"
                >
                  {/* Pulse animation for larger centers */}
                  {cityData.count >= 2 && (
                    <circle
                      r={pinSize + 4}
                      fill="hsl(var(--primary))"
                      opacity="0.2"
                      className="animate-pulse"
                    />
                  )}
                  {/* Main pin circle */}
                  <circle
                    r={pinSize}
                    fill={isHovered ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.8)'}
                    stroke="hsl(var(--background))"
                    strokeWidth="2"
                    className="transition-all duration-200"
                  />
                  {/* Count text */}
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="hsl(var(--primary-foreground))"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    {cityData.count}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Hover tooltip */}
          {hoveredCity && (
            <div 
              className="absolute bg-popover text-popover-foreground px-3 py-2 rounded-lg shadow-lg border text-sm pointer-events-none z-10"
              style={{
                left: '50%',
                top: '10px',
                transform: 'translateX(-50%)',
              }}
            >
              <p className="font-semibold">{hoveredCity.city}</p>
              <p className="text-muted-foreground">
                {hoveredCity.count} {hoveredCity.count === 1 ? 'Center' : 'Centers'}
              </p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-primary/80" />
            <span>Active Center</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-4 w-4 rounded-full bg-primary/20 animate-pulse" />
            <span>Multiple Centers</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
