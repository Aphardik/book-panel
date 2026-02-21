"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

interface Book {
    id: string | number
    title: string
    author: string
    price?: number
    frontImage?: string
    imageUrl?: string
    [key: string]: any
}

interface CartContextType {
    cart: Book[]
    addToCart: (book: Book) => void
    removeFromCart: (bookId: string | number) => void
    clearCart: () => void
    isInCart: (bookId: string | number) => boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cart, setCart] = useState<Book[]>([])

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('agt_cart')
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart))
            } catch (e) {
                console.error("Failed to parse cart from localStorage", e)
            }
        }
    }, [])

    // Save cart to localStorage on changes
    useEffect(() => {
        localStorage.setItem('agt_cart', JSON.stringify(cart))
    }, [cart])

    const addToCart = (book: Book) => {
        setCart((prev) => {
            if (prev.find((item) => item.id === book.id)) return prev
            return [...prev, book]
        })
    }

    const removeFromCart = (bookId: string | number) => {
        setCart((prev) => prev.filter((item) => item.id !== bookId))
    }

    const clearCart = () => {
        setCart([])
    }

    const isInCart = (bookId: string | number) => {
        return cart.some((item) => item.id === bookId)
    }

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, isInCart }}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider')
    }
    return context
}
