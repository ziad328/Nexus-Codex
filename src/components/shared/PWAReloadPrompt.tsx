import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function PWAReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ', r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setNeedRefresh(false);
  };

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 z-100 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-4 max-w-sm flex flex-col gap-3"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-white font-bold mb-1">Update available!</h3>
              <p className="text-zinc-400 text-sm">
                A new version of Nexus Codex is ready. Refresh to apply the update.
              </p>
            </div>
            <button
              onClick={close}
              className="text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={() => updateServiceWorker(true)}
            className="w-full flex items-center justify-center gap-2 py-2 bg-accent hover:bg-red-600 text-white rounded-xl font-bold transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reload & Update
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PWAReloadPrompt;
