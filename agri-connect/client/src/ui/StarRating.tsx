import React from 'react'

type Props = {
  value: number
  onChange?: (val: number) => void
  size?: 'sm'|'md'
  readOnly?: boolean
}

const StarRating: React.FC<Props> = ({ value = 0, onChange, size = 'md', readOnly }) => {
  const stars = [1,2,3,4,5]
  const cls = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
  return (
    <div className="flex items-center gap-1">
      {stars.map((s) => {
        const active = value >= s
        const color = active ? 'text-amber-500' : 'text-gray-300'
        const common = `${cls} inline-block`
        return (
          <button
            key={s}
            type="button"
            aria-label={`${s} star`}
            className={`focus:outline-none ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
            onClick={() => { if (!readOnly && onChange) onChange(s) }}
            onMouseEnter={() => {}}
          >
            <svg className={`${common} ${color}`} viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.036a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.802-2.036a1 1 0 00-1.176 0l-2.802 2.036c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
          </button>
        )
      })}
    </div>
  )
}

export default StarRating
