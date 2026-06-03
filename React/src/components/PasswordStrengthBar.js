const passwordRules = [
  { id: 'length', label: '8+ characters', test: (p) => p.length >= 8 },
  { id: 'upper', label: 'Uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'Lowercase letter', test: (p) => /[a-z]/.test(p) },
  { id: 'number', label: 'Number', test: (p) => /[0-9]/.test(p) },
  { id: 'symbol', label: 'Special symbol', test: (p) => /[^A-Za-z0-9]/.test(p) },
]

function getStrength(val) {
  const passed = passwordRules.filter((r) => r.test(val)).length
  if (passed <= 1) return { level: 0, color: '#ba1a1a', cls: 'bg-error' }
  if (passed === 2) return { level: 1, color: '#fbbc00', cls: 'bg-secondary-fixed-dim' }
  if (passed === 3) return { level: 2, color: '#008080', cls: 'bg-primary-container' }
  return { level: 3, color: '#004f4f', cls: 'bg-[#004f4f]' }
}

export default function PasswordStrengthBar({ password }) {
  const strength = getStrength(password)

  return (
    <div className="space-y-2">
      <div className="flex gap-1 mt-sm">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-colors duration-300"
            style={{ backgroundColor: i < strength.level ? strength.color : '#dfe3e2' }}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-y-1">
        {passwordRules.map((rule) => {
          const ok = rule.test(password)
          return (
            <div
              key={rule.id}
              className={`flex items-center gap-1 text-sm transition-colors duration-300 ${
                ok ? 'text-primary' : 'text-outline'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {ok ? 'check_circle' : 'circle'}
              </span>
              <span>{rule.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { passwordRules }
