'use client';

import Image from 'next/image';

interface MoleculeProps {
  className?: string;
  count?: number;
}

// Predefined positions and animations for molecules - larger, more visible
const moleculeConfigs = [
  { top: '5%', left: '2%', size: 150, delay: '0s', duration: '25s', rotate: true },
  { top: '15%', right: '3%', size: 180, delay: '3s', duration: '30s', rotate: false },
  { top: '55%', left: '1%', size: 120, delay: '6s', duration: '22s', rotate: true },
  { top: '70%', right: '2%', size: 160, delay: '4s', duration: '28s', rotate: false },
  { top: '35%', left: '4%', size: 100, delay: '8s', duration: '20s', rotate: true },
  { top: '85%', right: '5%', size: 130, delay: '5s', duration: '24s', rotate: false },
  { top: '25%', right: '1%', size: 140, delay: '2s', duration: '26s', rotate: true },
  { top: '45%', left: '3%', size: 110, delay: '7s', duration: '23s', rotate: false },
];

export default function FloatingMolecules({ className = '', count = 6 }: MoleculeProps) {
  const molecules = moleculeConfigs.slice(0, count);

  return (
    <div className={`pointer-events-none fixed inset-0 overflow-hidden z-[5] ${className}`}>
      {molecules.map((config, index) => (
        <div
          key={index}
          className="absolute molecule-float"
          style={{
            top: config.top,
            left: config.left,
            right: config.right,
            width: config.size,
            height: config.size,
            animationDelay: config.delay,
            animationDuration: config.duration,
          }}
        >
          <div
            className={config.rotate ? 'molecule-rotate' : ''}
            style={{
              animationDelay: config.delay,
              animationDuration: config.rotate ? '40s' : '0s',
            }}
          >
            <Image
              src="/media/decorative/molecule.png"
              alt=""
              width={config.size}
              height={config.size}
              className="w-full h-full object-contain opacity-60 molecule-purple"
              aria-hidden="true"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
