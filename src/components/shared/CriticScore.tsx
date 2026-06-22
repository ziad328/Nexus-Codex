import type { FC } from 'react';

interface Props {
  score: number;
}

const CriticScore: FC<Props> = ({ score }) => {
  let colorClass = 'text-green-500 border-green-500/20 bg-green-500/10';
  if (score < 75) colorClass = 'text-yellow-500 border-yellow-500/20 bg-yellow-500/10';
  if (score < 50) colorClass = 'text-red-500 border-red-500/20 bg-red-500/10';
  if (!score) return null;

  return (
    <span className={`px-2 py-0.5 text-xs font-bold border ${colorClass}`}>
      {score}
    </span>
  );
};

export default CriticScore;
