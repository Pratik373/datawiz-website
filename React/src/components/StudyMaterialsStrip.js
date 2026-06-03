import { Link } from 'react-router-dom'

const tags = ['Mathematics', 'English', 'Data Structures', 'Operating Systems']

export default function StudyMaterialsStrip() {
  return (
    <div className="bg-surface-container-low py-sm border-y border-outline-variant">
      <div className="max-w-container-max mx-auto px-gutter flex flex-wrap items-center gap-md">
        <span className="font-label-md text-on-surface flex items-center gap-xs">
          <span className="material-symbols-outlined text-primary">auto_stories</span>
          15 Books available
        </span>
        <div className="flex flex-wrap gap-xs">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-white border border-outline-variant rounded-full text-xs font-medium text-on-surface-variant"
            >
              {tag}
            </span>
          ))}
        </div>
        <Link
          className="ml-auto text-primary font-bold text-label-md flex items-center gap-xs hover:underline"
          to="/study-material"
        >
          Explore All <span className="material-symbols-outlined">arrow_forward</span>
        </Link>
      </div>
    </div>
  )
}
