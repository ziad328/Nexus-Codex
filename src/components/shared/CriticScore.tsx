import type { FC } from 'react';

interface Props {
  score: number;
}

const CriticScore: FC<Props> = ({ score }) => {
  let colorClass = 'text-green-400 border-green-500/20 bg-green-500/10 shadow-[0_0_10px_rgba(34,197,94,0.1)]';
  if (score < 75) colorClass = 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10 shadow-[0_0_10px_rgba(234,179,8,0.1)]';
  if (score < 50) colorClass = 'text-red-400 border-red-500/20 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.1)]';
  if (!score) return null;

  return (
    <span className={`px-2 py-0.5 text-xs font-bold border rounded-md ${colorClass}`}>
      {score}
    </span>
  );
};

export default CriticScore;
