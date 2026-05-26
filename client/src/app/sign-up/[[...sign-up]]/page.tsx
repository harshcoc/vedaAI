import { SignUp } from '@clerk/nextjs';
import '../../auth.css';

export default function SignUpPage() {
  return (
    <div className="authPage">
      <div className="authContainer">
        <div className="authBranding">
          <div className="authLogo">
            <div className="authLogoIcon">V</div>
            VedaAI
          </div>
          <p className="authTagline">AI-Powered Assessment Creator</p>
        </div>
        <SignUp
          appearance={{
            elements: {
              rootBox: {
                width: '100%',
                maxWidth: '420px',
              },
              card: {
                boxShadow: 'var(--shadow-xl)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--color-border-light)',
              },
              headerTitle: {
                fontFamily: 'var(--font-family)',
                fontWeight: 'var(--font-weight-semibold)',
              },
              headerSubtitle: {
                fontFamily: 'var(--font-family)',
              },
              formButtonPrimary: {
                backgroundColor: 'var(--color-primary)',
                fontFamily: 'var(--font-family)',
                fontWeight: 'var(--font-weight-medium)',
                borderRadius: 'var(--radius-base)',
                textTransform: 'none' as const,
                fontSize: 'var(--font-size-base)',
                letterSpacing: '0',
              },
            },
          }}
        />
      </div>
    </div>
  );
}
