import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AuthModal from '../../../src/components/auth/AuthModal';
import { deferred } from '../../fakes/network';
import { supabase } from '../../fakes/supabase';

const setup = () => {
  const onClose = vi.fn();
  const view = render(<AuthModal isOpen onClose={onClose} />);
  return { onClose, ...view };
};

const emailInput = () => screen.getByPlaceholderText('Enter your email address');
const submitButton = () => screen.getByRole('button', { name: /send magic link/i });
const type = (value: string) => fireEvent.change(emailInput(), { target: { name: 'email', value } });
const leaveField = () => fireEvent.blur(emailInput(), { target: { name: 'email' } });

const submit = async (email: string) => {
  type(email);
  await waitFor(() => expect(submitButton()).toBeEnabled());
  fireEvent.click(submitButton());
};

describe('AuthModal', () => {
  it('shows nothing when closed', () => {
    render(<AuthModal isOpen={false} onClose={vi.fn()} />);

    expect(screen.queryByText('Join the Codex')).not.toBeInTheDocument();
  });

  it('shows the sign-in form when open', () => {
    setup();

    expect(screen.getByText('Join the Codex')).toBeInTheDocument();
    expect(emailInput()).toBeInTheDocument();
  });

  describe('validation', () => {
    it('keeps the button disabled until an email is typed', () => {
      setup();

      expect(submitButton()).toBeDisabled();
    });

    it('requires an email once the field has been visited', async () => {
      setup();

      leaveField();

      expect(await screen.findByText('Email is required.')).toBeInTheDocument();
    });

    it.each(['player', 'player@', 'player@domain', '@domain.com', 'pla yer@domain.com', 'player@domain.c'])(
      'rejects "%s"',
      async (email) => {
        setup();

        type(email);
        leaveField();

        expect(await screen.findByText(/please enter a valid, complete email/i)).toBeInTheDocument();
        expect(submitButton()).toBeDisabled();
      },
    );

    it.each(['gmai.com', 'gmal.com', 'gmail.co', 'yahoo.co', 'hotmai.com', 'hotmail.co', 'GMAI.COM'])(
      'catches the typo @%s',
      async (domain) => {
        setup();

        type(`player@${domain}`);
        leaveField();

        expect(await screen.findByText(/check your email for typos/i)).toBeInTheDocument();
        expect(submitButton()).toBeDisabled();
      },
    );

    it.each(['player@gmail.com', 'first.last+tag@sub.domain.org', 'player@yahoo.com'])('accepts %s', async (email) => {
      setup();

      type(email);
      leaveField();

      await waitFor(() => expect(submitButton()).toBeEnabled());
      expect(screen.queryByText(/valid, complete|typos/i)).not.toBeInTheDocument();
    });

    it.fails('BUG-20: does not suggest gmail for a hotmail typo', async () => {
      setup();

      type('player@hotmai.com');
      leaveField();
      await screen.findByText(/check your email for typos/i);

      expect(screen.queryByText(/gmail/i)).not.toBeInTheDocument();
    });
  });

  describe('sending the link', () => {
    it('asks Supabase for a magic link back to this site', async () => {
      setup();

      await submit('player@gmail.com');

      await waitFor(() => {
        expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
          email: 'player@gmail.com',
          options: { emailRedirectTo: window.location.origin },
        });
      });
    });

    it('does not send an invalid email', async () => {
      setup();

      type('player@gmai.com');
      fireEvent.submit(emailInput().closest('form')!);
      await screen.findByText(/check your email for typos/i);

      expect(supabase.auth.signInWithOtp).not.toHaveBeenCalled();
    });

    it('shows a spinner and blocks repeats while sending', async () => {
      const response = deferred<{ error: null }>();
      supabase.auth.signInWithOtp.mockReturnValue(response.promise);
      const { container } = setup();

      await submit('player@gmail.com');

      await waitFor(() => expect(container.ownerDocument.querySelector('.animate-spin')).toBeInTheDocument());
      expect(container.ownerDocument.querySelector('button[type="submit"]')).toBeDisabled();

      response.resolve({ error: null });
      await screen.findByText('Check your email');
    });

    it('confirms success, naming the address and the spam folder', async () => {
      setup();

      await submit('player@gmail.com');

      expect(await screen.findByText('Check your email')).toBeInTheDocument();
      expect(screen.getByText('player@gmail.com')).toBeInTheDocument();
      expect(screen.getByText('Spam')).toBeInTheDocument();
    });

    it('shows the error from Supabase and lets the user retry', async () => {
      supabase.auth.signInWithOtp.mockResolvedValue({ error: new Error('Too many requests') });
      setup();

      await submit('player@gmail.com');

      expect(await screen.findByText('Too many requests')).toBeInTheDocument();
      expect(screen.queryByText('Check your email')).not.toBeInTheDocument();
      expect(submitButton()).toBeEnabled();
    });

    it('shows a default message when the error has no text', async () => {
      supabase.auth.signInWithOtp.mockRejectedValue(new Error(''));
      setup();

      await submit('player@gmail.com');

      expect(await screen.findByText('Failed to send magic link. Please try again.')).toBeInTheDocument();
    });

    it('clears the error on the next attempt', async () => {
      supabase.auth.signInWithOtp.mockResolvedValueOnce({ error: new Error('Too many requests') });
      setup();
      await submit('player@gmail.com');
      await screen.findByText('Too many requests');

      fireEvent.click(submitButton());

      await screen.findByText('Check your email');
      expect(screen.queryByText('Too many requests')).not.toBeInTheDocument();
    });
  });

  describe('closing', () => {
    const closeIcon = () => document.querySelector('.lucide-x')!.closest('button')!;

    it('closes from the X and from the backdrop', () => {
      const { onClose } = setup();

      fireEvent.click(closeIcon());
      fireEvent.click(document.querySelector('.backdrop-blur-sm')!);

      expect(onClose).toHaveBeenCalledTimes(2);
    });

    it('closes from the button after success', async () => {
      const { onClose } = setup();
      await submit('player@gmail.com');
      await screen.findByText('Check your email');

      fireEvent.click(screen.getByRole('button', { name: 'Close' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('forgets the email and result when reopened', async () => {
      const { rerender } = setup();
      await submit('player@gmail.com');
      await screen.findByText('Check your email');
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));

      rerender(<AuthModal isOpen={false} onClose={vi.fn()} />);
      rerender(<AuthModal isOpen onClose={vi.fn()} />);

      expect(await screen.findByPlaceholderText('Enter your email address')).toHaveValue('');
      expect(screen.queryByText('Check your email')).not.toBeInTheDocument();
    });

    it('forgets an error when reopened', async () => {
      supabase.auth.signInWithOtp.mockResolvedValue({ error: new Error('Too many requests') });
      const { rerender } = setup();
      await submit('player@gmail.com');
      await screen.findByText('Too many requests');
      fireEvent.click(closeIcon());

      rerender(<AuthModal isOpen={false} onClose={vi.fn()} />);
      rerender(<AuthModal isOpen onClose={vi.fn()} />);

      await screen.findByPlaceholderText('Enter your email address');
      expect(screen.queryByText('Too many requests')).not.toBeInTheDocument();
    });

    it.fails('BUG-16: names the close button for screen readers', () => {
      setup();

      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });
  });
});
