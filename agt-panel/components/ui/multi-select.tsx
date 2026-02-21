"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/agt-panel/lib/utils"
import { Button } from "@/agt-panel/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/agt-panel/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/agt-panel/components/ui/popover"
import { Badge } from "@/agt-panel/components/ui/badge"

export interface Option {
    label: string
    value: string
}

interface MultiSelectProps {
    options: Option[]
    selected: string[]
    onChange: (selected: string[]) => void
    placeholder?: string
    className?: string
}

export function MultiSelect({
    options,
    selected,
    onChange,
    placeholder = "Select options...",
    className,
}: MultiSelectProps) {
    const [open, setOpen] = React.useState(false)

    const handleUnselect = (value: string) => {
        onChange(selected.filter((item) => item !== value))
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between min-h-10 h-auto py-2", className)}
                >
                    <div className="flex flex-wrap gap-1">
                        {selected.length > 0 ? (
                            selected.map((value) => {
                                const option = options.find((opt) => opt.value === value)
                                return (
                                    <Badge
                                        variant="secondary"
                                        key={value}
                                        className="mr-1 mb-1"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleUnselect(value)
                                        }}
                                    >
                                        {option?.label || value}
                                        <X className="ml-1 h-3 w-3 cursor-pointer" />
                                    </Badge>
                                )
                            })
                        ) : (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <Command className="w-full">
                    <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} />
                    <CommandEmpty>No option found.</CommandEmpty>
                    <CommandList className="max-h-64">
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    onSelect={() => {
                                        onChange(
                                            selected.includes(option.value)
                                                ? selected.filter((item) => item !== option.value)
                                                : [...selected, option.value]
                                        )
                                    }}
                                >
                                    <div
                                        className={cn(
                                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                            selected.includes(option.value)
                                                ? "bg-primary text-primary-foreground"
                                                : "opacity-50 [&_svg]:invisible"
                                        )}
                                    >
                                        <Check className={cn("h-3 w-3")} />
                                    </div>
                                    <span>{option.label}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

