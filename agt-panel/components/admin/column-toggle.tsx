"use client"

import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/agt-panel/components/ui/dropdown-menu"
import { Button } from "@/agt-panel/components/ui/button"
import { Settings2 } from "lucide-react"

export interface Column {
    id: string
    label: string
    isVisible: boolean
}

interface ColumnToggleProps {
    columns: Column[]
    onToggle: (id: string, isVisible: boolean) => void
}

export function ColumnToggle({ columns, onToggle }: ColumnToggleProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-10 ml-2">
                    <Settings2 className="mr-2 h-4 w-4" />
                    Column Visibility
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[150px]">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {columns.map((column) => (
                    <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.isVisible}
                        onCheckedChange={(checked) => onToggle(column.id, checked)}
                    >
                        {column.label}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

