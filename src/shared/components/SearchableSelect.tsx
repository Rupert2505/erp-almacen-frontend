import { Loader2, Search, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export type SearchableSelectOption = {
  label: string
  value: number
}

type SearchableSelectProps = {
  ariaLabel?: string
  disabled?: boolean
  emptyLabel?: string
  minSearchLength?: number
  onChange: (value: number | null, option?: SearchableSelectOption | null) => void
  onSearch: (texto: string) => Promise<SearchableSelectOption[]>
  placeholder?: string
  value?: number | null
}

export function SearchableSelect({
  ariaLabel,
  disabled = false,
  emptyLabel = 'Sin resultados',
  minSearchLength = 0,
  onChange,
  onSearch,
  placeholder = 'Buscar...',
  value,
}: SearchableSelectProps) {
  const inputId = useId()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const listboxRef = useRef<HTMLDivElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [options, setOptions] = useState<SearchableSelectOption[]>([])
  const [dropdownStyle, setDropdownStyle] = useState({
    left: 0,
    top: 0,
    width: 0,
  })
  const [query, setQuery] = useState('')
  const [selectedOption, setSelectedOption] = useState<SearchableSelectOption | null>(null)

  const updateDropdownPosition = () => {
    const rect = containerRef.current?.getBoundingClientRect()

    if (!rect) {
      return
    }

    setDropdownStyle({
      left: rect.left,
      top: rect.bottom + 4,
      width: rect.width,
    })
  }

  useEffect(() => {
    if (!isOpen || disabled) {
      return
    }

    let isCurrentSearch = true

    const handler = window.setTimeout(async () => {
      if (query.trim().length < minSearchLength) {
        setOptions([])
        return
      }

      setIsLoading(true)
      try {
        const nextOptions = await onSearch(query.trim())
        if (isCurrentSearch) {
          setOptions(nextOptions)
        }
      } finally {
        if (isCurrentSearch) {
          setIsLoading(false)
        }
      }
    }, 280)

    return () => {
      isCurrentSearch = false
      window.clearTimeout(handler)
    }
  }, [disabled, isOpen, minSearchLength, onSearch, query])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      if (
        !containerRef.current?.contains(target) &&
        !listboxRef.current?.contains(target)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    window.addEventListener('resize', updateDropdownPosition)
    window.addEventListener('scroll', updateDropdownPosition, true)

    return () => {
      window.removeEventListener('resize', updateDropdownPosition)
      window.removeEventListener('scroll', updateDropdownPosition, true)
    }
  }, [isOpen])

  const handleSelect = (option: SearchableSelectOption) => {
    setSelectedOption(option)
    setQuery(option.label)
    setIsOpen(false)
    onChange(option.value, option)
  }

  const handleClear = () => {
    setSelectedOption(null)
    setQuery('')
    setOptions([])
    onChange(null, null)
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          size={16}
        />
        <input
          aria-autocomplete="list"
          aria-controls={`${inputId}-listbox`}
          aria-label={ariaLabel ?? placeholder}
          className="h-10 w-full rounded-md border border-slate-300 bg-white px-9 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 disabled:bg-slate-100 disabled:text-slate-500"
          disabled={disabled}
          onChange={(event) => {
            setQuery(event.target.value)
            setSelectedOption(null)
            setOptions([])
            updateDropdownPosition()
            setIsOpen(true)
          }}
          onFocus={() => {
            updateDropdownPosition()
            setIsOpen(true)
          }}
          placeholder={placeholder}
          role="combobox"
          type="text"
          value={selectedOption?.label ?? query}
        />
        {isLoading ? (
          <Loader2
            className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400"
            size={16}
          />
        ) : value || selectedOption || query ? (
          <button
            aria-label="Limpiar seleccion"
            className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            disabled={disabled}
            onClick={handleClear}
            type="button"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>

      {isOpen && !disabled
        ? createPortal(
        <div
          className="fixed z-[80] max-h-64 overflow-y-auto rounded-md border border-slate-200 bg-white py-1 text-sm shadow-xl"
          id={`${inputId}-listbox`}
          ref={listboxRef}
          role="listbox"
          style={{
            left: dropdownStyle.left,
            top: dropdownStyle.top,
            width: dropdownStyle.width,
          }}
        >
          {isLoading ? (
            <div className="px-3 py-2 text-slate-500">Buscando...</div>
          ) : null}
          {!isLoading && options.length === 0 ? (
            <div className="px-3 py-2 text-slate-500">{emptyLabel}</div>
          ) : null}
          {!isLoading
            ? options.map((option) => (
                <button
                  className="block w-full px-3 py-2 text-left text-slate-700 hover:bg-cyan-50 hover:text-slate-950"
                  key={option.value}
                  onClick={() => handleSelect(option)}
                  role="option"
                  type="button"
                >
                  {option.label}
                </button>
              ))
            : null}
        </div>,
            document.body,
          )
        : null}
    </div>
  )
}
