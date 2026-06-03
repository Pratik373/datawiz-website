export default function SocialLinks() {
  const links = [
    {
      href: 'https://www.youtube.com/@Datawiz6',
      icon: 'play_circle',
      bg: 'bg-red-100',
      color: 'text-red-600',
      title: 'YouTube',
      desc: 'Visual tutorials',
    },
    {
      href: 'https://www.linkedin.com/in/datawiz6/',
      icon: 'share',
      bg: 'bg-blue-100',
      color: 'text-blue-700',
      title: 'LinkedIn',
      desc: 'Study community',
    },
    {
      href: 'mailto:allaboutstatistics19@gmail.com',
      icon: 'mail',
      bg: 'bg-surface-container',
      color: 'text-on-surface',
      title: 'Direct Email',
      desc: 'Ask questions',
    },
  ]

  return (
    <section id="social" className="grid grid-cols-1 sm:grid-cols-3 gap-md">
      {links.map((link) => (
        <a
          key={link.title}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="p-md bg-white border border-outline-variant rounded-xl flex items-center gap-md hover-card transition-all group"
        >
          <div className={`w-12 h-12 ${link.bg} rounded-full flex items-center justify-center`}>
            <span className={`material-symbols-outlined ${link.color}`}>{link.icon}</span>
          </div>
          <div>
            <h5 className="font-label-md group-hover:text-primary">{link.title}</h5>
            <p className="text-xs text-on-surface-variant">{link.desc}</p>
          </div>
        </a>
      ))}
    </section>
  )
}
