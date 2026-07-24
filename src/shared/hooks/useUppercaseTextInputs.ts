import { useEffect } from 'react'

const UPPERCASE_INPUT_TYPES = new Set(['', 'text', 'url'])

function shouldUppercaseField(target: EventTarget | null): target is HTMLInputElement | HTMLTextAreaElement {
  if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLTextAreaElement)) {
    return false
  }

  if (target.readOnly || target.disabled || target.dataset.preserveCase === 'true') {
    return false
  }

  if (target instanceof HTMLInputElement && !UPPERCASE_INPUT_TYPES.has(target.type)) {
    return false
  }

  return true
}

function uppercaseFieldValue(field: HTMLInputElement | HTMLTextAreaElement) {
  const currentValue = field.value
  const upperValue = currentValue.toLocaleUpperCase('es-PE')

  if (currentValue === upperValue) {
    return
  }

  const selectionStart = field.selectionStart
  const selectionEnd = field.selectionEnd

  field.value = upperValue

  if (
    selectionStart !== null &&
    selectionEnd !== null &&
    typeof field.setSelectionRange === 'function'
  ) {
    field.setSelectionRange(selectionStart, selectionEnd)
  }
}

export function useUppercaseTextInputs() {
  useEffect(() => {
    const handleInput = (event: Event) => {
      if (!shouldUppercaseField(event.target)) {
        return
      }

      if (event instanceof InputEvent && event.isComposing) {
        return
      }

      uppercaseFieldValue(event.target)
    }

    document.addEventListener('input', handleInput, true)

    return () => {
      document.removeEventListener('input', handleInput, true)
    }
  }, [])
}
