import { STARTER_PRICE_INR, formatINR } from '../pricingConfig'

export default function PricingCard() {
  return (
    <section className="py-lg" id="pricing">
      <div className="max-w-md mx-auto bg-white border-2 border-primary rounded-xl overflow-hidden shadow-sm">
        <div className="bg-primary p-md text-center">
          <span className="text-on-primary uppercase tracking-widest font-bold text-xs">POPULAR CHOICE</span>
        </div>
        <div className="p-lg text-center space-y-md relative">
          {/* Corner top right discount badge */}
          <div className="absolute top-3 right-3 z-10 animate-badge-popup">
            <div className="relative w-[100px] h-[68px] bg-[#E91E63] rounded-xl overflow-hidden shadow-md flex items-center justify-center p-1 select-none">
              {/* Floating Shapes */}
              <div className="absolute top-1 left-2 w-3.5 h-3.5 border-[2px] border-[#FF4081]/60 rounded-full animate-float-slow" />
              <div className="absolute bottom-1 right-2 w-4 h-4 border-[2px] border-[#FF4081]/60 rounded-full animate-float-fast" />
              <div className="absolute -top-0.5 right-6 w-6 h-0.5 bg-[#FF4081]/50 rounded-full transform rotate-[35deg] animate-float-reverse" />
              <div className="absolute bottom-1.5 left-1 w-5 h-0.5 bg-[#FF4081]/50 rounded-full transform -rotate-[40deg] animate-float-slow" />
              
              {/* Floating Dots */}
              <div className="absolute top-5 right-2 w-0.5 h-0.5 bg-white/40 rounded-full animate-float-slow" />
              <div className="absolute bottom-3 left-3 w-0.5 h-0.5 bg-white/50 rounded-full animate-float-fast" />

              {/* Center White Card (Tilted with Rocking Animation) */}
              <div className="relative bg-white px-1.5 py-0.5 rounded-lg shadow-sm border border-black/5 transform -rotate-[3deg] animate-card-rocking w-[78px] text-center">
                <div className="flex items-baseline justify-center">
                  <span className="text-[13px] font-black text-[#E91E63] leading-none tracking-tight">80%</span>
                  <span className="text-[7px] font-extrabold text-[#E91E63] uppercase tracking-wider pl-0.5">OFF</span>
                </div>
                <div className="text-[7.5px] font-black text-black leading-none uppercase tracking-wide mt-0.5">
                  DISCOUNT
                </div>
              </div>
            </div>
          </div>

          <h3 className="font-display text-headline-md">Starter Pack</h3>
          <div className="flex items-center justify-center gap-sm !mt-1">
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
