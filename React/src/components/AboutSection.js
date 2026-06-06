export default function AboutSection() {
  const items = [
    {
      icon: 'analytics',
      iconBg: 'bg-primary-fixed',
      iconColor: 'text-primary',
      title: 'Data Science',
      desc: 'In-depth modules on data cleaning, visualization, and the complete lifecycle of data analysis.',
    },
    {
      icon: 'functions',
      iconBg: 'bg-secondary-fixed',
      iconColor: 'text-secondary',
      title: 'Statistics',
      desc: 'Master probability, distributions, and inferential statistics required for the C-CAT exam.',
    },
    {
      icon: 'code',
      iconBg: 'bg-tertiary-fixed',
      iconColor: 'text-tertiary',
      title: 'Python/R',
      desc: 'Hands-on coding patterns and syntax focus for the leading programming languages in data wizry.',
    },
  ]

  return (
    <section className="space-y-md" id="about">
      <div className="text-center max-w-xl mx-auto space-y-base">
        <h2 className="font-display text-headline-md text-on-surface">Comprehensive Focus</h2>
        <p className="text-on-surface-variant font-body-md">
          Targeted preparation for Section A & B, covering the most critical technical domains.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        {items.map((item) => (
          <div
            key={item.title}
            className="p-md bg-white border border-outline-variant rounded-xl hover-card transition-all space-y-sm"
          >
            <div className={`w-12 h-12 ${item.iconBg} rounded-lg flex items-center justify-center`}>
              <span className={`material-symbols-outlined ${item.iconColor} text-3xl`}>{item.icon}</span>
            </div>
            <h3 className="font-display text-headline-sm">{item.title}</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
