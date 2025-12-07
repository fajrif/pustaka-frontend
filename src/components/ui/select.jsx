import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, Search } from "lucide-react"

const Select = ({ children, value, onValueChange, ...props }) => {
  const [open, setOpen] = React.useState(false)
  const selectRef = React.useRef(null)
  const [selectedLabel, setSelectedLabel] = React.useState("")
  const [searchTerm, setSearchTerm] = React.useState("")

  // Reset search term when dropdown closes
  React.useEffect(() => {
    if (!open) {
      setSearchTerm("")
    }
  }, [open])

  // Extract label from selected value
  React.useEffect(() => {
    if (value && children) {
      const content = React.Children.toArray(children).find(
        child => child.type === SelectContent
      )

      if (content) {
        const items = React.Children.toArray(content.props.children)
        const selectedItem = items.find(item => item.props.value === value)

        if (selectedItem) {
          setSelectedLabel(selectedItem.props.children)
        }
      }
    } else {
      setSelectedLabel("")
    }
  }, [value, children])

  return (
    <div
      className="relative"
      ref__={selectRef}
    >
      {React.Children.map(children, child => {
        if (child.type === SelectTrigger) {
          return React.cloneElement(child, { open, setOpen, value, selectedLabel })
        }
        if (child.type === SelectContent) {
          return React.cloneElement(child, { open, setOpen, onValueChange, selectRef, searchTerm, setSearchTerm })
        }
        return child
      })}
    </div>
  )
}
Select.displayName = "Select"

const SelectTrigger = React.forwardRef(({ className, children, open, setOpen, value, selectedLabel, ...props }, ref) => {
  // Find SelectValue child and pass selectedLabel to it
  const updatedChildren = React.Children.map(children, child => {
    if (child?.type === SelectValue) {
      return React.cloneElement(child, { selectedLabel, value })
    }
    return child
  })

  return (
    <button
      type="button"
      ref__={ref}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {updatedChildren}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  )
})
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = ({ placeholder, selectedLabel, value }) => {
  // Show selected label if exists, otherwise show placeholder
  return (
    <span className={!selectedLabel ? "text-muted-foreground" : ""}>
      {selectedLabel || placeholder}
    </span>
  )
}
SelectValue.displayName = "SelectValue"

const SelectContent = ({ className, children, open, setOpen, onValueChange, selectRef, searchTerm, setSearchTerm, ...props }) => {
  const searchInputRef = React.useRef(null)

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, setOpen, selectRef])

  if (!open) return null

  // Helper function to extract text from nested React elements
  const extractText = (element) => {
    if (typeof element === 'string') return element
    if (typeof element === 'number') return element.toString()
    if (!element) return ''

    if (Array.isArray(element)) {
      return element.map(extractText).join(' ')
    }

    if (React.isValidElement(element)) {
      return extractText(element.props?.children)
    }

    return ''
  }

  // Filter children based on search term
  const filteredChildren = React.Children.toArray(children).filter(child => {
    if (!searchTerm) return true

    const childText = extractText(child.props?.children).toLowerCase()
    return childText.includes(searchTerm.toLowerCase())
  })

  return (
    <div
      className={cn(
        "absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md",
        className
      )}
      {...props}
    >
      {/* Search Input */}
      <div className="flex items-center border-b px-3 py-2">
        <Search className="h-4 w-4 opacity-50 mr-2" />
        <input
          ref__={searchInputRef}
          type="text"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Items List */}
      <div className="max-h-60 overflow-auto p-1">
        {filteredChildren.length > 0 ? (
          React.Children.map(filteredChildren, child =>
            React.cloneElement(child, { onValueChange, setOpen })
          )
        ) : (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No results found.
          </div>
        )}
      </div>
    </div>
  )
}
SelectContent.displayName = "SelectContent"

const SelectItem = ({ className, children, value, onValueChange, setOpen, ...props }) => (
  <div
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
      className
    )}
    onClick={() => {
      onValueChange(value)
      setOpen(false)
    }}
    {...props}
  >
    {children}
  </div>
)
SelectItem.displayName = "SelectItem"

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
