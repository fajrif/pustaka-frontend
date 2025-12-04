import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

const Select = ({ children, value, onValueChange, ...props }) => {
  const [open, setOpen] = React.useState(false)
  const selectRef = React.useRef(null)
  const [selectedLabel, setSelectedLabel] = React.useState("")

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
    <div className="relative" ref__={selectRef}>
      {React.Children.map(children, child => {
        if (child.type === SelectTrigger) {
          return React.cloneElement(child, { open, setOpen, value, selectedLabel })
        }
        if (child.type === SelectContent) {
          return React.cloneElement(child, { open, setOpen, onValueChange, selectRef })
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

const SelectContent = ({ className, children, open, setOpen, onValueChange, selectRef, ...props }) => {
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

  return (
    <div
      className={cn(
        "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md",
        className
      )}
      {...props}
    >
      {React.Children.map(children, child =>
        React.cloneElement(child, { onValueChange, setOpen })
      )}
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
