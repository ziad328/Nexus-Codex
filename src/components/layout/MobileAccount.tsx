import type { FC } from 'react';
import { LogIn, LogOut, User } from 'lucide-react';
import useAppDispatch from '../../hooks/useAppDispatch';
import useAppSelector from '../../hooks/useAppSelector';
import { setAuthModalOpen } from '../../store/uiSlice';
import { supabase } from '../../utils/supabase';

interface Props {
  /** Called after either button, so the menu can close. */
  onAction: () => void;
}

/** Sign-in and sign-out for the phone menu, where the navbar has no room for them. */
const MobileAccount: FC<Props> = ({ onAction }) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  if (!user) {
    return (
      <section className="md:hidden mb-6 rounded-2xl bg-background-card border border-white/5 p-4">
        <p className="text-sm font-semibold text-white">Sync your library</p>
        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">Sign in to keep your games on every device.</p>
        <button
          onClick={() => { dispatch(setAuthModalOpen(true)); onAction(); }}
          className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-bold transition-colors cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          Sign In
        </button>
      </section>
    );
  }

  return (
    <section className="md:hidden mb-6 rounded-2xl bg-background-card border border-white/5 p-3 flex items-center gap-3">
      <div className="w-9 h-9 shrink-0 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center">
        <User className="w-4 h-4 text-zinc-400" />
      </div>
      <div className="min-w-0 grow">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Signed in as</p>
        <p className="text-sm font-medium text-white truncate" title={user.email}>{user.email}</p>
      </div>
      <button
        onClick={() => { supabase.auth.signOut(); onAction(); }}
        aria-label="Sign Out"
        title="Sign Out"
        className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </section>
  );
};

export default MobileAccount;
