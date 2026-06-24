import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import type { FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, ArrowRight, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { supabase } from '../../utils/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: FC<Props> = ({ isOpen, onClose }) => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .matches(
          /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
          'Please enter a valid, complete email address (e.g., name@domain.com).'
        )
        .required('Email is required.')
        .test('no-common-typos', 'Did you mean @gmail.com? Please check your email for typos.', (value) => {
          if (!value) return true;
          const commonTypos: Record<string, string> = {
            'gmai.com': 'gmail.com',
            'gmal.com': 'gmail.com',
            'gmail.co': 'gmail.com',
            'yahoo.co': 'yahoo.com',
            'hotmai.com': 'hotmail.com',
            'hotmail.co': 'hotmail.com'
          };
          const domain = value.split('@')[1]?.toLowerCase();
          return !(domain && commonTypos[domain]);
        }),
    }),
    onSubmit: async (values) => {
      setIsLoading(true);
      setSubmitError(null);

      try {
        const { error: signInError } = await supabase.auth.signInWithOtp({
          email: values.email,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });

        if (signInError) throw signInError;
        
        setIsSuccess(true);
      } catch (err: any) {
        setSubmitError(err.message || 'Failed to send magic link. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
  });

  const handleClose = () => {
    formik.resetForm();
    setIsSuccess(false);
    setSubmitError(null);
    setIsLoading(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-xl font-bold text-white font-medieval tracking-wide">
                Join the Codex
              </h2>
              <button
                onClick={handleClose}
                className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {isSuccess ? (
                <div className="text-center pb-2">
                  <div className="w-12 h-12 bg-accent/20 text-accent rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">Check your email</h3>
                  <p className="text-zinc-400 mb-4 text-sm">
                    We sent a magic link to <span className="text-white font-semibold">{formik.values.email}</span>. Click it to sign in.
                  </p>
                  
                  <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-start gap-2.5 text-left">
                    <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-orange-400 font-bold text-xs uppercase tracking-wide">Important Note</h4>
                      <p className="text-orange-400/80 text-xs mt-0.5">
                        Check your <strong>Spam</strong> or <strong>Junk</strong> folder if you don't see the email within a minute!
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="mt-6 w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-zinc-400 mb-6 leading-relaxed">
                    Please sign in to add games to your library and sync them across all your devices. It's completely free and requires no passwords!
                  </p>
                  
                  <form onSubmit={formik.handleSubmit} className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formik.values.email}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder="Enter your email address"
                        className={`w-full pl-12 pr-4 py-3 bg-black/40 border rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 transition-all ${
                          formik.touched.email && formik.errors.email
                            ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/50'
                            : 'border-white/10 focus:border-accent focus:ring-accent'
                        }`}
                      />
                    </div>

                    {formik.touched.email && formik.errors.email && (
                      <p className="text-red-400 text-sm mt-2">{formik.errors.email}</p>
                    )}

                    {submitError && (
                      <p className="text-red-400 text-sm mt-2">{submitError}</p>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading || !formik.values.email || !!formik.errors.email}
                      className="relative w-full py-3 bg-linear-to-r from-accent to-red-700 text-white font-bold rounded-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 group overflow-hidden hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] cursor-pointer"
                    >
                      <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Send Magic Link
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
