import type { FC } from 'react';
import type { Platform } from '../../types';
import {
  FaWindows,
  FaPlaystation,
  FaXbox,
  FaApple,
  FaLinux,
  FaAndroid,
} from 'react-icons/fa';
import { MdPhoneIphone } from 'react-icons/md';
import { BsGlobe, BsNintendoSwitch } from 'react-icons/bs';
import type { IconType } from 'react-icons';

interface Props {
  platforms: Platform[];
}

const PlatformIconList: FC<Props> = ({ platforms }) => {
  const iconMap: { [key: string]: IconType } = {
    pc: FaWindows,
    playstation: FaPlaystation,
    xbox: FaXbox,
    nintendo: BsNintendoSwitch,
    mac: FaApple,
    linux: FaLinux,
    android: FaAndroid,
    ios: MdPhoneIphone,
    web: BsGlobe,
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-gray-400">
      {platforms.map((p) => {
        const Icon = iconMap[p.slug];
        if (!Icon) return null;
        return <Icon key={p.id} className="w-4 h-4 transition-colors hover:text-white" title={p.name} />;
      })}
    </div>
  );
};

export default PlatformIconList;
