import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot 
} from 'firebase/firestore'
import { db } from '../config/firebase'

const AppContext = createContext()

export function useApp() {
  return useContext(AppContext)
}

export function AppProvider({ children }) {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [productTypes, setProductTypes] = useState([])
  const [currentInvoice, setCurrentInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Invoice draft state for creating new invoices
  const [invoiceDraft, setInvoiceDraft] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    items: []
  })

  // Load invoices from Firestore when user logs in
  useEffect(() => {
    if (!user) {
      setInvoices([])
      setProductTypes([])
      setLoading(false)
      return
    }

    setLoading(true)

    // Subscribe to invoices collection (simple query without orderBy to avoid index requirement)
    const invoicesQuery = query(
      collection(db, 'invoices'),
      where('userId', '==', user.uid)
    )

    const unsubscribeInvoices = onSnapshot(invoicesQuery, (snapshot) => {
      const invoicesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      // Sort on client side to avoid composite index requirement
      invoicesList.sort((a, b) => (b.created_at || 0) - (a.created_at || 0))
      setInvoices(invoicesList)
      setLoading(false)
    }, (error) => {
      console.error('Error fetching invoices:', error)
      // If there's an index error, it will be logged here
      setLoading(false)
    })

    // Subscribe to product types collection (simple query)
    const productTypesQuery = query(
      collection(db, 'product_types'),
      where('userId', '==', user.uid)
    )

    const unsubscribeProductTypes = onSnapshot(productTypesQuery, (snapshot) => {
      const typesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      // Sort on client side
      typesList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      
      // Add default types if none exist
      if (typesList.length === 0) {
        setProductTypes([
          { id: 'default-1', name: 'Ear Ring', isDefault: true },
          { id: 'default-2', name: 'Necklace', isDefault: true },
          { id: 'default-3', name: 'Bracelet', isDefault: true },
          { id: 'default-4', name: 'Ring', isDefault: true },
          { id: 'default-5', name: 'Bangle', isDefault: true },
          { id: 'default-6', name: 'Pendant', isDefault: true },
        ])
      } else {
        setProductTypes(typesList)
      }
    }, (error) => {
      console.error('Error fetching product types:', error)
    })

    // Cleanup subscriptions
    return () => {
      unsubscribeInvoices()
      unsubscribeProductTypes()
    }
  }, [user])

  // Add invoice to Firestore
  const addInvoice = async (invoiceData) => {
    if (!user) return null

    const invoice = {
      ...invoiceData,
      invoice_id: `Inv_${Date.now()}`,
      userId: user.uid,
      created_at: Date.now(),
      updated_at: Date.now()
    }

    try {
      const docRef = await addDoc(collection(db, 'invoices'), invoice)
      const newInvoice = { id: docRef.id, ...invoice }
      setCurrentInvoice(newInvoice)
      return newInvoice
    } catch (error) {
      console.error('Error adding invoice:', error)
      throw error
    }
  }

  // Update invoice in Firestore
  const updateInvoice = async (invoiceId, updates) => {
    if (!user) return

    try {
      const invoiceRef = doc(db, 'invoices', invoiceId)
      await updateDoc(invoiceRef, {
        ...updates,
        updated_at: Date.now()
      })
      
      // Also update currentInvoice if it's the same invoice
      if (currentInvoice && currentInvoice.id === invoiceId) {
        setCurrentInvoice(prev => ({
          ...prev,
          ...updates,
          updated_at: Date.now()
        }))
      }
    } catch (error) {
      console.error('Error updating invoice:', error)
      throw error
    }
  }

  // Update invoice status
  const updateInvoiceStatus = async (invoiceId, status) => {
    await updateInvoice(invoiceId, { status })
  }

  // Delete invoice from Firestore
  const deleteInvoice = async (invoiceId) => {
    if (!user) return

    try {
      const { deleteDoc } = await import('firebase/firestore')
      const invoiceRef = doc(db, 'invoices', invoiceId)
      await deleteDoc(invoiceRef)
    } catch (error) {
      console.error('Error deleting invoice:', error)
      throw error
    }
  }

  // Add product type to Firestore
  const addProductType = async (name) => {
    if (!user) return

    try {
      const docRef = await addDoc(collection(db, 'product_types'), {
        name,
        userId: user.uid,
        createdAt: Date.now()
      })
      return { id: docRef.id, name }
    } catch (error) {
      console.error('Error adding product type:', error)
      throw error
    }
  }

  // Update product type in Firestore
  const updateProductType = async (typeId, name) => {
    if (!user) return

    // Skip default types
    if (typeId.startsWith('default-')) {
      // Convert default to custom type
      await addProductType(name)
      return
    }

    try {
      const typeRef = doc(db, 'product_types', typeId)
      await updateDoc(typeRef, { name })
    } catch (error) {
      console.error('Error updating product type:', error)
      throw error
    }
  }

  // Delete product type from Firestore
  const deleteProductType = async (typeId) => {
    if (!user) return

    // Skip default types
    if (typeId.startsWith('default-')) {
      setProductTypes(prev => prev.filter(t => t.id !== typeId))
      return
    }

    try {
      const { deleteDoc } = await import('firebase/firestore')
      const typeRef = doc(db, 'product_types', typeId)
      await deleteDoc(typeRef)
    } catch (error) {
      console.error('Error deleting product type:', error)
      throw error
    }
  }

  // Get invoice by ID
  const getInvoiceById = (invoiceId) => {
    return invoices.find(inv => inv.id === invoiceId || inv.invoice_id === invoiceId)
  }

  // Invoice draft management functions
  const updateDraft = (updates) => {
    setInvoiceDraft(prev => ({ ...prev, ...updates }))
  }

  const resetDraft = () => {
    setInvoiceDraft({
      customer_name: '',
      customer_phone: '',
      customer_address: '',
      items: []
    })
  }

  const addItemToDraft = (item) => {
    setInvoiceDraft(prev => ({
      ...prev,
      items: [...prev.items, { 
        ...item, 
        id: `item_${Date.now()}`,
        discount_percent: item.discount_percent !== undefined ? item.discount_percent : 10 // Default 10% discount
      }]
    }))
  }

  const updateItemInDraft = (itemId, updates) => {
    setInvoiceDraft(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      )
    }))
  }

  const removeItemFromDraft = (itemId) => {
    setInvoiceDraft(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }))
  }

  // Calculate totals helper with item-level discounts
  const calculateTotals = (items) => {
    const subtotal = items.reduce((sum, item) => sum + (item.value * item.qty), 0)
    const totalDiscount = items.reduce((sum, item) => {
      const itemTotal = item.value * item.qty
      const itemDiscount = item.discount_percent ? Math.round(itemTotal * (item.discount_percent / 100)) : 0
      return sum + itemDiscount
    }, 0)
    const total = subtotal - totalDiscount
    return { subtotal, discountAmount: totalDiscount, total }
  }

  // Calculate item final price after discount
  const calculateItemFinal = (item) => {
    const itemTotal = item.value * item.qty
    const itemDiscount = item.discount_percent ? Math.round(itemTotal * (item.discount_percent / 100)) : 0
    return itemTotal - itemDiscount
  }

  // Create invoice (saves to Firestore) - alias for addInvoice for backward compatibility
  const createInvoice = async (invoiceData) => {
    return await addInvoice(invoiceData)
  }

  // Get invoice (alias for getInvoiceById)
  const getInvoice = (invoiceId) => {
    return getInvoiceById(invoiceId)
  }

  const value = {
    invoices,
    productTypes,
    currentInvoice,
    loading,
    setCurrentInvoice,
    addInvoice,
    createInvoice,  // alias for backward compatibility
    updateInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    addProductType,
    updateProductType,
    deleteProductType,
    getInvoiceById,
    getInvoice,  // alias for backward compatibility
    // Draft management
    invoiceDraft,
    updateDraft,
    resetDraft,
    addItemToDraft,
    updateItemInDraft,
    removeItemFromDraft,
    calculateTotals,
    calculateItemFinal
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}
