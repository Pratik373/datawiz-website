import { Link } from 'react-router-dom'

export default function Footer({ simple }) {
  if (simple) {
    return (
      <footer className="mt-12 w-full max-w-[440px] text-center px-4">
        <p className="font-body-sm text-on-surface-variant/60">
          &copy; 2024 DataWiz. Your trusted study companion for CDAC C-CAT Exam Prep.
        </p>
      </footer>
    )
  }

  return (
    <footer className="bg-surface-container-low py-lg mt-xl border-t border-outline-variant w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md px-gutter max-w-container-max mx-auto">
        <div className="space-y-base">
          <div className="flex items-center gap-xs">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-on-primary font-bold text-sm">D6</span>
            </div>
            <span className="font-headline-sm font-bold text-primary">DataWiz</span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-xs">
            &copy; 2024 DataWiz. CDAC C-CAT Exam Prep Platform. Empowering students with precision-engineered testing tools.
          </p>
        </div>
        <div className="flex flex-wrap gap-md md:justify-end items-start">
          <Link className="text-on-surface-variant hover:text-primary font-body-sm transition-colors" to="#">Privacy Policy</Link>
          <Link className="text-on-surface-variant hover:text-primary font-body-sm transition-colors" to="#">Terms of Service</Link>
          <Link className="text-on-surface-variant hover:text-primary font-body-sm transition-colors" to="#">Contact Us</Link>
          <Link className="text-on-surface-variant hover:text-primary font-body-sm transition-colors" to="#">FAQ</Link>
        </div>
      </div>
    </footer>
  )
}
