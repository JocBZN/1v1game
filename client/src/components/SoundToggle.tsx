import { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { isMuted, onMutedChange, setMuted } from '../lib/sound';

/** Small speaker button: sounds on/off, remembered in this browser. */
export function SoundToggle({ className = '' }: { className?: string }) {
  const [muted, setM] = useState(isMuted());
  useEffect(() => onMutedChange(setM), []);
  return (
    <button
      type="button"
      onClick={() => setMuted(!muted)}
      className={`btn btn-ghost h-9 w-9 p-0 text-muted ${className}`}
      aria-label={muted ? 'Turn sounds on' : 'Turn sounds off'}
      aria-pressed={!muted}
      title={muted ? 'Sounds off' : 'Sounds on'}
    >
      {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
    </button>
  );
}
