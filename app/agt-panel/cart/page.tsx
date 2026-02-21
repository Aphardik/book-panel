"use client"

import { useState } from "react"
import Sidebar from "@/agt-panel/components/sidebar"
import { useCart } from "@/agt-panel/lib/cart-context"
import { Button } from "@/agt-panel/components/ui/button"
import { Input } from "@/agt-panel/components/ui/input"
import { Label } from "@/agt-panel/components/ui/label"
import { Textarea } from "@/agt-panel/components/ui/textarea"
import { Card } from "@/agt-panel/components/ui/card"
import { ordersApi } from "@/agt-panel/lib/api-client"
import { useToast } from "@/agt-panel/hooks/use-toast"
import { ShoppingCart, Trash2, ArrowRight, CheckCircle2, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/agt-panel/components/ui/dialog"

export default function CartPage() {
    const { cart, removeFromCart, clearCart } = useCart()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showSuccessDialog, setShowSuccessDialog] = useState(false)
    const { toast } = useToast()
    const router = useRouter()

    const [orderForm, setOrderForm] = useState({
        firstname: "",
        lastname: "",
        mobile: "",
        email: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        notes: ""
    })

    const handleOrderSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (cart.length === 0) return

        setIsSubmitting(true)
        try {
            // Submit all items as a single order
            await ordersApi.create({
                ...orderForm,
                books: cart.map(item => {
                    const stock = item.availableCopies ?? item.stockQty ?? 0
                    const isAvail = (item.isAvailable !== false && stock > 0)
                    return {
                        bookId: item.id.toString(),
                        quantity: 1,
                        status: isAvail ? 'AVAILABLE' : 'OUT_OF_STOCK'
                    }
                }),
                shippingDetails: `${orderForm.address}, ${orderForm.city}, ${orderForm.state} - ${orderForm.pincode}`,
            })

            toast({
                title: "Success",
                description: "Order placed successfully!",
            })

            setShowSuccessDialog(true)
            clearCart()
        } catch (error: any) {
            console.error("Error placing order:", error)
            toast({
                title: "Order Failed",
                description: error.message || "Something went wrong while placing your order.",
                variant: "destructive"
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="flex bg-background min-h-screen">
            <Sidebar isAdmin={false} />

            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div>
                        <h1 className="text-4xl font-bold flex items-center gap-3">
                            <ShoppingCart size={36} className="text-primary" />
                            My Cart
                        </h1>
                        <p className="text-muted-foreground mt-2">Review your items and complete your order</p>
                    </div>

                    {cart.length === 0 ? (
                        <div className="text-center py-20 bg-card rounded-2xl border border-border/50 shadow-sm">
                            <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <ShoppingCart size={40} className="text-primary" />
                            </div>
                            <h2 className="text-2xl font-semibold">Your cart is empty</h2>
                            <p className="text-muted-foreground mt-2 mb-8">Go back to the browser to find some amazing books!</p>
                            <Button asChild size="lg" className="rounded-full px-8">
                                <Link href="/agt-panel/books">Browse Books</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="grid lg:grid-cols-3 gap-8">
                            {/* Items List */}
                            <div className="lg:col-span-2 space-y-4">
                                <h3 className="font-semibold text-xl mb-4">Items ({cart.length})</h3>
                                {cart.map((item) => (
                                    <Card key={item.id} className="p-4 bg-card border-border/50 flex gap-4 items-center">
                                        <div className="h-24 w-16 bg-muted rounded overflow-hidden flex-shrink-0">
                                            <img
                                                src={item.frontImage || item.imageUrl || "/placeholder.svg"}
                                                alt={item.title}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-lg truncate">{item.title}</h4>
                                            <p className="text-sm text-muted-foreground truncate">{item.author}</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => removeFromCart(item.id)}
                                        >
                                            <Trash2 size={20} />
                                        </Button>
                                    </Card>
                                ))}
                            </div>

                            {/* Checkout Form */}
                            <div className="space-y-6">
                                <Card className="p-6 bg-card border-border/50 shadow-lg sticky top-8">
                                    <h3 className="font-semibold text-xl mb-6">Delivery Details</h3>
                                    <form onSubmit={handleOrderSubmit} className="space-y-4">
                                        <div className="space-y-3">
                                            <div>
                                                <Label htmlFor="firstname" className="text-sm">First Name</Label>
                                                <Input
                                                    id="firstname"
                                                    required
                                                    value={orderForm.firstname}
                                                    onChange={(e) => setOrderForm({ ...orderForm, firstname: e.target.value })}
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="lastname" className="text-sm">Last Name</Label>
                                                <Input
                                                    id="lastname"
                                                    required
                                                    value={orderForm.lastname}
                                                    onChange={(e) => setOrderForm({ ...orderForm, lastname: e.target.value })}
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="mobile" className="text-sm">Mobile Number</Label>
                                                <Input
                                                    id="mobile"
                                                    required
                                                    type="tel"
                                                    value={orderForm.mobile}
                                                    onChange={(e) => setOrderForm({ ...orderForm, mobile: e.target.value })}
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="address" className="text-sm">Shipping Address</Label>
                                                <Textarea
                                                    id="address"
                                                    required
                                                    value={orderForm.address}
                                                    onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
                                                    className="mt-1 min-h-[80px]"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <Label htmlFor="city" className="text-sm">City</Label>
                                                    <Input
                                                        id="city"
                                                        required
                                                        value={orderForm.city}
                                                        onChange={(e) => setOrderForm({ ...orderForm, city: e.target.value })}
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="state" className="text-sm">State</Label>
                                                    <Input
                                                        id="state"
                                                        required
                                                        value={orderForm.state}
                                                        onChange={(e) => setOrderForm({ ...orderForm, state: e.target.value })}
                                                        className="mt-1"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <Label htmlFor="pincode" className="text-sm">Pincode</Label>
                                                <Input
                                                    id="pincode"
                                                    required
                                                    value={orderForm.pincode}
                                                    onChange={(e) => setOrderForm({ ...orderForm, pincode: e.target.value })}
                                                    className="mt-1"
                                                />
                                            </div>
                                        </div>

                                        <Button type="submit" className="w-full mt-4 bg-primary text-primary-foreground font-bold h-12 rounded-xl text-lg hover:shadow-primary/20 hover:shadow-xl transition-all" disabled={isSubmitting}>
                                            {isSubmitting ? (
                                                <Loader2 className="animate-spin" />
                                            ) : (
                                                <>Place Order <ArrowRight className="ml-2" size={20} /></>
                                            )}
                                        </Button>
                                    </form>
                                </Card>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Success Dialog */}
            <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                <DialogContent className="sm:max-w-md bg-card border-border/50 text-center py-10">
                    <div className="flex justify-center mb-6">
                        <div className="bg-green-500/10 p-5 rounded-full">
                            <CheckCircle2 size={60} className="text-green-500" />
                        </div>
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-bold">Order Successful!</DialogTitle>
                        <DialogDescription className="text-lg mt-2">
                            Thank you for your order. We will process it and reach out to you shortly.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-8">
                        <Button className="w-full h-12 text-lg rounded-xl" onClick={() => router.push("/books")}>
                            Continue Browsing
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

