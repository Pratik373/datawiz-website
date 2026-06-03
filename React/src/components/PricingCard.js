import { STARTER_PRICE_INR, formatINR } from '../pricingConfig'

export default function PricingCard() {
  return (
    <section className="py-lg" id="pricing">
      <div className="max-w-md mx-auto bg-white border-2 border-primary rounded-xl overflow-hidden shadow-sm">
        <div className="bg-primary p-md text-center">
          <span className="text-on-primary uppercase tracking-widest font-bold text-xs">POPULAR CHOICE</span>
        </div>
        <div className="p-lg text-center space-y-md">
          <h3 className="font-display text-headline-md">Starter Pack</h3>
          <div className="flex items-center justify-center gap-sm">
            <span className="text-primary font-display text-[40px] font-extrabold">{formatINR(STARTER_PRICE_INR)}</span>
            <span className="text-on-surface-variant line-through font-body-lg">₹499</span>
          </div>
          <ul className="text-left space-y-sm py-md">
            {[
              'All Section A Mock Tests',
              '1000+ Practice MCQs',
              'Weekly Performance Reports',
            ].map((item) => (
              <li key={item} className="flex items-center gap-base text-body-md">
                <span className="material-symbols-outlined text-primary">check_circle</span>
                {item}
              </li>
            ))}
          </ul>
          <button className="w-full py-4 bg-secondary-container text-on-secondary-container font-label-md rounded-full shadow hover:bg-secondary-fixed transition-all active:scale-95 font-bold uppercase tracking-wide">
            Unlock All Tests
          </button>
        </div>
      </div>
    </section>
  )
}
