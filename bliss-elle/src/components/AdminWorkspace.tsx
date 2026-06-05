import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Plus, Trash2, Edit2, Check, ShoppingBag, Mail, RefreshCw, Search,
  Layers, ShieldCheck, Tag, DollarSign, Sliders, AlertTriangle, 
  LogIn, LogOut, Loader2, Sparkles, Award, User, HelpCircle, 
  Activity, ArrowUpRight, ArrowLeft, Lock, Eye, EyeOff, ClipboardList, 
  UserCheck, CornerDownRight, CheckCircle2 
} from 'lucide-react';
import { db, auth, logInWithGoogle, OperationType, handleFirestoreError } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, query, where, getDoc } from 'firebase/firestore';
import { Hotspot } from '../types';
import { jsPDF } from 'jspdf';

import { saveVideoBlob, clearVideoBlob } from '../lib/videoDb';

interface AdminWorkspaceProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  isAdminUser: boolean;
  onSetAdminUser?: (isAdmin: boolean) => void;
  localPortraitUrl?: string | null;
  localLandscapeUrl?: string | null;
  onVideoUploaded?: (type: 'portrait' | 'landscape', url: string, fileType?: 'video' | 'image', rawFile?: File | Blob) => void;
}

const ADMIN_WHITELIST = [
  'abubakarsadikmusah2004@gmail.com',
  'jenatubashiru4@gmail.com',
  'jannahblisselle@gmail.com',
  'secondadmin@gmail.com'
];

export default function AdminWorkspace({
  isOpen,
  onClose,
  user,
  isAdminUser,
  onSetAdminUser,
  localPortraitUrl,
  localLandscapeUrl,
  onVideoUploaded
}: AdminWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'newsletter' | 'profiles' | 'admin-profile'>('inventory');
  
  // Real-time states
  const [items, setItems] = useState<Hotspot[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  
  // Admin profile coordinate states
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminLocation, setAdminLocation] = useState("");
  const [adminBranch, setAdminBranch] = useState("Maison Accra");
  const [isAdminSaving, setIsAdminSaving] = useState(false);
  
  // Real-time admins list and login history states
  const [adminsList, setAdminsList] = useState<any[]>([]);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  
  // Custom direct URL link states for backgrounds
  const [landscapeLink, setLandscapeLink] = useState("");
  const [portraitLink, setPortraitLink] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Email & Password login interface states
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // New product addition / Product editing state
  const [editingProduct, setEditingProduct] = useState<Hotspot | null>(null);
  const [newItemId, setNewItemId] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Heels");
  const [newItemPrice, setNewItemPrice] = useState("350"); // defaulted to GHS price
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemX, setNewItemX] = useState("50%");
  const [newItemY, setNewItemY] = useState("45%");
  const [newItemTag, setNewItemTag] = useState("New Drop");
  const [newItemImageUrl, setNewItemImageUrl] = useState("");
  
  // Extra detailed luxury attributes
  const [newItemImageUrl2, setNewItemImageUrl2] = useState("");
  const [newItemImageUrl3, setNewItemImageUrl3] = useState("");
  const [newItemSizesStr, setNewItemSizesStr] = useState("37, 38, 39, 40, 41, 42");
  const [newItemColorsStr, setNewItemColorsStr] = useState("Deep Forest Green, Gilded Gold");
  const [newItemMaterial, setNewItemMaterial] = useState("Handmade Italian Calf Leather");
  const [newItemQuality, setNewItemQuality] = useState("Double memory-foam orthotic cushion & premium gold studs");
  const [newItemStyling, setNewItemStyling] = useState("Style styled with flowy silk shawls or tailored linen trousers");

  const [newItemInStock, setNewItemInStock] = useState(true);
  const [newItemFeatured, setNewItemFeatured] = useState(false);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);

  // Search & Filtering States
  const [searchQuery, setSearchQuery] = useState("");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState("All");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("All");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");
  const [selectedSortOrder, setSelectedSortOrder] = useState("Newest First");

  // Receipt Invoice & Automated notification states
  const [receiptOrder, setReceiptOrder] = useState<any | null>(null);
  const [simulatedEmailSending, setSimulatedEmailSending] = useState(false);
  const [emailSuccessSent, setEmailSuccessSent] = useState<string | null>(null);

  // Deletion Modal popup state
  const [productToDelete, setProductToDelete] = useState<Hotspot | null>(null);

  // Load Inventory real-time
  useEffect(() => {
    if (!isOpen) return;
    const unsub = onSnapshot(collection(db, 'hotspots'), (snapshot) => {
      const list: Hotspot[] = [];
      snapshot.forEach(docSnap => {
        list.push({ ...docSnap.data(), id: docSnap.id } as Hotspot);
      });
      setItems(list);
    }, (err) => {
      console.error(err);
    });
    return () => unsub();
  }, [isOpen]);

  // Load Orders real-time
  useEffect(() => {
    if (!isOpen) return;
    if (!user && !isAdminUser) {
      setOrders([]);
      return;
    }

    const q = isAdminUser 
      ? collection(db, 'orders') 
      : query(collection(db, 'orders'), where('userId', '==', user?.uid));

    const unsub = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(docSnap => {
        list.push({ ...docSnap.data(), id: docSnap.id });
      });
      // Sort newest first
      list.sort((a,b) => {
        const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
        const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
      setOrders(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'orders');
    });
    return () => unsub();
  }, [isOpen, user, isAdminUser]);

  // Load Newsletter real-time
  useEffect(() => {
    if (!isOpen) return;
    if (!isAdminUser) {
      setNewsletterSubscribers([]);
      return;
    }

    const unsub = onSnapshot(collection(db, 'newsletter'), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(docSnap => {
        list.push({ ...docSnap.data(), id: docSnap.id });
      });
      setNewsletterSubscribers(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'newsletter');
    });
    return () => unsub();
  }, [isOpen, isAdminUser]);

  // Load User Profiles, Managed Admins, Login History, and Admin Profile coordinates
  useEffect(() => {
    if (!isOpen) return;
    if (!isAdminUser) {
      setProfiles([]);
      setAdminsList([]);
      setLoginHistory([]);
      return;
    }

    const unsubProfiles = onSnapshot(collection(db, 'profiles'), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(docSnap => {
        list.push({ ...docSnap.data(), id: docSnap.id });
      });
      setProfiles(list);
    }, (err) => {
      console.warn("Could not query user profiles list in real-time:", err);
    });

    const unsubAdmins = onSnapshot(collection(db, 'admins'), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(docSnap => {
        list.push({ ...docSnap.data(), id: docSnap.id });
      });
      setAdminsList(list);
    }, (err) => {
      console.warn("Could not query admins list in real-time:", err);
    });

    const unsubHistory = onSnapshot(collection(db, 'admin_login_history'), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(docSnap => {
        list.push({ ...docSnap.data(), id: docSnap.id });
      });
      // Sort history newest first
      list.sort((a, b) => {
        const timeA = a.timestamp?.seconds ? a.timestamp.seconds * 1000 : new Date(a.timestamp || 0).getTime();
        const timeB = b.timestamp?.seconds ? b.timestamp.seconds * 1000 : new Date(b.timestamp || 0).getTime();
        return timeB - timeA;
      });
      setLoginHistory(list);
    }, (err) => {
      console.warn("Could not query login history in real-time:", err);
    });

    // Also fetch current Admin User's own saved coordinates
    if (user) {
      setAdminUsername(user.displayName || "");
      
      // Look up under 'profiles'
      import('firebase/firestore').then(({ doc, getDoc }) => {
        getDoc(doc(db, 'profiles', user.uid))
          .then((snap) => {
            if (snap.exists()) {
              const data = snap.data();
              if (data.username) setAdminUsername(data.username);
              if (data.phone) setAdminPhone(data.phone);
              if (data.location) setAdminLocation(data.location);
              if (data.branch) setAdminBranch(data.branch);
            }
          })
          .catch((err) => {
            console.warn("Could not fetch Admin profile data values:", err);
          });
      });
    }

    return () => {
      unsubProfiles();
      unsubAdmins();
      unsubHistory();
    };
  }, [isOpen, isAdminUser, user]);

  // Handle standard Firebase Email & Password Authentication
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setStatusMessage("");
    
    if (!emailInput.trim() || !passwordInput.trim()) {
      setErrorMessage("Please fill in both Email and Password fields.");
      return;
    }

    setIsSubmittingAuth(true);
    try {
      const emailLower = emailInput.trim().toLowerCase();

      // Check if trying to login using secure master testing password in sandboxed preview iframe
      if (passwordInput === 'BLISS2026' && ADMIN_WHITELIST.includes(emailLower)) {
        setStatusMessage("Authenticated successfully via Master Secret Passcode! Entering dashboard...");
        if (onSetAdminUser) {
          onSetAdminUser(true);
        }
        setEmailInput("");
        setPasswordInput("");
        setIsSubmittingAuth(false);
        return;
      }

      await signInWithEmailAndPassword(auth, emailLower, passwordInput);

      // Verify administrative authorization dynamically from the database
      let isAuthorized = ADMIN_WHITELIST.includes(emailLower);
      if (!isAuthorized) {
        try {
          const adminDoc = await getDoc(doc(db, 'admins', emailLower));
          if (adminDoc.exists()) {
            isAuthorized = true;
          }
        } catch (dbErr) {
          console.warn("Could not retrieve administrative permission document:", dbErr);
        }
      }

      if (!isAuthorized) {
        setErrorMessage(`Access Denied: This account (${emailLower}) is not authorized as an Administrator.`);
        await auth.signOut();
        setIsSubmittingAuth(false);
        return;
      }

      setStatusMessage("Authenticated successfully as Curator! Entering dashboard...");
      setEmailInput("");
      setPasswordInput("");
    } catch (err: any) {
      console.error("Manual sign in error:", err);
      let friendlyMsg = "Authentication failed. Please verify credentials.";
      if (err instanceof Error) {
        if (err.message.includes('auth/invalid-credential') || err.message.includes('auth/wrong-password')) {
          friendlyMsg = "Invalid user credentials. Please double check.";
        } else if (err.message.includes('auth/user-not-found')) {
          friendlyMsg = "No curator registered under this email in Firebase.";
        } else {
          friendlyMsg = err.message;
        }
      }
      setErrorMessage(friendlyMsg);
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Google Login popup option with automatic whitelist check
  const handleGoogleLogin = async () => {
    setErrorMessage("");
    setStatusMessage("");
    setIsSubmittingAuth(true);
    try {
      const loggedUser = await logInWithGoogle();
      if (loggedUser) {
        const clientEmail = loggedUser.email?.toLowerCase() || '';
        
        let isAuthorized = ADMIN_WHITELIST.includes(clientEmail);
        if (!isAuthorized && clientEmail) {
          try {
            const adminDoc = await getDoc(doc(db, 'admins', clientEmail));
            if (adminDoc.exists()) {
              isAuthorized = true;
            }
          } catch (dbErr) {
            console.warn("Could not retrieve administrative permission document:", dbErr);
          }
        }

        if (!isAuthorized) {
          setErrorMessage(`Access Denied: Account (${clientEmail}) is not authorized as an Administrator.`);
          await auth.signOut();
        } else {
          setStatusMessage(`Welcome back, ${loggedUser.displayName || 'Curator'} 👑! Access Granted.`);
        }
      }
    } catch (err: any) {
      console.warn("Workspace Google Login error:", err);
      let errMsg = "Google Login failed inside the sandbox frame. Click 'Open App' above to sign in easily.";
      const errMsgStr = String(err?.message || err);
      const errCodeStr = String(err?.code || '');
      
      if (errCodeStr.includes('cancelled-popup-request') || 
          errCodeStr.includes('popup-closed-by-user') || 
          errMsgStr.includes('cancelled-popup-request') || 
          errMsgStr.includes('popup-closed-by-user')) {
        errMsg = "Sign-in popup was closed or cancelled. Please keep the popup window open to select your Google account.";
      } else if (err?.message) {
        errMsg = err.message;
      }
      setErrorMessage(errMsg);
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Populate form with existing product details for editing
  const initiateEditProduct = (item: Hotspot) => {
    setEditingProduct(item);
    setNewItemId(item.id);
    setNewItemName(item.name);
    setNewItemCategory(item.category);
    setNewItemPrice(item.price);
    setNewItemDescription(item.description);
    setNewItemX(item.x);
    setNewItemY(item.y);
    setNewItemTag(item.tag);
    setNewItemImageUrl(item.imageUrl || "");
    setNewItemInStock(item.inStock !== false); // default to true
    setNewItemFeatured(item.featured || false);
    
    // Extra detailed attributes
    setNewItemImageUrl2(item.images && item.images[1] ? item.images[1] : "");
    setNewItemImageUrl3(item.images && item.images[2] ? item.images[2] : "");
    setNewItemSizesStr(item.sizes ? item.sizes.join(', ') : "37, 38, 39, 40, 41, 42");
    setNewItemColorsStr(item.colors ? item.colors.join(', ') : "Deep Forest Green, Gilded Gold");
    setNewItemMaterial(item.material || "");
    setNewItemQuality(item.quality || "");
    setNewItemStyling(item.styling || "");
    
    // Scroll up to form cleanly
    const formElement = document.getElementById('maison-form-anchor');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const cancelEditingMode = () => {
    setEditingProduct(null);
    setNewItemId("");
    setNewItemName("");
    setNewItemDescription("");
    setNewItemX("50%");
    setNewItemY("45%");
    setNewItemTag("New Drop");
    setNewItemImageUrl("");
    
    // Extra attributes reset
    setNewItemImageUrl2("");
    setNewItemImageUrl3("");
    setNewItemSizesStr("37, 38, 39, 40, 41, 42");
    setNewItemColorsStr("Deep Forest Green, Gilded Gold");
    setNewItemMaterial("Handmade Italian Calf Leather");
    setNewItemQuality("Double memory-foam orthotic cushion & premium gold studs");
    setNewItemStyling("Style styled with flowy silk shawls or tailored linen trousers");

    setNewItemInStock(true);
    setNewItemFeatured(false);
    setStatusMessage("Product edit mode cleared.");
  };

  // Submit product creation or update back to Firestore
  const handleCreateOrUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setStatusMessage("");

    if (!newItemId || !newItemName || !newItemPrice) {
      setErrorMessage("Product Number, Name, and Price are mandatory fields.");
      return;
    }

    if (!isAdminUser) {
      setErrorMessage("Write permission denied. Whitelisted administrator authorization required.");
      return;
    }

    setLoading(true);
    try {
      // Clean ID format
      const finalId = newItemId.trim().toLowerCase().replace(/\s+/g, '-');
      
      const finalImagesList: string[] = [];
      if (newItemImageUrl.trim()) finalImagesList.push(newItemImageUrl.trim());
      if (newItemImageUrl2.trim()) finalImagesList.push(newItemImageUrl2.trim());
      if (newItemImageUrl3.trim()) finalImagesList.push(newItemImageUrl3.trim());

      const finalSizesList = newItemSizesStr.split(',').map(s => s.trim()).filter(Boolean);
      const finalColorsList = newItemColorsStr.split(',').map(c => c.trim()).filter(Boolean);

      const productDoc: Hotspot = {
        id: finalId,
        name: newItemName.trim(),
        category: newItemCategory,
        price: newItemPrice.trim(),
        description: newItemDescription.trim() || "An amazing premium luxury addition.",
        x: newItemX.trim(),
        y: newItemY.trim(),
        tag: newItemTag.trim(),
        imageUrl: newItemImageUrl.trim() || "",
        inStock: newItemInStock,
        featured: newItemFeatured,
        createdAt: editingProduct?.createdAt || new Date(),
        updatedAt: new Date(),
        images: finalImagesList,
        sizes: finalSizesList,
        colors: finalColorsList,
        material: newItemMaterial.trim() || "Premium Italian Calfskin",
        quality: newItemQuality.trim() || "High quality memory foam comfort cushion sole",
        styling: newItemStyling.trim() || "Style with tailored trousers or chic modest wraps"
      };

      await setDoc(doc(db, 'hotspots', finalId), productDoc);
      
      if (editingProduct) {
        setStatusMessage(`Successful update: "${newItemName}" database record customized.`);
      } else {
        setStatusMessage(`Successful creation: "${newItemName}" registered as an active lookbook hotspot.`);
      }
      
      // Clear inputs and editing mode
      setEditingProduct(null);
      setNewItemId("");
      setNewItemName("");
      setNewItemDescription("");
      setNewItemX("50%");
      setNewItemY("45%");
      setNewItemTag("New Drop");
      setNewItemImageUrl("");
      setNewItemImageUrl2("");
      setNewItemImageUrl3("");
      setNewItemSizesStr("37, 38, 39, 40, 41, 42");
      setNewItemColorsStr("Deep Forest Green, Gilded Gold");
      setNewItemMaterial("Handmade Italian Calf Leather");
      setNewItemQuality("Double memory-foam orthotic cushion & premium gold studs");
      setNewItemStyling("Style styled with flowy silk shawls or tailored linen trousers");
      setNewItemInStock(true);
      setNewItemFeatured(false);
    } catch (err) {
      console.error(err);
      setErrorMessage("Database rejection: Verify safety rules and fields.");
    } finally {
      setLoading(false);
    }
  };

  // Delete product document from Firestore hotspots with custom luxurious modal
  const confirmDeleteProduct = async (item: Hotspot) => {
    setErrorMessage("");
    setStatusMessage("");
    if (!isAdminUser) {
      setErrorMessage("Protected operation: Administrator credentials are required to drop materials.");
      return;
    }

    try {
      await deleteDoc(doc(db, 'hotspots', item.id));
      setStatusMessage(`Luxury item "${item.name}" retired from inventory successfully.`);
      // If we were editing this item, cancel editing
      if (editingProduct?.id === item.id) {
        cancelEditingMode();
      }
    } catch (err) {
      console.error("Critical Deletion Rejection:", err);
      setErrorMessage("Rejection. Access parameters breached.");
    } finally {
      setProductToDelete(null);
    }
  };

  // Compile offline luxury PDF transaction receipt with custom formatting using jsPDF
  const generateReceiptPDF = (order: any) => {
    if (!order) return;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Draw background frames and margins
    doc.setDrawColor(186, 154, 93); // Gold Frame Accent Color
    doc.setLineWidth(0.4);
    doc.rect(5, 5, 200, 287); // Primary page outer border
    doc.rect(6.5, 6.5, 197, 284); // Dual luxury spacing rule

    // Forest green backdrop header bar
    doc.setFillColor(10, 26, 21); // Bliss Elle Brand Emerald Dark Green
    doc.rect(7.5, 7.5, 195, 26, 'F');

    // Title Elements
    doc.setTextColor(186, 154, 93); // Gold text
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(19);
    doc.text("BLISS ELLE GHANA MAISON", 105, 17, { align: 'center' });
    
    doc.setTextColor(255, 255, 255); // White subtext
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text("ACCREDITED UNIQUE DESIGN — PREMIUM OFFICIAL CRM RECEIPT", 105, 23, { align: 'center' });
    doc.text("DEVELOPED BY TECHLOOM GHANA (LICENSED JOE VARDY GROUP LLC)", 105, 28, { align: 'center' });

    // Customer and Invoice metadata headers
    doc.setTextColor(21, 45, 37); // Forest dark color
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text("INVOICE METADATA:", 16, 47);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(60, 60, 60);
    doc.text(`Invoice Ref ID: #${order.id?.substring(0, 8).toUpperCase() || 'N/A-STABLE'}`, 16, 53);
    doc.text(`System Ref: BE-${Math.floor(Math.random() * 900000 + 100000)}`, 16, 58);
    doc.text(`Fulfillment stage: ${order.status?.toUpperCase() || 'COMPLETED'}`, 16, 63);
    doc.text(`Timestamp: ${new Date().toLocaleString()}`, 16, 68);

    // Right header column
    doc.setTextColor(21, 45, 37);
    doc.setFont('Helvetica', 'bold');
    doc.text("PREPARED FOR GUEST:", 120, 47);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(60, 60, 60);
    doc.text(`Client: ${order.clientName || order.email || 'VIP Guest'}`, 120, 53);
    doc.text(`Email: ${order.email || 'vip.guest@blisselle.com'}`, 120, 58);
    doc.text(`Phone No: ${order.clientPhone || order.phone || 'N/A'}`, 120, 63);
    doc.text(`Fitting location: ${order.clientLocation || order.address || 'Boutique Store Pickup'}`, 120, 68);

    // Drawing Divider
    doc.setDrawColor(220, 220, 220);
    doc.line(16, 75, 194, 75);

    // Table Header
    doc.setFillColor(242, 239, 230); // Warm ivory color background for table header
    doc.rect(16, 81, 178, 8, 'F');
    doc.setTextColor(21, 45, 37);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.text("CONTEMPORARY MASTERWORK ELEMENT", 21, 86);
    doc.text("MAISON CATEGORY", 98, 86);
    doc.text("COMMISSION PRICE", 152, 86);

    // Render purchased elements
    let y = 96;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(50, 50, 50);

    if (order.items && order.items.length > 0) {
       order.items.forEach((item: any, idx: number) => {
        // Draw row separation styling
        if (idx % 2 === 1) {
          doc.setFillColor(249, 248, 244);
          doc.rect(16, y - 5, 178, 7, 'F');
        }
        doc.text(String(item.name || 'Unbranded Luxury Masterpiece').toUpperCase(), 21, y);
        doc.text(String(item.category || 'Maison Fitment').toUpperCase(), 98, y);
        doc.text(String(item.price || 'GHS 15,000'), 152, y);
        y += 8;
      });
    } else {
      doc.text("BLISS ELLE LUXURY CUSTOMIZATION FEE", 21, y);
      doc.text("BESPOKE", 98, y);
      doc.text("GHS 18,500.00", 152, y);
      y += 8;
    }

    // Line rule separating subtotal
    doc.setDrawColor(186, 154, 93);
    doc.line(16, y, 194, y);
    y += 9;

    // Subtotal output in gold accent
    doc.setTextColor(186, 154, 93);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text("TOTAL DISPATCHED COMMISSION VALUE:", 85, y);
    
    doc.setTextColor(0, 0, 0);
    const amountVal = order.total?.toString().includes('GHS') || order.total?.toString().includes('$')
      ? order.total
      : `GHS ${order.total?.toLocaleString() || '18,500'}`;
    doc.text(amountVal, 152, y);

    // Footer signature information
    y += 24;
    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    doc.text("This receipt constitutes official confirmation of custom fitting allocations handled by accredited Bliss Elle Gh boutique personnel.", 105, y, { align: 'center' });
    y += 4;
    doc.text("Thank you for your valued patronage of certified West African fashion art.", 105, y, { align: 'center' });

    // Gold authentication watermark note at base
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(186, 154, 93);
    doc.text("✦ CERTIFIED WEST AFRICAN CRAFTSMANSHIP ✦", 105, 272, { align: 'center' });

    // Trigger download popup
    doc.save(`bliss_elle_invoice_${order.id?.substring(0,6) || 'receipt'}.pdf`);
  };

  // Toggle Order customer statuses
  const handleUpdateOrderStatus = async (orderId: string, currentStatus: string) => {
    setErrorMessage("");
    setStatusMessage("");
    if (!isAdminUser) {
      setErrorMessage("Fulfillment updates restricted to whitelisted boutique curators.");
      return;
    }

    let nextStatus = '';
    const current = (currentStatus || 'submitted').toLowerCase();

    if (current === 'submitted' || current === 'pending') {
      nextStatus = 'recived';
    } else if (current === 'recived' || current === 'received' || current === 'assigned') {
      nextStatus = 'packaged';
    } else if (current === 'packaged' || current === 'shipped') {
      nextStatus = 'delivered';
    } else {
      // keep at any stage and do not go back to submitted
      return;
    }

    try {
      const orderObj = orders.find(o => o.id === orderId);
      const existingNotifications = orderObj?.notificationsSent || [];
      const updatedNotifications = [...existingNotifications];

      if (nextStatus === 'packaged' || nextStatus === 'shipped' || nextStatus === 'delivered' || nextStatus === 'completed') {
        updatedNotifications.push({
          status: nextStatus,
          type: 'email',
          recipient: orderObj?.email || 'vip.guest@blisselle.com',
          timestamp: new Date().toISOString(),
          subject: (nextStatus === 'packaged' || nextStatus === 'shipped') 
            ? '⚜️ BLISS ELLE - Your Luxury Fashion Order is Packaged!' 
            : '⚜️ BLISS ELLE - Premium Order Completed & Delivered!',
          statusText: 'Sent (Automated Notification)'
        });
      }

      await updateDoc(doc(db, 'orders', orderId), {
        status: nextStatus,
        updatedAt: new Date(),
        notificationsSent: updatedNotifications
      });

      setStatusMessage(`Order status adjusted to [${nextStatus.toUpperCase()}] successfully.`);

      // If nextStatus is packaged or delivered, load that order to show receipt & dispatch dialogue
      if (nextStatus === 'packaged' || nextStatus === 'shipped' || nextStatus === 'delivered' || nextStatus === 'completed') {
        const freshOrderObj = {
          ...orderObj,
          id: orderId,
          status: nextStatus,
          notificationsSent: updatedNotifications
        };
        setReceiptOrder(freshOrderObj);
        setEmailSuccessSent(null);
      }
    } catch(err) {
      console.error(err);
      setErrorMessage("Failed to adjust order parameters. Validation constraints breached.");
    }
  };

  // Retrench individual customer order from database
  const handleDeleteOrder = async (orderId: string) => {
    setErrorMessage("");
    setStatusMessage("");
    if (!isAdminUser) {
      setErrorMessage("Protected operation: Only authorized curators may purge records.");
      return;
    }

    if (window.confirm("Do you want to permanently purge this fitting request? This action is irreversible.")) {
      try {
        // Fetch order to locate client uid for profile audit and sync cleanup
        const orderSnap = await getDoc(doc(db, 'orders', orderId));
        let clientUid = null;
        if (orderSnap.exists()) {
          clientUid = orderSnap.data().userId;
        }

        await deleteDoc(doc(db, 'orders', orderId));

        // Sync and filter customer profile order arrays to avoid orphans
        if (clientUid) {
          try {
            const profileRef = doc(db, 'profiles', clientUid);
            const profileSnap = await getDoc(profileRef);
            if (profileSnap.exists()) {
              const pData = profileSnap.data();
              const updatedHistory = (pData.orderHistory || []).filter((o: any) => o.orderId !== orderId && o.id !== orderId);
              const updatedList = (pData.ordersList || []).filter((o: any) => o.orderId !== orderId && o.id !== orderId);
              await updateDoc(profileRef, {
                orderHistory: updatedHistory,
                ordersList: updatedList
              });
            }
          } catch (profileErr) {
            console.warn("User profile order clean up skipped on admin delete:", profileErr);
          }
        }

        setStatusMessage("Shopper allocation request purged successfully.");
      } catch (err) {
        setErrorMessage("Purge failed. Insufficient database privileges.");
      }
    }
  };

  // Count active stats for premium dashboard cards
  const totalProductsCount = items.length;
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter(o => o.status === 'pending' || o.status === 'submitted').length;
  const subscribersCount = newsletterSubscribers.length;

  const fulfillmentRatio = totalOrdersCount > 0 
    ? Math.round(((totalOrdersCount - pendingOrdersCount) / totalOrdersCount) * 100) 
    : 100;

  // Floating background ambient particles simulator (inside admin)
  const adminParticles = Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    left: `${(i * 17) % 100}%`,
    top: `${(i * 23) % 100}%`,
    size: (i % 3) * 2 + 2,
    duration: 15 + (i * 2)
  }));

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex flex-col w-screen min-h-screen bg-gradient-to-tr from-[#0a1a15] via-[#152D25] to-[#0d1e18] text-white overflow-y-auto select-none font-sans"
          id="bliss-admin-workspace"
        >
          
          {/* Background grid line patterns & glowing organic lights */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute top-20 right-1/4 h-[700px] w-[700px] rounded-full bg-radial-to-br from-[#BA9A5D]/15 via-[#152D25]/10 to-transparent blur-3xl opacity-75" />
            <div className="absolute top-1/3 left-10 h-[500px] w-[500px] rounded-full bg-radial-to-tr from-[#dfce9f]/8 via-[#152D25]/20 to-transparent blur-3xl" />
            <div className="absolute bottom-12 left-1/4 h-[800px] w-[800px] rounded-full bg-radial-to-tr from-[#152D25]/30 via-transparent to-transparent blur-3xl" />
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.009)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.009)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40 animate-pulse" style={{ animationDuration: '6s' }} />
            
            {/* Soft Floating gold ambient particles */}
            {adminParticles.map(p => (
              <motion.div
                key={p.id}
                className="absolute rounded-full bg-[#BA9A5D]/20"
                style={{
                  left: p.left,
                  top: p.top,
                  width: p.size,
                  height: p.size,
                }}
                animate={{
                  y: ['0px', '-100px', '0px'],
                  x: ['0px', '40px', '0px'],
                }}
                transition={{
                  duration: p.duration,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          {/* Golden Line Border on top */}
          <div className="relative h-[1px] bg-gradient-to-r from-transparent via-[#BA9A5D] to-transparent z-40 shrink-0 shadow-[0_4px_16px_rgba(186,154,93,0.3)]" />

          {/* CONTAINER CONTENT AREA */}
          <div className="relative w-full max-w-[1720px] mx-auto flex-1 flex flex-col z-10 px-4 py-6 sm:p-8 lg:p-12 relative">
            
            {/* TOP BAR / NAVIGATION DESKTOP RETAILER ACTION */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6 mb-8 shrink-0">
              <div className="flex items-center gap-4">
                {/* Bliss ELLE Logo replaced settings icon */}
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-[#BA9A5D]/30 shadow-[0_0_15px_rgba(186,154,93,0.25)] p-0.5 overflow-hidden">
                  <img 
                    src="https://res.cloudinary.com/dslngzls6/image/upload/v1780082537/Screenshot_2026-05-29_180017_zdemqz.png" 
                    alt="Bliss ELLE Logo" 
                    className="h-full w-full object-contain mix-blend-multiply" 
                  />
                </div>
                <div>
                  <h1 className="font-sans text-2xl sm:text-3xl font-black uppercase tracking-widest text-[#DFCE9F] text-glow-gold bg-clip-text text-transparent bg-gradient-to-r from-white via-[#DFCE9F] to-[#BA9A5D]">
                    BLISS ELLE GHANA
                  </h1>
                </div>
              </div>

              {/* Close Hub action / returns user immediately back to user app */}
              <button
                onClick={onClose}
                className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] hover:bg-white/[0.08] hover:border-[#BA9A5D]/30 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#DFCE9F] cursor-pointer transition-all shrink-0"
              >
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                <span>Return to Store</span>
              </button>
            </header>

            {/* UNPROTECTED AUTH ZONE (Prompt login if not correct email owner) */}
            {!isAdminUser ? (
              <div className="flex-1 flex items-center justify-center py-6 sm:py-12">
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="w-full max-w-[540px] rounded-3xl border border-white/10 bg-[#05110c]/80 backdrop-blur-xl p-6 sm:p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.65)] relative overflow-hidden"
                >
                  {/* Luxury Plaque Logo Centered in UI */}
                  <div className="flex flex-col items-center text-center pb-6 mb-6 border-b border-white/5">
                    <div className="relative px-5 py-3 bg-white rounded-2xl border border-[#BA9A5D]/30 shadow-[0_12px_32px_rgba(0,0,0,0.4)] mb-4 shrink-0 transition-transform hover:scale-[1.02]">
                      <img 
                        src="https://res.cloudinary.com/dslngzls6/image/upload/v1780082537/Screenshot_2026-05-29_180017_zdemqz.png" 
                        alt="BLISS ELLE" 
                        className="h-14 sm:h-18 object-contain mix-blend-multiply"
                      />
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#BA9A5D] font-bold">Curator Authorization Node</span>
                    <h2 className="font-sans text-xl sm:text-2xl font-black mt-1 text-white uppercase tracking-widest text-glow-gold">
                      Operational Gate
                    </h2>
                    <p className="text-zinc-400 text-xs font-light max-w-sm mt-2 leading-relaxed">
                      Secured environment restricted to certified administrators of Jannah Bliss Elle. Whitelisted database access is verified on key input.
                    </p>
                  </div>

                  {/* Auth message notifications */}
                  {errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-5 p-3.5 bg-red-950/35 border border-red-500/20 text-red-200 rounded-xl text-xs flex gap-2.5 items-start leading-relaxed font-sans-luxury"
                    >
                      <AlertTriangle className="h-4.5 w-4.5 text-red-400 shrink-0 mt-0.5" />
                      <p>{errorMessage}</p>
                    </motion.div>
                  )}

                  {statusMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-5 p-3.5 bg-emerald-950/35 border border-emerald-500/20 text-emerald-200 rounded-xl text-xs flex gap-2.5 items-start leading-relaxed font-sans-luxury"
                    >
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0 mt-0.5" />
                      <p>{statusMessage}</p>
                    </motion.div>
                  )}

                  {/* LOGIN MANUAL PORTAL */}
                  <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div>
                      <label className="text-[9px] text-[#DFCE9F] font-bold uppercase tracking-widest block mb-1.5 font-mono">Curator Identifier Email</label>
                      <div className="relative flex items-center">
                        <User className="absolute left-3.5 h-4 w-4 text-zinc-500" />
                        <input
                          type="email"
                          required
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          placeholder="jannahblisselle@gmail.com"
                          className="w-full bg-black/40 border border-white/10 focus:border-[#BA9A5D] hover:border-white/20 text-xs px-10 py-3.5 rounded-xl text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#BA9A5D]/40 transition-all placeholder:text-zinc-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] text-[#DFCE9F] font-bold uppercase tracking-widest block mb-1.5 font-mono">Secure Access Credentials</label>
                      <div className="relative flex items-center">
                        <Lock className="absolute left-3.5 h-4 w-4 text-zinc-500" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          placeholder="Password token"
                          className="w-full bg-black/40 border border-white/10 focus:border-[#BA9A5D] hover:border-white/20 text-xs px-10 py-3.5 rounded-xl text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#BA9A5D]/40 transition-all placeholder:text-zinc-600"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 text-zinc-400 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingAuth}
                      className="w-full rounded-xl bg-gradient-to-r from-[#BA9A5D] via-[#FFEBB5] to-[#DFCE9F] hover:shadow-[0_0_20px_rgba(186,154,93,0.3)] text-zinc-950 font-bold text-xs uppercase tracking-widest py-3.5 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 mt-5"
                    >
                      {isSubmittingAuth ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-zinc-950" />
                          <span>Decrypting Token...</span>
                        </>
                      ) : (
                        <>
                          <LogIn className="h-4 w-4 text-zinc-950 animate-pulse" />
                          <span>Unlock Curator Credentials</span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* DIVIDER OR SECURE POPUP */}
                  <div className="relative flex py-4 items-center justify-center gap-3 shrink-0">
                    <div className="flex-1 h-[0.5px] bg-white/5" />
                    <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest leading-none">OR AUTH VIA AUTHENTICATOR</span>
                    <div className="flex-1 h-[0.5px] bg-white/5" />
                  </div>

                  {/* GOOGLE ACCESS TRIGGER BUTTON */}
                  <button
                    onClick={handleGoogleLogin}
                    disabled={isSubmittingAuth}
                    type="button"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-[#BA9A5D]/30 py-3.5 flex items-center justify-center gap-2.5 text-xs text-white uppercase tracking-wider font-semibold cursor-pointer transition-all disabled:opacity-50"
                  >
                    <svg className="h-4 w-4 text-white hover:scale-105 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-6.887 4.114-4.694 0-8.503-3.809-8.503-8.503s3.809-8.503 8.503-8.503c2.502 0 4.381.916 5.8 2.235l3.208-3.208C18.84 1.104 15.824 0 12.24 0 5.48 0 0 5.48 0 12.24s5.48 12.24 12.24 12.24c6.702 0 12.285-4.887 12.285-12.24 0-.668-.077-1.354-.22-1.954H12.24z" />
                    </svg>
                    <span>Authenticate via Google Account</span>
                  </button>

                  <div className="mt-6 text-center text-[9px] text-[#BA9A5D]/60 uppercase tracking-widest font-mono">
                    ✦ Authorized Admin emails: <br />
                    <span className="text-zinc-400 font-sans-luxury text-[10px] mt-1 inline-block bg-black/40 px-2 py-0.5 rounded">
                      jannahblisselle@gmail.com
                    </span>
                    &nbsp;&nbsp;
                    <span className="text-zinc-400 font-sans-luxury text-[10px] mt-1 inline-block bg-black/40 px-2 py-0.5 rounded">
                      abubakarsadikmusah2004@gmail.com
                    </span>
                  </div>

                  {/* Dev Sandbox Bypass Workaround */}
                  <div className="mt-6 pt-4 border-t border-white/5 space-y-2">
                    <p className="text-zinc-500 font-sans-luxury text-[10px] text-center leading-relaxed">
                      If standard popup auth is restricted or blocked by your browser's sandboxed iframe policy:
                    </p>
                    <button
                      onClick={() => {
                        if (onSetAdminUser) {
                          onSetAdminUser(true);
                          setStatusMessage("Developer Preview Sandbox override granted successfully!");
                        }
                      }}
                      type="button"
                      className="w-full rounded-xl border border-dashed border-[#BA9A5D]/40 bg-[#BA9A5D]/5 hover:bg-[#BA9A5D]/10 hover:border-[#DFCE9F]/50 py-3 text-[10px] text-[#DFCE9F] font-mono font-bold uppercase tracking-widest cursor-pointer transition-all hover:scale-[1.01]"
                    >
                      ✦ Simulate Curator Override Mode ✦
                    </button>
                    <p className="text-[8px] text-[#BA9A5D]/50 text-center font-mono uppercase tracking-widest">
                      (No password or external popup required)
                    </p>
                  </div>
                </motion.div>
              </div>
            ) : (
              
              /* PROTECTED ADMINISTRATOR WORKSPACE CONTENT */
              <div className="flex-1 flex flex-col min-h-0 space-y-6">
                
                {/* 1. GREETING AND SUBTITLE ACTIONS PANEL */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/[0.01] border border-white/5 p-6 rounded-2xl relative overflow-hidden backdrop-blur-md">
                  <div className="space-y-1">
                    <h2 className="font-sans text-xl sm:text-2xl font-black uppercase tracking-wider text-white leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-[#DFCE9F] text-glow-gold">
                      Greetings, {user?.displayName?.split(' ')[0] || 'Curator'}
                    </h2>
                    <p className="text-xs text-zinc-400 font-light">
                      Maison operations module synchronized. Manage high-fashion lookbook inventory coordinates, custom orders, and VIP marketing Guestlists.
                    </p>
                  </div>

                  {/* Active Operator metadata node */}
                  <div className="flex items-center gap-3.5 font-sans-luxury">
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase block leading-none">Logged In As</span>
                      <strong className="text-[#DFCE9F] text-xs font-semibold block mt-1">{user?.email || 'abubakarsadikmusah2004@gmail.com'}</strong>
                    </div>
                    {user?.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt="Operator avatar" 
                        referrerPolicy="no-referrer"
                        className="h-10 w-10 rounded-xl object-contain border border-[#BA9A5D]/30" 
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-zinc-400" />
                      </div>
                    )}
                    <button
                      onClick={async () => {
                        try {
                          await auth.signOut();
                        } catch (err) {
                          console.warn("Firebase signOut error:", err);
                        }
                        if (onSetAdminUser) {
                          onSetAdminUser(false);
                        }
                        setStatusMessage("Operator session logged out safely.");
                      }}
                      className="p-2.5 rounded-xl bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 text-red-300 hover:text-red-200 cursor-pointer transition-colors"
                      title="Terminate session / Sign out"
                    >
                      <LogOut className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>

                {/* Database State and Error Messages */}
                <AnimatePresence>
                  {errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="p-4 bg-red-950/40 border border-red-500/25 text-red-200 rounded-2xl text-xs flex gap-3 items-start leading-relaxed font-sans-luxury shrink-0"
                    >
                      <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5 animate-bounce" />
                      <div className="flex-1">
                        <strong className="text-white font-bold inline-block mr-1">Error:</strong>
                        <span>{errorMessage}</span>
                      </div>
                      <button onClick={() => setErrorMessage("")} className="text-red-400 hover:text-white font-bold ml-2">Dismiss</button>
                    </motion.div>
                  )}
                  {statusMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="p-4 bg-emerald-950/40 border border-emerald-500/25 text-emerald-200 rounded-2xl text-xs flex gap-3 items-start leading-relaxed font-sans-luxury shrink-0"
                    >
                      <Check className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <strong className="text-white font-bold inline-block mr-1">Success:</strong>
                        <span>{statusMessage}</span>
                      </div>
                      <button onClick={() => setStatusMessage("")} className="text-emerald-400 hover:text-white font-bold ml-2">Dismiss</button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 2. DYNAMIC LOOKBOOK STATS OVERVIEW CARDS (Homepage Style) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 xl:gap-6 shrink-0">
                  
                  {/* Card 1: Total Hotspots */}
                  <div className="group relative p-[1px] rounded-2xl bg-gradient-to-br from-[#DFCE9F]/50 via-[#BA9A5D]/20 to-transparent hover:from-[#DFCE9F] hover:via-[#BA9A5D] hover:to-[#DFCE9F] transition-all duration-500 shadow-[0_0_24px_rgba(186,154,93,0.06)] hover:shadow-[0_0_35px_rgba(186,154,93,0.22)] hover:scale-[1.02]">
                    <div className="bg-[#040e0a]/95 rounded-[15px] p-5 h-full relative overflow-hidden">
                      <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-[#BA9A5D]/10 blur-xl group-hover:bg-[#BA9A5D]/20 transition-colors" />
                      <div className="flex items-start gap-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#BA9A5D]/15 border border-[#BA9A5D]/30 group-hover:border-[#DFCE9F] transition-all">
                          <Award className="h-4 w-4 text-[#DFCE9F]" />
                        </div>
                        <div>
                          <div className="flex items-baseline gap-1.5 font-mono">
                            <span className="text-3xl font-black tracking-tight text-white leading-none bg-clip-text text-transparent bg-gradient-to-r from-white to-[#DFCE9F]">{totalProductsCount}</span>
                            <span className="text-[#BA9A5D] text-sm animate-pulse">✦</span>
                          </div>
                          <h4 className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#DFCE9F]">PRODUCTS</h4>
                        </div>
                      </div>
                      <div className="absolute bottom-0 right-0 left-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#DFCE9F] to-transparent transition-transform duration-500" />
                    </div>
                  </div>

                  {/* Card 2: Total Customer requested bookings */}
                  <div className="group relative p-[1px] rounded-2xl bg-gradient-to-br from-[#DFCE9F]/50 via-[#BA9A5D]/20 to-transparent hover:from-[#DFCE9F] hover:via-[#BA9A5D] hover:to-[#DFCE9F] transition-all duration-500 shadow-[0_0_24px_rgba(186,154,93,0.06)] hover:shadow-[0_0_35px_rgba(186,154,93,0.22)] hover:scale-[1.02]">
                    <div className="bg-[#040e0a]/95 rounded-[15px] p-5 h-full relative overflow-hidden">
                      <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-[#BA9A5D]/10 blur-xl group-hover:bg-[#BA9A5D]/20 transition-colors" />
                      <div className="flex items-start gap-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#BA9A5D]/15 border border-[#BA9A5D]/30 group-hover:border-[#DFCE9F] transition-all">
                          <ClipboardList className="h-4 w-4 text-[#DFCE9F]" />
                        </div>
                        <div>
                          <div className="flex items-baseline gap-1.5 font-mono">
                            <span className="text-3xl font-black tracking-tight text-white leading-none bg-clip-text text-transparent bg-gradient-to-r from-white to-[#DFCE9F]">{totalOrdersCount}</span>
                            <span className="text-amber-400 text-[10px] font-bold">({pendingOrdersCount} pending)</span>
                          </div>
                          <h4 className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#DFCE9F]">Customer Orders</h4>
                          <p className="mt-2 text-[10px] leading-snug text-zinc-400 group-hover:text-zinc-300">Live shoe fits & bag files filed.</p>
                        </div>
                      </div>
                      <div className="absolute bottom-0 right-0 left-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#DFCE9F] to-transparent transition-transform duration-500" />
                    </div>
                  </div>
                </div>

                {/* 3. BESPOKE TABS SELECTORS BAR */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-black/50 p-2 rounded-2xl border border-[#BA9A5D]/20 shadow-[0_0_20px_rgba(186,154,93,0.05)] shrink-0">
                  <div className="flex flex-wrap gap-2 p-1 rounded-xl bg-white/[0.01]">
                    <button
                      onClick={() => { setActiveTab('inventory'); setErrorMessage(""); setStatusMessage(""); }}
                      className={`px-4 py-2 rounded-xl font-sans text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shrink-0 flex items-center ${
                        activeTab === 'inventory' 
                          ? 'bg-gradient-to-r from-[#DFCE9F] via-[#BA9A5D] to-[#DFCE9F] text-zinc-950 shadow-[0_0_15px_rgba(186,154,93,0.35)] scale-105 border border-[#DFCE9F]' 
                          : 'text-zinc-400 hover:text-[#DFCE9F] hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <Layers className="h-3.5 w-3.5 inline-block mr-1.5" /> PRODUCTS
                    </button>
                    <button
                      onClick={() => { setActiveTab('orders'); setErrorMessage(""); setStatusMessage(""); }}
                      className={`px-4 py-2 rounded-xl font-sans text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shrink-0 flex items-center ${
                        activeTab === 'orders' 
                          ? 'bg-gradient-to-r from-[#DFCE9F] via-[#BA9A5D] to-[#DFCE9F] text-zinc-950 shadow-[0_0_15px_rgba(186,154,93,0.35)] scale-105 border border-[#DFCE9F]' 
                          : 'text-zinc-400 hover:text-[#DFCE9F] hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <ShoppingBag className="h-3.5 w-3.5 inline-block mr-1.5" /> Orders ({orders.length})
                    </button>
                    <button
                      onClick={() => { setActiveTab('newsletter'); setErrorMessage(""); setStatusMessage(""); }}
                      className={`px-4 py-2 rounded-xl font-sans text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shrink-0 flex items-center ${
                        activeTab === 'newsletter' 
                          ? 'bg-gradient-to-r from-[#DFCE9F] via-[#BA9A5D] to-[#DFCE9F] text-zinc-950 shadow-[0_0_15px_rgba(186,154,93,0.35)] scale-105 border border-[#DFCE9F]' 
                          : 'text-zinc-400 hover:text-[#DFCE9F] hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <User className="h-3.5 w-3.5 inline-block mr-1.5" /> useRs ({profiles.length})
                    </button>
                    <button
                      onClick={() => { setActiveTab('admin-profile'); setErrorMessage(""); setStatusMessage(""); }}
                      className={`px-4 py-2 rounded-xl font-sans text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shrink-0 flex items-center ${
                        activeTab === 'admin-profile' 
                          ? 'bg-gradient-to-r from-[#DFCE9F] via-[#BA9A5D] to-[#DFCE9F] text-zinc-950 shadow-[0_0_15px_rgba(186,154,93,0.35)] scale-105 border border-[#DFCE9F]' 
                          : 'text-zinc-400 hover:text-[#DFCE9F] hover:bg-[#BA9A5D]/10 border border-transparent'
                      }`}
                    >
                      <Sliders className="h-3.5 w-3.5 inline-block mr-1.5" /> My Settings
                    </button>
                  </div>
                </div>

                {/* 4. CONTENT GRID PANEL CONTAINER (Flexible Scroll Area) */}
                <div className="flex-1 overflow-visible">
                       {/* CONTENT VIEW A: LOOKBOOK MANAGER */}
                  {activeTab === 'inventory' && (() => {
                    // Filter and Query Logic
                    const filteredItems = items.filter(item => {
                      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                            item.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                            item.id.toLowerCase().includes(searchQuery.toLowerCase());
                      
                      let matchesCategory = true;
                      if (selectedCategoryFilter !== "All") {
                        matchesCategory = item.category === selectedCategoryFilter;
                      }
                      
                      return matchesSearch && matchesCategory;
                    });

                    // Advanced Sorting Logic
                    const sortedItems = [...filteredItems].sort((a, b) => {
                      if (selectedSortOrder === "Newest First") {
                        const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
                        const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
                        return dateB - dateA;
                      } else if (selectedSortOrder === "Oldest First") {
                        const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
                        const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
                        return dateA - dateB;
                      } else if (selectedSortOrder === "Price High–Low") {
                        const priceA = parseFloat(a.price.replace(/[^0-9.]/g, '')) || 0;
                        const priceB = parseFloat(b.price.replace(/[^0-9.]/g, '')) || 0;
                        return priceB - priceA;
                      } else if (selectedSortOrder === "Price Low–High") {
                        const priceA = parseFloat(a.price.replace(/[^0-9.]/g, '')) || 0;
                        const priceB = parseFloat(b.price.replace(/[^0-9.]/g, '')) || 0;
                        return priceA - priceB;
                      }
                      return 0;
                    });

                    // Stats Computation
                    const distinctCategoriesCount = new Set(items.map(item => item.category)).size;
                    
                    const getLastUpdatedTime = () => {
                      if (items.length === 0) return "Never";
                      let latest = 0;
                      items.forEach(item => {
                        const time = item.updatedAt?.seconds 
                          ? item.updatedAt.seconds * 1000 
                          : new Date(item.updatedAt || item.createdAt || 0).getTime();
                        if (time > latest) latest = time;
                      });
                      return latest > 0 ? new Date(latest).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now";
                    };

                    // Drag & Drop Image Handler Helper
                    const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        processImageFile(file);
                      }
                    };

                    const processImageFile = (file: File) => {
                      if (!file.type.startsWith('image/')) {
                        setErrorMessage("Unsupported file type. Please upload a JPG, PNG, or WEBP image.");
                        return;
                      }
                      setImageUploadLoading(true);
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        if (event.target?.result) {
                          const img = new Image();
                          img.onload = () => {
                            const MAX_WIDTH = 800;
                            const MAX_HEIGHT = 800;
                            let width = img.width;
                            let height = img.height;

                            if (width > height) {
                              if (width > MAX_WIDTH) {
                                height *= MAX_WIDTH / width;
                                width = MAX_WIDTH;
                              }
                            } else {
                              if (height > MAX_HEIGHT) {
                                width *= MAX_HEIGHT / height;
                                height = MAX_HEIGHT;
                              }
                            }

                            const canvas = document.createElement('canvas');
                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                              ctx.drawImage(img, 0, 0, width, height);
                              // Output JPEG with 70% compression quality
                              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                              setNewItemImageUrl(compressedDataUrl);
                              setStatusMessage(`Image uploaded & safely compressed: ${file.name}`);
                            } else {
                              setNewItemImageUrl(event.target.result as string);
                              setStatusMessage(`File loaded successfully: ${file.name}`);
                            }
                            setImageUploadLoading(false);
                          };
                          img.onerror = () => {
                            setNewItemImageUrl(event.target.result as string);
                            setImageUploadLoading(false);
                          };
                          img.src = event.target.result as string;
                        } else {
                          setImageUploadLoading(false);
                        }
                      };
                      reader.onerror = () => {
                        setErrorMessage("Failed to read image file.");
                        setImageUploadLoading(false);
                      };
                      reader.readAsDataURL(file);
                    };

                    const processExtraImageFile = (file: File, index: number) => {
                      if (!file.type.startsWith('image/')) {
                        setErrorMessage("Unsupported file type. Please upload an image file.");
                        return;
                      }
                      setImageUploadLoading(true);
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        if (event.target?.result) {
                          const base64 = event.target.result as string;
                          if (index === 2) setNewItemImageUrl2(base64);
                          if (index === 3) setNewItemImageUrl3(base64);
                          setStatusMessage(`Additional image ${index - 1} uploaded successfully.`);
                        }
                        setImageUploadLoading(false);
                      };
                      reader.onerror = () => {
                        setErrorMessage(`Failed to read extra image ${index - 1}.`);
                        setImageUploadLoading(false);
                      };
                      reader.readAsDataURL(file);
                    };

                    const handleDragOver = (e: React.DragEvent) => {
                      e.preventDefault();
                    };

                    const handleDrop = (e: React.DragEvent) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        processImageFile(file);
                      }
                    };

                    // Unified category mapping for elegant high-fashion image placeholders if none are uploaded
                    const getCategoryPlaceholder = (category: string) => {
                      switch(category) {
                        case 'Dresses':
                          return 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=600&h=750';
                        case 'Heels':
                          return 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=600&h=750';
                        case 'Slippers':
                          return 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=600&h=750';
                        case 'Bags':
                          return 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600&h=750';
                        case 'Veils & Modest Accessories':
                        default:
                          return 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&q=80&w=600&h=750';
                      }
                    };

                    return (
                      <div className="space-y-6">
                        
                        {/* 1. PRODUCT STATS STRIP */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#05110c]/40 border border-white/5 p-4 rounded-xl shrink-0">
                          <div className="flex items-center gap-3 px-4 py-2">
                            <Layers className="h-5 w-5 text-[#BA9A5D]" />
                            <div>
                              <span className="text-zinc-500 text-[9px] uppercase tracking-widest block font-mono">Total Products</span>
                              <strong className="text-white text-xs sm:text-sm font-extrabold uppercase tracking-widest font-sans">{items.length} PRODUCTS</strong>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 px-4 py-2 border-t sm:border-t-0 sm:border-x border-white/5">
                            <Tag className="h-5 w-5 text-[#BA9A5D]" />
                            <div>
                              <span className="text-zinc-500 text-[9px] uppercase tracking-widest block font-mono">Total Categories</span>
                              <strong className="text-white text-xs sm:text-sm font-extrabold uppercase tracking-widest font-sans">{distinctCategoriesCount} categories</strong>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 px-4 py-2 border-t sm:border-t-0 border-white/5">
                            <RefreshCw className="h-4 w-4 text-[#BA9A5D] animate-spin" style={{ animationDuration: '6s' }} />
                            <div>
                              <span className="text-zinc-500 text-[9px] uppercase tracking-widest block font-mono">Last Updated</span>
                              <strong className="text-white text-xs sm:text-sm font-extrabold uppercase tracking-widest font-sans">{getLastUpdatedTime()}</strong>
                            </div>
                          </div>
                        </div>

                        {/* 2. FILTER & SEARCH BAR */}
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-black/20 p-4 rounded-xl border border-white/5 shrink-0">
                          {/* Search input */}
                          <div className="flex-1 min-w-[260px]">
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Search products by name, slug or code..."
                              className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-[#BA9A5D] text-xs px-4 py-3 rounded-full text-white focus:outline-none transition-all placeholder:text-zinc-600"
                            />
                          </div>

                          {/* Filters dropdowns group */}
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-mono uppercase text-zinc-500 tracking-wider">Category:</span>
                              <select
                                value={selectedCategoryFilter}
                                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                                className="bg-black/45 border border-white/10 focus:border-[#BA9A5D] text-xs px-3.5 py-2 rounded-full text-white focus:outline-none cursor-pointer transition-all"
                              >
                                <option value="All">All Categories</option>
                                <option value="Dresses">Dresses</option>
                                <option value="Heels">Heels</option>
                                <option value="Slippers">Slippers</option>
                                <option value="Bags">Bags</option>
                                <option value="Veils & Modest Accessories">Veils & Modest Accessories</option>
                              </select>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-mono uppercase text-zinc-500 tracking-wider">Sort:</span>
                              <select
                                value={selectedSortOrder}
                                onChange={(e) => setSelectedSortOrder(e.target.value)}
                                className="bg-black/45 border border-white/10 focus:border-[#BA9A5D] text-xs px-3.5 py-2 rounded-full text-white focus:outline-none cursor-pointer transition-all"
                              >
                                <option value="Newest First">Newest First</option>
                                <option value="Oldest First">Oldest First</option>
                                <option value="Price High–Low">Price High–Low</option>
                                <option value="Price Low–High">Price Low–High</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* 3. SPLIT FORMS AND grid LAYOUTS */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                          
                          {/* Left Column: Register New/Edit Product Form */}
                          <form 
                            onSubmit={handleCreateOrUpdateProduct}
                            id="maison-form-anchor" 
                            className={`lg:col-span-5 p-[1px] rounded-2xl bg-gradient-to-br transition-all duration-300 relative ${
                              editingProduct 
                                ? 'from-[#DFCE9F] via-[#BA9A5D] to-[#DFCE9F] shadow-[0_0_25px_rgba(186,154,93,0.3)]' 
                                : 'from-white/10 via-[#BA9A5D]/5 to-transparent shadow-md'
                            }`}
                          >
                            <div className="p-6 rounded-[15px] bg-[#040e0a]/95 backdrop-blur-md h-full w-full">
                              {/* Interactive edit badge */}
                              {editingProduct && (
                                <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full border border-[#BA9A5D]/20 bg-[#BA9A5D]/10 px-3 py-1 text-[8px] font-bold uppercase tracking-widest text-[#DFCE9F]">
                                  <Sparkles className="h-2.5 w-2.5 text-[#BA9A5D]" />
                                  <span>BESPOKE EDITING ACTIVE</span>
                                </div>
                              )}

                              <h4 className="font-sans text-xs font-black uppercase tracking-widest text-white border-b border-white/5 pb-3 mb-5 flex items-center gap-2 text-glow-gold">
                                {editingProduct ? (
                                  <>
                                    <Edit2 className="h-4 w-4 text-[#BA9A5D]" />
                                    <span>Customise Masterpiece</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus className="h-4 w-4 text-[#BA9A5D]" />
                                    <span>ADD NEW PRODUCTS</span>
                                  </>
                                )}
                              </h4>

                            <div className="space-y-4 font-sans-luxury">
                              
                              {/* IMAGE UPLOAD CONTAINER BOX */}
                              <div>
                                <label className="text-[9px] text-[#BA9A5D] font-bold uppercase tracking-widest block mb-1.5 font-mono">PRODUCT IMAGE UPLOAD</label>
                                <div 
                                  onDragOver={handleDragOver}
                                  onDrop={handleDrop}
                                  className="border-2 border-dashed border-white/10 hover:border-[#BA9A5D]/40 rounded-xl p-5 text-center cursor-pointer relative bg-black/20 group transition-all duration-300"
                                >
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleImageFileChange} 
                                    className="absolute inset-0 opacity-0 cursor-pointer z-20" 
                                  />
                                  {newItemImageUrl ? (
                                    <div className="space-y-3 relative z-10">
                                      <img src={newItemImageUrl} alt="Preview" className="max-h-48 mx-auto rounded-lg object-cover border border-[#BA9A5D]/20 shadow-md" />
                                      <div>
                                        <button 
                                          type="button" 
                                          onClick={() => setNewItemImageUrl("")} 
                                          className="text-[9px] uppercase tracking-widest font-black bg-red-950/45 hover:bg-red-950/60 text-red-400 hover:text-white px-3 py-1.5 rounded-full border border-red-500/20 transition-all cursor-pointer relative z-30"
                                        >
                                          Change Image
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-2 py-4">
                                      <div className="mx-auto h-10 w-10 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center group-hover:scale-105 transition-all">
                                        <Sliders className="h-4 w-4 text-[#BA9A5D]" />
                                      </div>
                                      <p className="text-[11px] text-zinc-300 font-semibold uppercase tracking-wider">Drag & drop image or Click to select</p>
                                      <p className="text-[9px] text-zinc-500 font-mono tracking-wide leading-relaxed">JPG, PNG, OR WEBP FORMATS SUPPORTED</p>
                                    </div>
                                  )}
                                </div>

                                <div className="mt-3">
                                  <label className="text-[8.5px] text-[#BA9A5D] font-bold uppercase tracking-widest block mb-1 font-mono">PRIMARY PICTURE LINK URL *</label>
                                  <input
                                    type="url"
                                    value={newItemImageUrl}
                                    onChange={(e) => setNewItemImageUrl(e.target.value)}
                                    placeholder="https://images.unsplash.com/photo-..."
                                    className="w-full bg-black/45 border border-white/10 focus:border-[#BA9A5D] text-xs px-3.5 py-2.5 rounded-xl text-[#DFCE9F] font-mono focus:outline-none transition-all placeholder:text-zinc-700"
                                  />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                  <div className="space-y-1.5 font-sans">
                                    <label className="text-[8.5px] text-zinc-500 font-bold uppercase tracking-widest block mb-1 font-mono">SECONDARY PICTURE URL / UPLOAD</label>
                                    <input
                                      type="url"
                                      value={newItemImageUrl2}
                                      onChange={(e) => setNewItemImageUrl2(e.target.value)}
                                      placeholder="https://images.unsplash.com/photo-..."
                                      className="w-full bg-black/45 border border-white/10 focus:border-[#BA9A5D] text-xs px-3 py-2.5 rounded-xl text-[#DFCE9F] font-mono focus:outline-none transition-all placeholder:text-zinc-700"
                                    />
                                    <div className="relative">
                                      <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) processExtraImageFile(file, 2);
                                        }}
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full text-[0px]"
                                      />
                                      <div className="text-[8px] uppercase tracking-widest text-center py-1.5 bg-white/[0.02] border border-dashed border-white/10 rounded-lg hover:bg-white/[0.05] cursor-pointer text-zinc-400 font-bold">
                                        Upload File 2
                                      </div>
                                    </div>
                                    {newItemImageUrl2.startsWith('data:image/') && (
                                      <span className="text-[8px] text-emerald-400 font-mono block font-bold">✓ File uploaded</span>
                                    )}
                                  </div>
                                  <div className="space-y-1.5 font-sans">
                                    <label className="text-[8.5px] text-zinc-500 font-bold uppercase tracking-widest block mb-1 font-mono">TERTIARY PICTURE URL / UPLOAD</label>
                                    <input
                                      type="url"
                                      value={newItemImageUrl3}
                                      onChange={(e) => setNewItemImageUrl3(e.target.value)}
                                      placeholder="https://images.unsplash.com/photo-..."
                                      className="w-full bg-black/45 border border-white/10 focus:border-[#BA9A5D] text-xs px-3 py-2.5 rounded-xl text-[#DFCE9F] font-mono focus:outline-none transition-all placeholder:text-zinc-700"
                                    />
                                    <div className="relative">
                                      <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) processExtraImageFile(file, 3);
                                        }}
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full text-[0px]"
                                      />
                                      <div className="text-[8px] uppercase tracking-widest text-center py-1.5 bg-white/[0.02] border border-dashed border-white/10 rounded-lg hover:bg-white/[0.05] cursor-pointer text-zinc-400 font-bold">
                                        Upload File 3
                                      </div>
                                    </div>
                                    {newItemImageUrl3.startsWith('data:image/') && (
                                      <span className="text-[8px] text-emerald-400 font-mono block font-bold">✓ File uploaded</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <label className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest block mb-1.5 font-mono">PRODUCT NUMBER *</label>
                                  <input
                                    type="text"
                                    required
                                    disabled={editingProduct !== null}
                                    value={newItemId}
                                    onChange={(e) => setNewItemId(e.target.value)}
                                    placeholder="e.g. gold-strappy-heels"
                                    className="w-full bg-black/45 border border-white/10 focus:border-[#BA9A5D] text-xs px-3.5 py-3 rounded-xl text-white font-mono focus:outline-none transition-all placeholder:text-zinc-700 disabled:opacity-40 disabled:hover:cursor-not-allowed"
                                  />
                                </div>

                                <div>
                                  <label className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest block mb-1.5 font-mono">HIGHLIGHT tag Badging</label>
                                  <input
                                    type="text"
                                    required
                                    value={newItemTag}
                                    onChange={(e) => setNewItemTag(e.target.value)}
                                    placeholder="e.g. Signature Slide, Limited Drop"
                                    className="w-full bg-black/45 border border-white/10 focus:border-[#BA9A5D] text-xs px-3.5 py-3 rounded-xl text-[#DFCE9F] focus:outline-none transition-all placeholder:text-zinc-700"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest block mb-1.5 font-mono">PRODUCT NAME *</label>
                                <input
                                  type="text"
                                  required
                                  value={newItemName}
                                  onChange={(e) => setNewItemName(e.target.value)}
                                  placeholder="e.g. Gold Strappy Heels"
                                  className="w-full bg-black/45 border border-white/10 focus:border-[#BA9A5D] text-xs px-3.5 py-3 rounded-xl text-white focus:outline-none transition-all placeholder:text-zinc-700"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest block mb-1.5 font-mono">PRODUCT CATEGORY *</label>
                                  <select
                                    value={newItemCategory}
                                    onChange={(e) => setNewItemCategory(e.target.value)}
                                    className="w-full bg-black/45 border border-white/10 focus:border-[#BA9A5D] text-xs px-3 py-3 rounded-xl text-white focus:outline-none transition-all cursor-pointer font-sans"
                                  >

                                    <option value="Heels" className="bg-[#05110c] text-white">👠 Heels</option>
                                    <option value="Slippers" className="bg-[#05110c] text-white">👡 Slippers</option>
                                    <option value="Bags" className="bg-[#05110c] text-white">👜 Bags</option>
                                    <option value="Accessories" className="bg-[#05110c] text-white">🧣 Accessories</option>
                                    <option value="New Arrivals" className="bg-[#05110c] text-white">✦ New Arrivals</option>
                                    <option value="Best Sellers" className="bg-[#05110c] text-white">⭐ Best Sellers</option>
                                    <option value="Dresses" className="bg-[#05110c] text-white">👗 Dresses</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest block mb-1.5 font-mono">PRICE (GHS PREFIX) *</label>
                                  <div className="relative flex items-center">
                                    <span className="absolute left-3.5 font-mono text-zinc-500 text-xs font-bold font-sans-luxury select-none">GHS</span>
                                    <input
                                      type="text"
                                      required
                                      value={newItemPrice}
                                      onChange={(e) => setNewItemPrice(e.target.value)}
                                      placeholder="350"
                                      className="w-full bg-black/45 border border-white/10 focus:border-[#BA9A5D] text-xs pl-12 pr-4 py-3 rounded-xl text-white font-mono focus:outline-none transition-all placeholder:text-zinc-700"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* LUXURY DESIGN PARAMETERS (SIZES, COLORS, MATERIALS, ETC) */}
                              <div className="p-4 rounded-xl border border-white/5 bg-black/35 space-y-4">
                                <span className="text-[8px] font-mono tracking-widest text-[#BA9A5D] font-bold uppercase block border-b border-white/5 pb-2">PRODUCT PARAMETERS</span>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                  <div>
                                    <label className="text-[8px] text-zinc-400 uppercase tracking-widest block mb-1 font-mono font-bold">Sizes Available (Commas)</label>
                                    <input
                                      type="text"
                                      value={newItemSizesStr}
                                      onChange={(e) => setNewItemSizesStr(e.target.value)}
                                      placeholder="e.g. 37, 38, 39, 40, 41, 42"
                                      className="w-full bg-black/40 border border-white/10 focus:border-[#BA9A5D] text-xs px-3 py-2.5 rounded-lg text-[#DFCE9F] focus:outline-none transition-all placeholder:text-zinc-700 font-mono"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[8px] text-zinc-400 uppercase tracking-widest block mb-1 font-mono font-bold">Colors / Tones (Commas)</label>
                                    <input
                                      type="text"
                                      value={newItemColorsStr}
                                      onChange={(e) => setNewItemColorsStr(e.target.value)}
                                      placeholder="e.g. Olive Green, Gilded Gold"
                                      className="w-full bg-black/40 border border-white/10 focus:border-[#BA9A5D] text-xs px-3 py-2.5 rounded-lg text-[#DFCE9F] focus:outline-none transition-all placeholder:text-zinc-700 font-mono"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <div>
                                    <label className="text-[8px] text-zinc-400 uppercase tracking-widest block mb-1 font-mono font-bold">MATERIAL COMPOSITION (OPTIONAL)</label>
                                    <input
                                      type="text"
                                      value={newItemMaterial}
                                      onChange={(e) => setNewItemMaterial(e.target.value)}
                                      placeholder="e.g. Handcrafted High Grade Italian Suede"
                                      className="w-full bg-black/40 border border-white/10 focus:border-[#BA9A5D] text-xs px-3 py-2.5 rounded-lg text-white focus:outline-none transition-all placeholder:text-zinc-700"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[8px] text-zinc-400 uppercase tracking-widest block mb-1 font-mono font-bold">EDITORIAL STYLING SUGGESTIONS (OPTIONAL)</label>
                                    <input
                                      type="text"
                                      value={newItemStyling}
                                      onChange={(e) => setNewItemStyling(e.target.value)}
                                      placeholder="e.g. Wear with our emerald velvet satin kaftan robes"
                                      className="w-full bg-black/40 border border-white/10 focus:border-[#BA9A5D] text-xs px-3 py-2.5 rounded-lg text-white focus:outline-none transition-all placeholder:text-zinc-700"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Toggles Strip */}
                              <div className="grid grid-cols-2 gap-4 p-3 rounded-xl border border-white/5 bg-black/20">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] text-zinc-400 font-mono tracking-wider font-bold">STOCK STATE</span>
                                  <button
                                    type="button"
                                    onClick={() => setNewItemInStock(!newItemInStock)}
                                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                                      newItemInStock ? 'bg-emerald-500' : 'bg-zinc-800'
                                    }`}
                                  >
                                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                      newItemInStock ? 'translate-x-5' : 'translate-x-0'
                                    }`} />
                                  </button>
                                </div>

                                <div className="flex items-center justify-between border-l border-white/5 pl-4">
                                  <span className="text-[9px] text-zinc-400 font-mono tracking-wider font-bold">FEATURE first</span>
                                  <button
                                    type="button"
                                    onClick={() => setNewItemFeatured(!newItemFeatured)}
                                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                                      newItemFeatured ? 'bg-[#BA9A5D]' : 'bg-zinc-800'
                                    }`}
                                  >
                                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                      newItemFeatured ? 'translate-x-5' : 'translate-x-0'
                                    }`} />
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest block mb-1.5 font-mono">PRODUCT DESCRIPTION *</label>
                                <textarea
                                  rows={3}
                                  required
                                  value={newItemDescription}
                                  onChange={(e) => setNewItemDescription(e.target.value)}
                                  placeholder="Describe material, style, occasion, cut, fit, heel height, lining, leather..."
                                  className="w-full bg-black/45 border border-white/10 focus:border-[#BA9A5D] text-xs p-3.5 rounded-xl text-white focus:outline-none transition-all placeholder:text-zinc-600 resize-none leading-relaxed"
                                />
                              </div>
                            </div>

                            {/* Submission Controls */}
                            <div className="mt-6 flex flex-col gap-3">
                              <button
                                type="submit"
                                disabled={loading || imageUploadLoading}
                                className="w-full rounded-full bg-gradient-to-r from-[#BA9A5D] via-[#FFEBB5] to-[#DFCE9F] hover:shadow-[0_0_20px_rgba(186,154,93,0.25)] text-zinc-950 font-bold text-[10px] uppercase tracking-widest py-3.5 hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                {loading || imageUploadLoading ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-zinc-950" />
                                ) : editingProduct ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Plus className="h-4 w-4" />
                                )}
                                <span>{editingProduct ? 'UPDATE PRODUCT' : 'ADD TO STORE'}</span>
                              </button>

                              {editingProduct && (
                                <button
                                  type="button"
                                  onClick={cancelEditingMode}
                                  className="w-full rounded-full border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20 text-zinc-400 hover:text-white font-semibold text-[10px] uppercase tracking-widest py-2.5 cursor-pointer transition-colors"
                                >
                                  Cancel Editing Mode
                                </button>
                              )}
                            </div>
                          </div>
                        </form>

                          {/* Right Column: Active Products Lookbook dynamic Catalog list */}
                          <div className="lg:col-span-7 space-y-6">
                            <div className="flex justify-between items-center pb-3 border-b border-white/5">
                              <div>
                                <h3 className="font-sans text-xs font-black text-white uppercase tracking-widest">
                                  AVAILABLE PRODUCTS
                                </h3>
                                <p className="text-[11px] text-zinc-500 font-light mt-0.5">These pieces render dynamically over the homepage model showcases.</p>
                              </div>
                              <span className="font-mono text-[10px] text-[#BA9A5D] bg-[#BA9A5D]/5 border border-[#BA9A5D]/25 px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold">
                                {sortedItems.length} Shown / {items.length} Total
                              </span>
                            </div>

                            {sortedItems.length === 0 ? (
                              <div className="p-16 text-center border border-white/[0.03] bg-white/[0.01] rounded-2xl max-w-sm mx-auto font-sans-luxury">
                                <Layers className="mx-auto h-8 w-8 text-zinc-600 mb-2.5 animate-bounce" />
                                <h4 className="text-sm font-semibold text-white uppercase tracking-wider">No Products Found</h4>
                                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">No database records matched your search parameters. Try clearing your queries or register and upload products.</p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {sortedItems.map(item => {
                                  const isCurrentlyEditing = editingProduct?.id === item.id;
                                  // Construct price formatting nicely with GHS label if not already formatted
                                  const formattedPrice = item.price.toUpperCase().startsWith('GHS') || item.price.startsWith('$')
                                    ? item.price 
                                    : `GHS ${item.price}`;
                                  
                                  // Select image url with custom Unsplash placeholder fallback based on category if blank!
                                  const displayImageUrl = item.imageUrl || getCategoryPlaceholder(item.category);

                                  return (
                                    <div 
                                      key={item.id} 
                                      className={`group/item relative rounded-2xl p-[1px] transition-all duration-300 flex flex-col justify-between overflow-hidden bg-gradient-to-br ${
                                        isCurrentlyEditing 
                                          ? 'from-[#DFCE9F] via-[#BA9A5D] to-[#DFCE9F] shadow-[0_0_25px_rgba(186,154,93,0.35)] scale-[1.01]' 
                                          : 'from-white/10 via-[#BA9A5D]/10 to-transparent hover:from-[#DFCE9F]/50 hover:via-[#BA9A5D]/30 hover:to-transparent hover:shadow-[0_0_20px_rgba(186,154,93,0.15)] shadow-md'
                                      }`}
                                    >
                                      <div className="bg-[#040e0a]/95 rounded-[15px] overflow-hidden flex flex-col justify-between h-full w-full relative">
                                        {/* Golden Line highlight inside box item */}
                                        <div className="absolute top-0 right-0 left-0 h-[1.5px] rounded-t-2xl bg-gradient-to-r from-transparent via-[#BA9A5D]/40 to-transparent" />
                                        
                                        {/* Product Visual Container Frame */}
                                        <div className="relative h-48 w-full bg-black/45 overflow-hidden">
                                          <img 
                                            src={displayImageUrl} 
                                            alt={item.name} 
                                            referrerPolicy="no-referrer"
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover/item:scale-[1.03]" 
                                          />

                                          {/* Availability overlays overlay */}
                                          {item.inStock === false && (
                                            <div className="absolute inset-0 bg-black/75 backdrop-blur-[1px] flex items-center justify-center p-4">
                                              <span className="text-[10px] tracking-widest uppercase font-black px-4 py-2 bg-red-950/80 text-red-400 rounded-full border border-red-500/30 shadow-md">
                                                Out of Stock
                                              </span>
                                            </div>
                                          )}

                                          {/* Category pill indicator overlay */}
                                          <div className="absolute top-3 left-3 flex gap-2">
                                            <span className="font-mono text-[8px] text-[#BA9A5D] uppercase tracking-wider bg-black/85 border border-[#BA9A5D]/20 px-3 py-1 rounded-full font-bold shadow-md">
                                              {item.category}
                                            </span>
                                          </div>

                                          {/* Featured badge overlay */}
                                          {item.featured && (
                                            <div className="absolute top-3 right-3">
                                              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-[#BA9A5D] text-zinc-950 shadow-md border border-zinc-950/20" title="Featured Lookbook Item">
                                                👑
                                              </span>
                                            </div>
                                          )}

                                          {/* Hover mapping coordinates overlay */}
                                          <div className="absolute bottom-3 left-3 font-mono text-[8.5px] text-zinc-300 bg-black/80 border border-white/5 px-2.5 py-1 rounded-md shadow-xs">
                                            ID: {item.id} &nbsp;({item.x}, {item.y})
                                          </div>
                                        </div>

                                        {/* Item Description metadata */}
                                        <div className="p-4 flex-1 flex flex-col justify-between">
                                          <div className="space-y-2">
                                            <div>
                                              <h4 className="font-sans text-xs font-black uppercase tracking-widest text-white leading-snug line-clamp-1">{item.name}</h4>
                                              <p className="font-mono text-[8.5px] text-[#BA9A5D] uppercase tracking-widest font-semibold mt-0.5">{item.tag}</p>
                                            </div>
                                            
                                            <p className="text-zinc-400 text-xs font-light leading-relaxed line-clamp-2">
                                              {item.description}
                                            </p>
                                          </div>

                                          <div className="flex justify-between items-center pt-3 border-t border-white/5 mt-4">
                                            <span className="font-sans font-extrabold text-xs text-[#DFCE9F] tracking-widest">{formattedPrice}</span>
                                            
                                            <div className="flex gap-1.5">
                                              <button
                                                type="button"
                                                onClick={() => initiateEditProduct(item)}
                                                className="p-2 border border-white/5 bg-white/[0.02] hover:bg-white/[0.08] hover:border-[#BA9A5D]/40 text-[#DFCE9F] hover:text-white rounded-lg transition-colors cursor-pointer"
                                                title="Customize details"
                                              >
                                                <Edit2 className="h-3.5 w-3.5" />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => setProductToDelete(item)}
                                                className="p-2 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 text-red-300 hover:text-red-200 rounded-lg transition-colors cursor-pointer"
                                                title="Trash lookbook item"
                                              >
                                                <Trash2 className="h-3.5 w-3.5" />
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                        </div>

                      </div>
                    );
                  })()}

                  {/* CONTENT VIEW B: SHOPPER ORDER EXPLORER */}
                  {activeTab === 'orders' && (
                    <div className="space-y-6 font-sans">
                      <div className="flex justify-between items-center pb-3 border-b border-white/5">
                        <div>
                          <h3 className="font-sans text-xs font-black text-glow-gold uppercase tracking-widest text-[#BA9A5D]">
                            ⚜️ Bespoke Order Management ⚜️
                          </h3>
                          <p className="text-[11px] text-zinc-500 font-light mt-0.5">Approve fitting sessions, filter submissions, track live coordinate progress, and update status in real-time.</p>
                        </div>
                        <span className="font-mono text-[10px] text-[#BA9A5D] bg-[#BA9A5D]/5 border border-[#BA9A5D]/25 px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold">
                          {totalOrdersCount} Total Filed
                        </span>
                      </div>

                      {orders.length === 0 ? (
                        <div className="p-16 text-center border border-white/[0.03] bg-white/[0.01] rounded-2xl max-w-sm mx-auto font-sans-luxury">
                          <ShoppingBag className="mx-auto h-8 w-8 text-zinc-600 mb-2.5" />
                          <h4 className="text-sm font-semibold text-white uppercase tracking-wider">No Orders Registered</h4>
                          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">Shopper allocations list empty. Fill out checkouts inside the store bag panel to submit requests.</p>
                        </div>
                      ) : (
                        <div className="space-y-5">
                          {/* 1. FILTER & CONTROL CENTER */}
                          <div className="bg-[#030b08]/90 border border-white/[0.05] rounded-2xl p-5 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Search Input bar */}
                              <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                                  <Search className="h-3.5 w-3.5 text-[#BA9A5D]/60" />
                                </span>
                                <input
                                  type="text"
                                  value={orderSearchQuery}
                                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                                  className="w-full bg-black/60 border border-white/5 hover:border-[#BA9A5D]/30 focus:border-[#BA9A5D] text-[10px] font-mono tracking-widest text-[#DFCE9F] placeholder-zinc-500 rounded-lg pl-9 pr-12 py-2.5 focus:outline-none transition-all uppercase"
                                  placeholder="SEARCH BY ID, CLIENT NAME, PHONE, AREA, OR ITEM..."
                                />
                                {orderSearchQuery && (
                                  <button 
                                    onClick={() => setOrderSearchQuery("")}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-400 hover:text-[#BA9A5D] text-[9px] font-mono uppercase font-bold cursor-pointer transition-colors"
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>

                              {/* Customer Filter Dropdown Selection */}
                              <div className="relative">
                                <select
                                  value={selectedCustomerFilter}
                                  onChange={(e) => setSelectedCustomerFilter(e.target.value)}
                                  className="w-full bg-black/60 border border-white/5 hover:border-[#BA9A5D]/30 focus:border-[#BA9A5D] text-[10px] font-mono tracking-widest text-[#DFCE9F] rounded-lg px-4 py-2.5 focus:outline-none transition-all appearance-none cursor-pointer uppercase pr-10"
                                >
                                  <option value="All">✦ ALL ACCOUNTS & CUSTOMERS ✦</option>
                                  {Array.from(new Set(orders.map(o => o.clientName || o.email || "VIP Guest").filter(Boolean))).map((customerName: any) => (
                                    <option key={customerName} value={customerName}>
                                      👤 {String(customerName).toUpperCase()}
                                    </option>
                                  ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#BA9A5D]">
                                  <Sliders className="h-3.5 w-3.5" />
                                </div>
                              </div>
                            </div>

                            {/* Status Segmented Tabs with Counters */}
                            <div className="flex border-t border-white/[0.04] pt-4 flex-wrap items-center justify-between gap-4 font-sans">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[9px] font-sans tracking-widest text-[#BA9A5D] uppercase mr-1 shrink-0 font-bold">ORDER TRACKING:</span>
                                {[
                                  { label: "All", value: "All", count: orders.length },
                                  { label: "Submitted", value: "pending", count: orders.filter(o => o.status === "pending" || o.status === "submitted").length },
                                  { label: "Recived", value: "assigned", count: orders.filter(o => o.status === "assigned" || o.status === "received" || o.status === "recived").length },
                                  { label: "Packaged", value: "shipped", count: orders.filter(o => o.status === "shipped" || o.status === "packaged").length },
                                  { label: "Delivered", value: "completed", count: orders.filter(o => o.status === "completed" || o.status === "delivered").length }
                                ].map(statusTab => (
                                  <button
                                    key={statusTab.value}
                                    onClick={() => setSelectedStatusFilter(statusTab.value)}
                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-wider font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                                      selectedStatusFilter === statusTab.value
                                        ? 'bg-[#BA9A5D] border-[#BA9A5D] text-zinc-950 font-black shadow-md shadow-amber-500/10'
                                        : 'bg-black/40 border-white/5 hover:border-white/20 text-zinc-400 hover:text-white'
                                    }`}
                                  >
                                    <span>{statusTab.label}</span>
                                    <span className={`text-[8px] font-black rounded px-1.5 py-0.5 ${
                                      selectedStatusFilter === statusTab.value
                                        ? 'bg-zinc-950/20 text-zinc-950'
                                        : 'bg-white/5 text-[#BA9A5D]'
                                    }`}>
                                      {statusTab.count}
                                    </span>
                                  </button>
                                ))}
                              </div>

                              {/* Clearing Active filters indicator */}
                              {(orderSearchQuery || selectedCustomerFilter !== "All" || selectedStatusFilter !== "All") && (
                                <button
                                  onClick={() => {
                                    setOrderSearchQuery("");
                                    setSelectedCustomerFilter("All");
                                    setSelectedStatusFilter("All");
                                  }}
                                  className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#BA9A5D] hover:text-[#FFEBB5] cursor-pointer flex items-center gap-1.5 transition-colors"
                                >
                                  <RefreshCw className="h-3 w-3" /> Clear filters
                                </button>
                              )}
                            </div>
                          </div>

                          {(() => {
                            const filteredOrders = orders.filter(order => {
                              // 1. Search Query Match
                              const q = orderSearchQuery.toLowerCase().trim();
                              const matchesSearch = !q ? true : (
                                order.id?.toLowerCase().includes(q) ||
                                order.clientName?.toLowerCase().includes(q) ||
                                order.email?.toLowerCase().includes(q) ||
                                (order.clientPhone || order.phone)?.toLowerCase().includes(q) ||
                                (order.clientLocation || order.address)?.toLowerCase().includes(q) ||
                                order.preferredBranch?.toLowerCase().includes(q) ||
                                order.items?.some((it: any) => it.name?.toLowerCase().includes(q) || it.category?.toLowerCase().includes(q))
                              );

                              // 2. Customer Filter Match
                              const customerName = order.clientName || order.email || "VIP Guest";
                              const matchesCustomer = selectedCustomerFilter === "All" || customerName === selectedCustomerFilter;

                              // 3. Status Filter Match
                              let matchesStatus = false;
                              const normFilter = (selectedStatusFilter || 'All').toLowerCase();
                              const normStatus = (order.status || '').toLowerCase();
                              if (normFilter === 'all') {
                                matchesStatus = true;
                              } else if (normFilter === 'pending') {
                                matchesStatus = normStatus === 'pending' || normStatus === 'submitted';
                              } else if (normFilter === 'assigned') {
                                matchesStatus = normStatus === 'assigned' || normStatus === 'received' || normStatus === 'recived';
                              } else if (normFilter === 'shipped') {
                                matchesStatus = normStatus === 'shipped' || normStatus === 'packaged';
                              } else if (normFilter === 'completed') {
                                matchesStatus = normStatus === 'completed' || normStatus === 'delivered';
                              } else {
                                matchesStatus = normStatus === normFilter;
                              }

                              return matchesSearch && matchesCustomer && matchesStatus;
                            });

                            if (filteredOrders.length === 0) {
                              return (
                                <div className="p-16 text-center border border-white/[0.03] bg-white/[0.01] rounded-2xl max-w-sm mx-auto font-mono">
                                  <AlertTriangle className="mx-auto h-5 w-5 text-zinc-500 mb-2.5" />
                                  <p className="text-[#DFCE9F] text-[10px] uppercase tracking-widest font-black">No matching records found</p>
                                  <p className="text-[9px] text-zinc-400 mt-1.5 leading-relaxed">No orders registered details matched your active filters or queries. Reset filters or queries above.</p>
                                </div>
                              );
                            }

                            // Calculate metrics
                            const matchedRevenue = filteredOrders.reduce((sum, o) => {
                              let valStr = String(o.total || "0").replace(/[^0-9.]/g, '');
                              const numeric = parseFloat(valStr) || 0;
                              return sum + numeric;
                            }, 0);

                            return (
                              <div className="space-y-4">
                                {/* Query Metadata header stats block */}
                                <div className="flex justify-between items-center bg-white/[0.02] border border-white/[0.04] rounded-lg px-4 py-2.5 font-mono text-[9px] uppercase tracking-widest text-[#DFCE9F]">
                                  <span>Showing {filteredOrders.length} of {orders.length} orders matched</span>
                                  <span className="font-sans text-[#BA9A5D] font-bold">Summing Subtotal: GHS {matchedRevenue.toLocaleString()}</span>
                                </div>

                                <div className="grid grid-cols-1 gap-5">
                                {filteredOrders.map(order => {
                                  const isPending = order.status === 'pending' || order.status === 'submitted';
                                  return (
                                    <div 
                                      key={order.id} 
                                      className={`group/order p-[1px] rounded-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden bg-gradient-to-br ${
                                        isPending 
                                          ? 'from-[#DFCE9F] via-[#BA9A5D]/40 to-transparent hover:via-[#BA9A5D] shadow-[0_0_15px_rgba(186,154,93,0.12)] hover:shadow-[0_0_25px_rgba(186,154,93,0.22)] shadow-md' 
                                          : 'from-white/10 to-transparent shadow-md'
                                      }`}
                                    >
                                <div className="bg-[#040e0a]/95 rounded-[15px] p-6 flex flex-col md:flex-row justify-between gap-6 w-full relative">
                              <div className="space-y-3.5 flex-1">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                  <span className="font-mono text-[9px] bg-black/45 hover:bg-black/60 border border-white/5 text-[#BA9A5D] px-3 py-1 rounded-md uppercase tracking-widest font-black">
                                    ORDER ID &nbsp;#{order.id.slice(0, 10).toUpperCase()}
                                  </span>
                                  
                                  {/* Dynamic status colored indicators */}
                                  <span className={`text-[8.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                                    (order.status === 'submitted' || order.status === 'pending')
                                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                                      : (order.status === 'received' || order.status === 'recived' || order.status === 'assigned')
                                      ? 'bg-blue-500/10 text-blue-300 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]'
                                      : (order.status === 'packaged' || order.status === 'shipped')
                                      ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20 shadow-[0_0_10px_rgba(100,116,139,0.1)]'
                                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                                  }`}>
                                    Status: {order.status === 'recived' ? 'received' : order.status}
                                  </span>

                                  <span className="text-[10px] font-mono text-zinc-500 font-medium">
                                    ✦ {order.createdAt?.seconds 
                                      ? new Date(order.createdAt.seconds * 1000).toLocaleString()
                                      : new Date(order.createdAt).toLocaleString()}
                                  </span>
                                </div>

                                {/* Dynamic Status Tracking Stepper Timeline */}
                                <div className="bg-black/35 border border-white/[0.04] p-5 rounded-xl mt-1 space-y-4 font-sans">
                                  <div className="flex justify-between items-center text-[11px] sm:text-xs tracking-wider uppercase font-sans">
                                    <span className="text-[#BA9A5D] tracking-widest font-black">Order status tracking phase</span>
                                    <span className="text-[#DFCE9F] font-black uppercase">
                                      {(order.status === 'delivered' || order.status === 'completed') 
                                        ? 'Delivered & Completed ✓' 
                                        : (order.status === 'packaged' || order.status === 'shipped') 
                                        ? 'Packaged (Ready for dispatch) 📦' 
                                        : (order.status === 'received' || order.status === 'recived' || order.status === 'assigned') 
                                        ? 'Recived & Acknowledged ✦' 
                                        : 'Submitted (Awaiting Review)'}
                                    </span>
                                  </div>

                                  {/* 4-Step Stepper Line */}
                                  <div className="relative flex items-center justify-between w-full pt-2 pb-3">
                                    {/* Connection background line */}
                                    <div className="absolute left-0 right-0 top-1/2 h-[2px] bg-white/5 -translate-y-1/2 z-0" />
                                    <div 
                                      className="absolute left-0 top-1/2 h-[2px] bg-gradient-to-r from-amber-500 via-blue-500 via-indigo-500 to-emerald-500 -translate-y-1/2 transition-all duration-500 z-0"
                                      style={{
                                        width: (order.status === 'delivered' || order.status === 'completed') ? '100%' : (order.status === 'packaged' || order.status === 'shipped') ? '66%' : (order.status === 'received' || order.status === 'recived' || order.status === 'assigned') ? '33%' : '0%'
                                      }}
                                    />

                                    {/* Step 1: Submitted */}
                                    <div className="relative z-10 flex flex-col items-center">
                                      <div className="h-8 w-8 rounded-full border bg-amber-500 border-amber-400 text-zinc-950 font-sans font-extrabold text-xs flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.3)]">
                                        ✓
                                      </div>
                                      <span className="text-[10px] sm:text-xs font-sans uppercase tracking-widest text-[#FFEBB5] font-black mt-2">Submitted</span>
                                    </div>

                                    {/* Step 2: Recived */}
                                    <div className="relative z-10 flex flex-col items-center">
                                      <div className={`h-8 w-8 rounded-full border font-sans font-extrabold text-xs flex items-center justify-center transition-all duration-300 ${
                                        (order.status === 'received' || order.status === 'recived' || order.status === 'assigned' || order.status === 'packaged' || order.status === 'shipped' || order.status === 'delivered' || order.status === 'completed')
                                          ? 'bg-blue-500 border-blue-400 text-zinc-950 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                                          : 'bg-zinc-900 border-white/10 text-zinc-505'
                                      }`}>
                                        {(order.status === 'packaged' || order.status === 'shipped' || order.status === 'delivered' || order.status === 'completed') ? '✓' : '2'}
                                      </div>
                                      <span className={`text-[10px] sm:text-xs font-sans uppercase tracking-widest font-black mt-2 transition-colors ${
                                        (order.status === 'received' || order.status === 'recived' || order.status === 'assigned' || order.status === 'packaged' || order.status === 'shipped' || order.status === 'delivered' || order.status === 'completed') ? 'text-blue-300' : 'text-zinc-600'
                                      }`}>Recived</span>
                                    </div>

                                    {/* Step 3: Packaged */}
                                    <div className="relative z-10 flex flex-col items-center">
                                      <div className={`h-8 w-8 rounded-full border font-sans font-extrabold text-xs flex items-center justify-center transition-all duration-300 ${
                                        (order.status === 'packaged' || order.status === 'shipped' || order.status === 'delivered' || order.status === 'completed')
                                          ? 'bg-indigo-500 border-indigo-400 text-zinc-950 shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                                          : 'bg-zinc-900 border-white/10 text-zinc-505'
                                      }`}>
                                        {(order.status === 'delivered' || order.status === 'completed') ? '✓' : '3'}
                                      </div>
                                      <span className={`text-[10px] sm:text-xs font-sans uppercase tracking-widest font-black mt-2 transition-colors ${
                                        (order.status === 'packaged' || order.status === 'shipped' || order.status === 'delivered' || order.status === 'completed') ? 'text-indigo-300' : 'text-[#DFCE9F]'
                                      }`}>Packaged</span>
                                    </div>

                                    {/* Step 4: Delivered */}
                                    <div className="relative z-10 flex flex-col items-center">
                                      <div className={`h-8 w-8 rounded-full border font-sans font-extrabold text-xs flex items-center justify-center transition-all duration-300 ${
                                        (order.status === 'delivered' || order.status === 'completed')
                                          ? 'bg-emerald-500 border-emerald-400 text-zinc-950 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                                          : 'bg-zinc-900 border-white/10 text-zinc-505'
                                      }`}>
                                        4
                                      </div>
                                      <span className={`text-[10px] sm:text-xs font-sans uppercase tracking-widest font-black mt-2 transition-colors ${
                                        (order.status === 'delivered' || order.status === 'completed') ? 'text-emerald-400' : 'text-zinc-600'
                                      }`}>Delivered</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/5 pt-3.5">
                                  <div>
                                    <span className="text-[9px] font-mono tracking-widest text-[#BA9A5D] uppercase block font-bold">CURATOR CLIENT METADATA</span>
                                    <p className="text-white text-xs mt-1.5 font-bold">Client: &nbsp;<span className="text-zinc-200 font-semibold">{order.clientName || order.email || 'VIP Guest'}</span></p>
                                    <p className="text-zinc-400 text-xs mt-1">Phone / WhatsApp: &nbsp;<span className="font-mono text-[#DFCE9F] font-black">{order.clientPhone || order.phone || 'COUT-DIRECT'}</span></p>
                                    <p className="text-zinc-400 text-xs mt-1">Fitting Location: &nbsp;<span className="text-zinc-200">{order.clientLocation || order.address || 'Complementary Store Pickup'}</span></p>
                                  </div>

                                  <div>
                                    <span className="text-[9px] font-mono tracking-widest text-[#BA9A5D] uppercase block mb-1.5 font-bold">BAG COMMISSION FITMENTS</span>
                                    <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                                      {order.items?.map((p: any, idx: number) => (
                                        <div key={idx} className="flex gap-2 items-start text-xs rounded-lg bg-black/20 p-2 border border-white/[0.03]">
                                          <CornerDownRight className="h-3 w-3 text-[#BA9A5D]/60 shrink-0 mt-0.5" />
                                          <div className="flex-1">
                                            <p className="text-white font-semibold leading-none">{p.name}</p>
                                            <p className="text-[#BA9A5D] font-mono text-[10px] uppercase tracking-wide mt-1 leading-none">{p.category} &nbsp;({p.price})</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Fulfillment operations status togglers */}
                              <div className="flex flex-row md:flex-col justify-between items-end gap-4 min-w-[200px] border-l border-white/5 pl-0 md:pl-6 pt-4 md:pt-0 shrink-0 select-none font-sans">
                                <div className="text-left md:text-right">
                                  <span className="text-[9px] text-[#BA9A5D] uppercase tracking-widest block leading-none font-sans font-black">Commission Subtotal</span>
                                  <span className="font-sans text-lg font-extrabold text-[#DFCE9F] tracking-widest block mt-1.5">
                                    {order.total?.toString().startsWith('$') || order.total?.toString().startsWith('GHS') 
                                      ? order.total 
                                      : `GHS ${order.total?.toLocaleString() || '18,500'}`}
                                  </span>
                                </div>

                                <div className="flex gap-2 w-full md:w-auto font-sans">
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order.id, order.status)}
                                    disabled={order.status === 'delivered' || order.status === 'completed'}
                                    className={`rounded-full px-4 py-2.5 font-sans text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all ${
                                      (order.status === 'submitted' || order.status === 'pending')
                                        ? 'bg-[#BA9A5D] hover:bg-[#FFEBB5] text-zinc-950 shadow-md hover:scale-[1.02]'
                                        : (order.status === 'received' || order.status === 'recived' || order.status === 'assigned')
                                        ? 'bg-blue-500 hover:bg-blue-400 text-zinc-950 shadow-md hover:scale-[1.02]'
                                        : (order.status === 'packaged' || order.status === 'shipped')
                                        ? 'bg-indigo-500 hover:bg-[#9FA8DA] text-zinc-950 shadow-md hover:scale-[1.02]'
                                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
                                    }`}
                                  >
                                    {(order.status === 'submitted' || order.status === 'pending') 
                                      ? '✦ Mark Recived' 
                                      : (order.status === 'received' || order.status === 'recived' || order.status === 'assigned') 
                                      ? '📦 Mark Packaged' 
                                      : (order.status === 'packaged' || order.status === 'shipped') 
                                      ? '✓ Mark Delivered' 
                                      : '✓ Completed'}
                                  </button>

                                  <button
                                    onClick={() => {
                                      setReceiptOrder(order);
                                      setEmailSuccessSent(null);
                                    }}
                                    className="p-2.5 bg-[#BA9A5D]/15 hover:bg-[#BA9A5D]/30 border border-[#BA9A5D]/25 text-[#DFCE9F] hover:text-white rounded-full transition-all cursor-pointer flex items-center justify-center shadow-lg"
                                    title="Open Customer Receipt & Dispatch Hub"
                                  >
                                    <Mail className="h-4 w-4" />
                                  </button>

                                  <button
                                    onClick={() => handleDeleteOrder(order.id)}
                                    className="p-2.5 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 text-red-305 hover:text-red-300 rounded-full transition-colors cursor-pointer"
                                    title="Purge order request"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>

                            </div>
                          </div>
                        );
                      })}
                              </div>
                            </div>
                          );
                        })()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* CONTENT VIEW C: useRs */}
                  {activeTab === 'newsletter' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center pb-3 border-b border-white/5">
                        <div>
                          <h3 className="font-sans text-xs font-black text-glow-gold uppercase tracking-widest text-[#BA9A5D]">
                            useRs
                          </h3>
                          <p className="text-[11px] text-zinc-500 font-light mt-0.5 font-sans">Details of any individual who logged into the system as a guest, as a client.</p>
                        </div>
                        <span className="font-mono text-[10px] text-[#BA9A5D] bg-[#BA9A5D]/5 border border-[#BA9A5D]/25 px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold font-bold">
                          {profiles.length} Registered Individuals
                        </span>
                      </div>

                      {profiles.length === 0 ? (
                        <div className="p-16 text-center border border-white/[0.03] bg-white/[0.01] rounded-2xl max-w-sm mx-auto font-sans-luxury">
                          <User className="mx-auto h-8 w-8 text-zinc-600 mb-2.5 animate-pulse" />
                          <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Empty Directory</h4>
                          <p className="text-xs text-zinc-400 mt-1 leading-relaxed font-sans">No users have registered or logged into the system yet.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {profiles.map(profile => {
                            const isPending = profile.membershipRequest === 'pending';
                            const isActiveMember = profile.membershipStatus === 'active' || profile.membershipRequest === 'active';
                            
                            const approveMembership = async () => {
                              try {
                                await updateDoc(doc(db, 'profiles', profile.id), {
                                  membershipStatus: 'active',
                                  membershipRequest: 'active'
                                });
                                setStatusMessage(`VIP membership approved successfully for ${profile.username || 'Client'}!`);
                              } catch (err) {
                                console.error(err);
                                setErrorMessage("Could not update membership status.");
                              }
                            };

                            const deleteUserProfile = async () => {
                              if (window.confirm(`Are you sure you want to delete profile for ${profile.username || profile.email}?`)) {
                                try {
                                  await deleteDoc(doc(db, 'profiles', profile.id));
                                  setStatusMessage(`Profile deleted successfully.`);
                                } catch (err) {
                                  console.error(err);
                                  setErrorMessage("Could not delete user profile.");
                                }
                              }
                            };

                            const whatsappLink = profile.phone 
                              ? `https://wa.me/${profile.phone.replace(/[^0-9]/g, '')}`
                              : '';

                            return (
                              <div 
                                key={profile.id}
                                className="p-5 rounded-2xl border border-white/5 bg-black/40 hover:border-[#BA9A5D]/30 transition-all flex flex-col justify-between gap-4"
                              >
                                <div className="space-y-3">
                                  <div className="flex justify-between items-start gap-2">
                                    <div>
                                      <h4 className="font-sans text-xs font-black uppercase text-white tracking-wider">
                                        {profile.username || 'Anonymous User'}
                                      </h4>
                                      <p className="text-[10px] text-zinc-500 font-mono">{profile.email}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5">
                                      {isActiveMember ? (
                                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest font-mono">
                                          Active Club Member
                                        </span>
                                      ) : isPending ? (
                                        <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 uppercase tracking-widest animate-pulse font-mono">
                                          Requesting Access
                                        </span>
                                      ) : (
                                        <span className="text-[9px] font-bold text-zinc-500 bg-white/5 px-2.5 py-1 rounded-full border border-white/10 uppercase tracking-widest font-mono">
                                          Guest User
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono p-3 bg-black/35 rounded-xl border border-white/5">
                                    <div>
                                      <span className="text-zinc-600 block text-[8px] uppercase tracking-wider font-bold">Contact Phone</span>
                                      <span className="text-zinc-300 font-semibold">{profile.phone || 'Not provided'}</span>
                                    </div>
                                    <div>
                                      <span className="text-zinc-600 block text-[8px] uppercase tracking-wider font-bold">Maison Branch</span>
                                      <span className="text-[#BA9A5D] font-semibold truncate block">{profile.branch || 'Not set'}</span>
                                    </div>
                                    <div className="col-span-2 pt-1.5 border-t border-white/5 mt-1">
                                      <span className="text-zinc-600 block text-[8px] uppercase tracking-wider font-bold">Client Location Coordinate</span>
                                      <span className="text-zinc-300 truncate block">{profile.location || 'Not provided'}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-2 justify-end pt-2 border-t border-white/5">
                                  <button
                                    onClick={deleteUserProfile}
                                    title="Delete/Remove user profile entry"
                                    className="p-2 text-red-400 hover:text-red-500 hover:bg-red-500/10 border border-white/5 bg-white/[0.01] hover:border-red-500/20 transition-all rounded-xl cursor-pointer"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>

                                  {whatsappLink && (
                                    <span className="inline-block">
                                      <a
                                        href={whatsappLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-3.5 py-2 hover:bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:text-white rounded-xl text-[10px] font-mono tracking-wider font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                      >
                                        Chat WhatsApp
                                      </a>
                                    </span>
                                  )}

                                  {(isPending || !isActiveMember) && (
                                    <button
                                      onClick={approveMembership}
                                      className="px-4 py-2 bg-gradient-to-r from-[#DFCE9F] to-[#BA9A5D] text-zinc-950 hover:shadow-[0_0_15px_rgba(186,154,93,0.3)] rounded-xl text-[10px] tracking-wider font-bold uppercase transition-all cursor-pointer"
                                    >
                                      Approve Member
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* CONTENT VIEW E: BESPOKE OPERATOR LOGISTICS & SETTINGS */}
                  {activeTab === 'admin-profile' && (
                    <div className="max-w-xl mx-auto bg-black/35 border border-white/5 rounded-3xl p-6 sm:p-8 space-y-6">
                      <div className="space-y-1 pb-4 border-b border-white/5">
                        <h3 className="font-sans text-xs font-black text-glow-gold uppercase tracking-widest text-[#BA9A5D]">
                          Operator Identity settings
                        </h3>
                        <p className="text-[11px] text-zinc-500 font-light mt-0.5">Customize your Operator workspace display badge, registered phone/WhatsApp, location coordinates, and active salon branch.</p>
                      </div>

                      <form 
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (!user) return;
                          setIsAdminSaving(true);
                          setErrorMessage("");
                          setStatusMessage("");
                          try {
                            await setDoc(doc(db, 'profiles', user.uid), {
                              username: adminUsername,
                              phone: adminPhone,
                              location: adminLocation,
                              email: user.email,
                              role: 'admin',
                              updatedAt: new Date()
                            }, { merge: true });
                            setStatusMessage("Your Operator profile coordinates have been successfully synchronized across the system.");
                          } catch (err: any) {
                            console.error(err);
                            setErrorMessage(err.message || "Failed to update profile coordinates.");
                          } finally {
                            setIsAdminSaving(false);
                          }
                        }}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[9px] text-zinc-400 font-bold uppercase block mb-1.5 font-mono">OPERATOR USERNAME</label>
                            <input
                              type="text"
                              required
                              value={adminUsername}
                              onChange={(e) => setAdminUsername(e.target.value)}
                              placeholder="e.g. Master Curator"
                              className="w-full bg-black/45 border border-white/10 focus:border-[#BA9A5D] text-xs px-3.5 py-3 rounded-xl text-white focus:outline-none transition-all"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] text-zinc-400 font-bold uppercase block mb-1.5 font-mono">REGISTERED PHONE / WHATSAPP</label>
                            <input
                              type="tel"
                              required
                              value={adminPhone}
                              onChange={(e) => setAdminPhone(e.target.value)}
                              placeholder="e.g. 23354321045"
                              className="w-full bg-black/45 border border-white/10 focus:border-[#BA9A5D] text-xs px-3.5 py-3 rounded-xl text-[#DFCE9F] font-mono focus:outline-none transition-all placeholder:text-zinc-700"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[9px] text-zinc-400 font-bold uppercase block mb-1.5 font-mono">LOCATION GPS / ADDRESS COORDINATE</label>
                          <textarea
                            required
                            value={adminLocation}
                            onChange={(e) => setAdminLocation(e.target.value)}
                            placeholder="e.g. Plot 45, Airport Residential Area, Accra, Ghana"
                            rows={3}
                            className="w-full bg-black/45 border border-white/10 focus:border-[#BA9A5D] text-xs px-3.5 py-3 rounded-xl text-white focus:outline-none transition-all placeholder:text-zinc-700 font-serif leading-relaxed"
                          />
                        </div>

                        <div className="pt-4 border-t border-white/5 flex justify-end">
                          <button
                            type="submit"
                            disabled={isAdminSaving}
                            className="px-6 py-3 bg-gradient-to-r from-[#DFCE9F] via-[#BA9A5D] to-[#DFCE9F] text-zinc-950 font-bold text-xs uppercase tracking-widest rounded-xl hover:shadow-[0_0_20px_rgba(186,154,93,0.3)] transition-all cursor-pointer disabled:opacity-50"
                          >
                            {isAdminSaving ? "Saving Settings..." : "Update Coordinates"}
                          </button>
                        </div>
                      </form>

                      {/* Manage Systems Administrators */}
                      <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                        <div className="space-y-1">
                          <h4 className="text-xs font-black text-glow-gold uppercase tracking-widest text-[#BA9A5D] font-mono">
                            Manage System Administrators
                          </h4>
                          <p className="text-[10px] text-zinc-500 font-light mt-0.5 leading-relaxed font-sans">
                            Delegate full access control to other staff members. Registering their login address will automatically enable administrative privileges when they sign into the system.
                          </p>
                        </div>

                        <form 
                          onSubmit={async (e) => {
                            e.preventDefault();
                            if (!newAdminEmail.trim()) return;
                            const targetEmail = newAdminEmail.trim().toLowerCase();
                            try {
                              await setDoc(doc(db, 'admins', targetEmail), {
                                email: targetEmail,
                                registeredAt: new Date(),
                                registeredBy: user?.email || 'System Admin'
                              });
                              setNewAdminEmail("");
                              setStatusMessage(`Successfully registered ${targetEmail} as a System Administrator!`);
                            } catch (err: any) {
                              console.error(err);
                              setErrorMessage("Failed to authorize administrative email permission.");
                            }
                          }}
                          className="flex gap-2"
                        >
                          <input
                            type="email"
                            required
                            value={newAdminEmail}
                            onChange={(e) => setNewAdminEmail(e.target.value)}
                            placeholder="e.g. staffmember@gmail.com"
                            className="flex-1 bg-black/45 border border-white/10 focus:border-[#BA9A5D] text-xs px-3.5 py-3 rounded-xl text-white focus:outline-none transition-all placeholder:text-zinc-700 font-mono"
                          />
                          <button
                            type="submit"
                            className="px-5 py-3 bg-[#BA9A5D] hover:bg-white text-zinc-950 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer whitespace-nowrap"
                          >
                            Grant Admin Access
                          </button>
                        </form>

                        {adminsList.length > 0 ? (
                          <div className="rounded-xl border border-white/5 bg-black/25 overflow-hidden">
                            <table className="w-full text-left border-collapse font-sans text-[11px] text-zinc-300">
                              <thead>
                                <tr className="border-b border-white/5 uppercase tracking-widest text-[8px] text-[#DFCE9F] bg-white/[0.01] font-mono font-black">
                                  <th className="p-3">Staff email address</th>
                                  <th className="p-3">Registered on</th>
                                  <th className="p-3 text-right">Revoke access</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                {adminsList.map((adm) => (
                                  <tr key={adm.id} className="hover:bg-white/[0.01] transition-colors h-10">
                                    <td className="p-3 font-semibold text-white font-mono">{adm.email}</td>
                                    <td className="p-3 text-zinc-500 font-mono">
                                      {adm.registeredAt?.seconds 
                                        ? new Date(adm.registeredAt.seconds * 1000).toLocaleDateString()
                                        : 'Master Whitelist'}
                                    </td>
                                    <td className="p-3 text-right">
                                      <button
                                        onClick={async () => {
                                          if (window.confirm(`Are you sure you want to delete administrator privileges and revoke access for ${adm.email}?`)) {
                                            try {
                                              await deleteDoc(doc(db, 'admins', adm.id));
                                              setStatusMessage(`Administrative privileges revoked successfully for ${adm.email}.`);
                                            } catch (err) {
                                              console.error(err);
                                              setErrorMessage("Failed to revoke administrative privileges.");
                                            }
                                          }
                                        }}
                                        className="p-1.5 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-red-400 rounded-lg transition-all cursor-pointer"
                                        title="Revoke authority button"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-4 border border-dashed border-white/5 text-center text-zinc-500 text-[10px] font-mono rounded-xl">
                            No secondary administrators configured. Use the field above to register team emails.
                          </div>
                        )}
                      </div>

                      {/* Admin Audit Login History Section */}
                      <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="space-y-1">
                            <h4 className="text-xs font-black text-glow-gold uppercase tracking-widest text-[#BA9A5D] font-mono">
                              Admin Login History History
                            </h4>
                            <p className="text-[10px] text-zinc-500 font-light mt-0.5 leading-relaxed font-sans">
                              Audit log records tracked automatically when an administrator accesses system workspace controls.
                            </p>
                          </div>
                          
                          {loginHistory.length > 0 && (
                            <button
                              onClick={async () => {
                                if (window.confirm("Verify: Are you sure you want to clear all administrative audit logs?")) {
                                  try {
                                    // Delete records for safety
                                    const batchLimit = loginHistory.slice(0, 50);
                                    for (const record of batchLimit) {
                                      await deleteDoc(doc(db, 'admin_login_history', record.id));
                                    }
                                    setStatusMessage("Admin login history audit logs cleared successfully.");
                                  } catch (err) {
                                    console.error("Could not clear audit logs:", err);
                                  }
                                }
                              }}
                              className="px-2.5 py-1.5 border border-white/10 hover:border-white/20 hover:bg-white/5 text-zinc-400 hover:text-white transition-all uppercase text-[8px] tracking-widest font-bold font-mono rounded-md shrink-0 cursor-pointer"
                            >
                              Clear Logs
                            </button>
                          )}
                        </div>

                        {loginHistory.length > 0 ? (
                          <div className="rounded-xl border border-white/5 bg-black/25 overflow-y-auto max-h-48 scrollbar-thin">
                            <table className="w-full text-left border-collapse font-sans text-[10px] text-zinc-300">
                              <thead>
                                <tr className="border-b border-white/5 uppercase tracking-widest text-[7px] text-[#DFCE9F] bg-white/[0.01] font-mono font-black sticky top-0 bg-zinc-950">
                                  <th className="p-2.5">Date & Time logged</th>
                                  <th className="p-2.5">Administrator email</th>
                                  <th className="p-2.5">Platform / Agent ID</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                {loginHistory.map((lh, idx) => (
                                  <tr key={lh.id || idx} className="hover:bg-white/[0.01] transition-colors leading-normal">
                                    <td className="p-2.5 font-mono text-[9px] text-[#BA9A5D] whitespace-nowrap">
                                      {lh.timestamp?.seconds 
                                        ? new Date(lh.timestamp.seconds * 1000).toLocaleString()
                                        : new Date(lh.timestamp).toLocaleString()}
                                    </td>
                                    <td className="p-2.5 font-mono text-white whitespace-nowrap">{lh.email}</td>
                                    <td className="p-2.5 text-zinc-500 font-mono truncate max-w-[150px]" title={lh.userAgent}>
                                      {lh.userAgent || 'Chrome/Safari Dev Workspace'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-8 text-center text-zinc-600 text-[10px] font-mono border border-white/5 bg-black/20 rounded-xl">
                            No administrative login history logs registered in database.
                          </div>
                        )}
                      </div>

                      {/* Background Wallpaper & Video Cache Setup (Instant local playback bypasses internet delays) */}
                      <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                        <div className="space-y-1">
                          <h4 className="text-xs font-black text-glow-gold uppercase tracking-widest text-[#BA9A5D] font-mono">
                            Maison Wallpaper & Background Video Cache
                          </h4>
                          <p className="text-[10px] text-zinc-500 font-light mt-0.5 leading-relaxed">
                            Due to network distances or buffer lag, you can upload your custom wallpapers (images) or background videos directly to secure browser cache. The system will load and render them instantaneously!
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Landscape setup */}
                          <div className="bg-black/25 border border-white/5 p-4 rounded-2xl flex flex-col justify-between">
                            <div>
                              <span className="text-[9px] text-[#DFCE9F] font-bold uppercase tracking-wider block mb-1 font-mono">Landscape Wallpaper/Video (PC)</span>
                              <p className="text-[10px] text-zinc-500 mb-3">Preferred aspect 16:9 / 1920x1080.</p>
                              
                              {localLandscapeUrl ? (
                                <div className="rounded-xl overflow-hidden bg-emerald-950/20 border border-emerald-500/20 p-2.5 flex items-center justify-between text-[11px] mb-4">
                                  <span className="text-emerald-400 font-mono text-[9px] font-bold">✦ Active (Cached)</span>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      await clearVideoBlob('landscape');
                                      if (onVideoUploaded) onVideoUploaded('landscape', '', 'video');
                                    }}
                                    className="text-[9px] text-red-400 uppercase tracking-widest font-bold hover:text-red-300 transition-colors cursor-pointer"
                                  >
                                    Reset
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-zinc-400 block mb-4 font-mono italic">Using stream fallback</span>
                              )}
                            </div>

                            <div className="space-y-3">
                              <label className="relative flex items-center justify-center border border-dashed border-white/10 hover:border-[#BA9A5D]/50 bg-white/[0.01] hover:bg-white/[0.03] py-2.5 rounded-xl cursor-pointer transition-all text-center">
                                <input
                                  type="file"
                                  accept="video/mp4,video/webm,image/*"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    if (file.size > 200 * 1024 * 1024) {
                                      alert("File size exceeds modern browser cache limit (200MB). Highly suggest compression below 20MB for best rendering!");
                                      return;
                                    }
                                    const pUrl = URL.createObjectURL(file);
                                    const fileType = file.type.startsWith('image/') ? 'image' : 'video';
                                    await saveVideoBlob('landscape', file, file.name);
                                    if (onVideoUploaded) onVideoUploaded('landscape', pUrl, fileType, file);
                                  }}
                                />
                                <span className="text-[9px] uppercase tracking-widest font-black text-zinc-300 font-sans-luxury">Upload File (Image/Video)</span>
                              </label>

                              <div className="border-t border-white/5 pt-3">
                                <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest block font-mono mb-1.5">Or Paste Direct URL Link</span>
                                <div className="flex gap-1.5">
                                  <input
                                    type="url"
                                    value={landscapeLink}
                                    onChange={(e) => setLandscapeLink(e.target.value)}
                                    placeholder="https://images.unsplash.com/... or .mp4"
                                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[9px] text-zinc-200 placeholder-zinc-700 font-mono focus:outline-none focus:border-[#BA9A5D]"
                                  />
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (!landscapeLink.trim()) return;
                                      const url = landscapeLink.trim();
                                      const detectedType = (url.endsWith('.mp4') || url.endsWith('.webm') || url.includes('video')) ? 'video' : 'image';
                                      const textContent = `URL_REF:${detectedType}:${url}`;
                                      const blob = new Blob([textContent], { type: 'text/plain' });
                                      await saveVideoBlob('landscape', blob, 'URL Link');
                                      if (onVideoUploaded) onVideoUploaded('landscape', url, detectedType);
                                      setLandscapeLink('');
                                      alert("Landscape URL background successfully synchronized!");
                                    }}
                                    className="px-3 bg-[#BA9A5D] hover:bg-[#DFCE9F] text-zinc-950 font-bold text-[8.5px] uppercase tracking-widest rounded-lg transition-all shrink-0 cursor-pointer"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Portrait setup */}
                          <div className="bg-black/25 border border-white/5 p-4 rounded-2xl flex flex-col justify-between">
                            <div>
                              <span className="text-[9px] text-[#DFCE9F] font-bold uppercase tracking-wider block mb-1 font-mono">Portrait Wallpaper/Video (Mobile)</span>
                              <p className="text-[10px] text-zinc-500 mb-3">Preferred aspect 9:16 / 1080x1920.</p>
                              
                              {localPortraitUrl ? (
                                <div className="rounded-xl overflow-hidden bg-emerald-950/20 border border-emerald-500/20 p-2.5 flex items-center justify-between text-[11px] mb-4">
                                  <span className="text-emerald-400 font-mono text-[9px] font-bold">✦ Active (Cached)</span>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      await clearVideoBlob('portrait');
                                      if (onVideoUploaded) onVideoUploaded('portrait', '', 'video');
                                    }}
                                    className="text-[9px] text-red-400 uppercase tracking-widest font-bold hover:text-red-300 transition-colors cursor-pointer"
                                  >
                                    Reset
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-zinc-400 block mb-4 font-mono italic">Using stream fallback</span>
                              )}
                            </div>

                            <div className="space-y-3">
                              <label className="relative flex items-center justify-center border border-dashed border-white/10 hover:border-[#BA9A5D]/50 bg-white/[0.01] hover:bg-white/[0.03] py-2.5 rounded-xl cursor-pointer transition-all text-center">
                                <input
                                  type="file"
                                  accept="video/mp4,video/webm,image/*"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    if (file.size > 200 * 1024 * 1024) {
                                      alert("File size exceeds modern browser cache limit (200MB). Highly suggest compression below 20MB for best rendering!");
                                      return;
                                    }
                                    const pUrl = URL.createObjectURL(file);
                                    const fileType = file.type.startsWith('image/') ? 'image' : 'video';
                                    await saveVideoBlob('portrait', file, file.name);
                                    if (onVideoUploaded) onVideoUploaded('portrait', pUrl, fileType, file);
                                  }}
                                />
                                <span className="text-[9px] uppercase tracking-widest font-black text-zinc-300 font-sans-luxury">Upload File (Image/Video)</span>
                              </label>

                              <div className="border-t border-white/5 pt-3">
                                <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest block font-mono mb-1.5">Or Paste Direct URL Link</span>
                                <div className="flex gap-1.5">
                                  <input
                                    type="url"
                                    value={portraitLink}
                                    onChange={(e) => setPortraitLink(e.target.value)}
                                    placeholder="https://images.unsplash.com/... or .mp4"
                                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[9px] text-zinc-200 placeholder-zinc-700 font-mono focus:outline-none focus:border-[#BA9A5D]"
                                  />
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (!portraitLink.trim()) return;
                                      const url = portraitLink.trim();
                                      const detectedType = (url.endsWith('.mp4') || url.endsWith('.webm') || url.includes('video')) ? 'video' : 'image';
                                      const textContent = `URL_REF:${detectedType}:${url}`;
                                      const blob = new Blob([textContent], { type: 'text/plain' });
                                      await saveVideoBlob('portrait', blob, 'URL Link');
                                      if (onVideoUploaded) onVideoUploaded('portrait', url, detectedType);
                                      setPortraitLink('');
                                      alert("Portrait URL background successfully synchronized!");
                                    }}
                                    className="px-3 bg-[#BA9A5D] hover:bg-[#DFCE9F] text-zinc-950 font-bold text-[8.5px] uppercase tracking-widest rounded-lg transition-all shrink-0 cursor-pointer"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

              </div>
            )}

            {/* Custom Brand Watermark Footing inside Operational Overlay */}
            <footer className="mt-12 pt-6 border-t border-white/5 text-[9px] tracking-widest text-[#BA9A5D]/45 font-mono flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0 uppercase select-none">
              <p>Bliss Elle Ghana copywrite 2026 developeded by Techloom Ghana(Joe Vardy Grp..)</p>
              <p className="text-[#BA9A5D]/60 flex items-center gap-1.5">
                <span className="text-xs">✦</span> ACCREDITED WEST AFRICAN CRAFTSMANSHIP
              </p>
            </footer>

            {/* Custom Luxury Invoice Generator & Dispatch Hub Modal */}
            <AnimatePresence>
              {receiptOrder && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setReceiptOrder(null)}
                    className="absolute inset-0 bg-black/85 backdrop-blur-md"
                  />

                  {/* Panel */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="relative w-full max-w-2xl border border-[#BA9A5D]/30 bg-[#040e0a] p-6 rounded-3xl shadow-2xl text-white overflow-hidden z-10 font-sans"
                  >
                    {/* Decorative Top Accent */}
                    <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-[#BA9A5D] via-[#DFCE9F] to-[#BA9A5D]" />
                    <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#BA9A5D]/5 rounded-full blur-3xl pointer-events-none" />

                    {/* Modal Hero Header */}
                    <div className="flex justify-between items-start pb-4 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-[#BA9A5D]/10 border border-[#BA9A5D]/25 flex items-center justify-center shrink-0">
                          <ClipboardList className="h-5 w-5 text-[#DFCE9F]" />
                        </div>
                        <div>
                          <span className="text-[9px] tracking-[0.2em] text-[#BA9A5D] uppercase font-bold block">
                            Maison Courier System
                          </span>
                          <h3 className="font-sans text-sm font-extrabold text-white uppercase tracking-wider">
                            Receipt & Notification Dispatch Hub
                          </h3>
                        </div>
                      </div>
                      <button
                        onClick={() => setReceiptOrder(null)}
                        className="p-1.5 rounded-lg bg-zinc-900 border border-white/5 hover:border-white/15 text-zinc-400 hover:text-white cursor-pointer transition-all"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                      {/* Left Side: Order & Receipt Preview */}
                      <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-black/45 border border-white/[0.03] space-y-3 text-xs">
                          <span className="text-[8.5px] font-sans text-[#BA9A5D] uppercase tracking-widest font-black block">Order Fitments Summary</span>
                          
                          <div className="flex justify-between">
                            <span className="text-zinc-400 font-medium">Client Name:</span>
                            <span className="text-white font-extrabold">{receiptOrder.clientName || receiptOrder.email || 'VIP Guest'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400 font-medium">Order Ref:</span>
                            <span className="font-mono text-[#DFCE9F] font-bold">#BE-{receiptOrder.id?.substring(0,8).toUpperCase() || 'INFO'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400 font-medium font-bold font-sans">Target Phone:</span>
                            <span className="text-[#DFCE9F] font-semibold font-sans">{receiptOrder.clientPhone || receiptOrder.phone || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400 font-medium">Current Phase:</span>
                            <span className="px-2 py-0.5 rounded-md bg-[#BA9A5D]/10 text-[#DFCE9F] text-[8px] font-bold uppercase tracking-wider border border-[#BA9A5D]/25">
                              {receiptOrder.status?.toUpperCase() || 'COMPLETED'}
                            </span>
                          </div>

                          <div className="pt-2.5 border-t border-white/5 space-y-1.5 font-sans">
                            <span className="text-[8px] text-[#BA9A5D] font-black uppercase tracking-widest block">Allocated Pieces</span>
                            <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                              {receiptOrder.items?.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between text-zinc-300 py-0.5">
                                  <span className="truncate max-w-[150px]">✦ {item.name}</span>
                                  <span className="font-sans text-[#DFCE9F] shrink-0 font-bold">{item.price}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-2.5 border-t border-white/5 flex justify-between font-bold text-[#DFCE9F]">
                            <span>TOTAL COMMISSION:</span>
                            <span className="text-white tracking-wider">
                              {receiptOrder.total?.toString().startsWith('$') || receiptOrder.total?.toString().startsWith('GHS') 
                                ? receiptOrder.total 
                                : `GHS ${receiptOrder.total?.toLocaleString() || '18,500'}`}
                            </span>
                          </div>
                        </div>

                        {/* PDF Download Trigger Widget */}
                        <button
                          onClick={() => generateReceiptPDF(receiptOrder)}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 text-xs font-black uppercase tracking-wider hover:from-amber-400 hover:to-amber-500 shadow-lg cursor-pointer hover:scale-[1.01] transition-transform"
                        >
                          <CheckCircle2 className="h-4.5 w-4.5 text-zinc-950" />
                          Generate & Download PDF Receipt
                        </button>
                      </div>

                      {/* Right Side: Dispatch controls */}
                      <div className="space-y-4">
                        <span className="text-[9px] font-bold text-[#BA9A5D] uppercase tracking-widest block font-sans">Automated Notification Center</span>

                        <div className="p-4 rounded-2xl bg-black/45 border border-white/[0.03] space-y-4 text-xs font-sans">
                          {/* Email notification simulator */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-white font-bold flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5 text-blue-400" /> Automated Mail System
                              </span>
                              <span className="text-[8px] text-emerald-400 italic font-mono">SMTP Service Active</span>
                            </div>
                            <p className="text-zinc-400 text-[11px] leading-relaxed">
                              Send luxurious status updates to <span className="text-[#DFCE9F] font-semibold">{receiptOrder.email || 'recipient@mail.com'}</span>.
                            </p>

                            {/* Email Logs in Document metadata */}
                            {receiptOrder.notificationsSent && receiptOrder.notificationsSent.length > 0 && (
                              <div className="p-2 rounded bg-[#010906] border border-[#BA9A5D]/10 max-h-24 overflow-y-auto font-sans text-[9px] text-[#DFCE9F] space-y-1">
                                <span className="font-sans text-[8px] text-zinc-500 font-black tracking-wider block uppercase mb-1">REAL-TIME SYSTEM SMTP LOG:</span>
                                {receiptOrder.notificationsSent.map((log: any, index: number) => (
                                  <div key={index} className="leading-normal border-b border-white/5 pb-1">
                                    <p className="text-[#BA9A5D] font-bold">[{log.status?.toUpperCase()}] - EMAIL DISPATCH</p>
                                    <p className="text-zinc-400">To: {log.recipient}</p>
                                    <p className="text-zinc-500">{new Date(log.timestamp).toLocaleString()}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {emailSuccessSent ? (
                              <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-emerald-200 text-[11px] font-bold">
                                ✓ Receipt PDF mailed & logged! Mail client template loaded successfully.
                              </div>
                            ) : (
                              <button
                                onClick={async () => {
                                  setSimulatedEmailSending(true);
                                  // Simulation delay
                                  await new Promise(resolve => setTimeout(resolve, 1500));
                                  setSimulatedEmailSending(false);
                                  setEmailSuccessSent(`Mailed at: ${new Date().toLocaleTimeString()}`);
                                  
                                  // Prefix values for mailto flow
                                  const subject = encodeURIComponent(`Bliss Elle Ghana - Invoice Receipt BE-${receiptOrder.id?.substring(0,8).toUpperCase()}`);
                                  const itemsText = receiptOrder.items?.map((it: any) => `${it.name} (${it.price || 'GHS 15000'})`).join('%0D%0A') || 'Luxury bespoke package';
                                  const body = encodeURIComponent(
                                    `Hello, ${receiptOrder.clientName || 'VIP Client'},\n\nWe are excited to share your receipt details for your luxury fashion order with Bliss Elle Ghana!\n\nOrder Status: ${receiptOrder.status?.toUpperCase()}\nTotal Value: ${receiptOrder.total || 'GHS 18,500'}\n\nAllocated Items:\n${itemsText}\n\nThank you for choosing certified West African high craftsmanship.\n\nBest regards,\nBliss Elle Ghana Team`
                                  );
                                  window.open(`mailto:${receiptOrder.email || 'vip.guest@blisselle.com'}?subject=${subject}&body=${body}`, '_blank');
                                }}
                                disabled={simulatedEmailSending}
                                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-zinc-900 border border-white/10 hover:border-[#BA9A5D]/40 text-[#DFCE9F] hover:text-white transition-all text-[10px] uppercase font-bold cursor-pointer font-sans"
                              >
                                {simulatedEmailSending ? (
                                  <>
                                    <RefreshCw className="h-3 w-3 animate-spin text-[#BA9A5D]" />
                                    Compiling Courier Mail...
                                  </>
                                ) : (
                                  <>✦ Send Live Email & Receipt</>
                                )}
                              </button>
                            )}
                          </div>

                          {/* WhatsApp flow */}
                          <div className="pt-3 border-t border-white/5 space-y-2 font-sans">
                            <div className="flex justify-between items-center">
                              <span className="text-white font-bold flex items-center gap-1.5">
                                💬 WhatsApp Courier Direct
                              </span>
                              <span className="text-[8px] text-green-400 font-mono">Prefilled Ready</span>
                            </div>
                            <p className="text-zinc-400 text-[11px] leading-relaxed">
                              Send the transaction summary and PDF receipt note directly via private WhatsApp message.
                            </p>
                            <button
                              onClick={() => {
                                const phone = receiptOrder.clientPhone || receiptOrder.phone || '';
                                const subtotal = receiptOrder.total || 'GHS 18,500';
                                const listItems = receiptOrder.items?.map((it: any) => `⁃ *${it.name}* (${it.price})`).join('%0A') || 'Luxury Bespoke Piece';
                                const msg = `*BLISS ELLE GHANA MAISON*\n*Official Invoice Receipt* \n\nDear *${receiptOrder.clientName || 'Valued Guest'}*,\nWe are thrilled to notify you that your luxury fashion order status is now updated to *${receiptOrder.status?.toUpperCase()}*! \n\n*Purchased Pieces:*\n${listItems}\n\n*Total Commission Value:* ${subtotal}\n\nThank you for your trusted patronage of West African high craftsmanship!\n_Bliss Elle Ghana Ltd_`;
                                const finalUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
                                window.open(finalUrl, '_blank');
                              }}
                              className="w-full py-2 rounded-lg bg-green-600/10 border border-green-500/20 hover:bg-green-600/20 text-green-400 hover:text-green-300 transition-all text-[10px] uppercase font-bold cursor-pointer flex items-center justify-center gap-1.5 font-sans"
                            >
                              🚀 Dispatch WhatsApp Receipt Note
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/5 flex justify-end">
                      <button
                        onClick={() => setReceiptOrder(null)}
                        className="px-6 py-2 rounded-full border border-white/10 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all text-[10px] uppercase font-bold cursor-pointer"
                      >
                        Close Portal
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Product Removal Confirmation Dialog (Custom Luxury Pop-up) */}
            <AnimatePresence>
              {productToDelete && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                  {/* Deep blur backdrop mask */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setProductToDelete(null)}
                    className="absolute inset-0 bg-black/85 backdrop-blur-md"
                  />

                  {/* Dialog Box Panel */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="relative w-full max-w-md border border-red-500/25 bg-[#06110c] p-8 rounded-3xl shadow-2xl text-center text-white overflow-hidden z-10"
                  >
                    {/* Fine luxury red hazard bar */}
                    <div className="absolute top-0 inset-x-0 h-[2.5px] bg-red-500/60" />
                    <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

                    {/* Warning Shield Badge */}
                    <div className="relative mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-950/20 border border-red-500/25 mb-4">
                      <span className="absolute inset-0 rounded-full border border-red-500/30 animate-pulse" />
                      <AlertTriangle className="h-5.5 w-5.5 text-red-400" />
                    </div>

                    {/* Typography Header */}
                    <span className="font-sans-luxury text-[9px] tracking-[0.25em] text-red-400 uppercase block font-bold">
                      Retire Masterpiece
                    </span>
                    <h4 className="font-sans text-sm font-extrabold uppercase tracking-widest text-red-400 leading-tight mt-2 text-glow-gold">
                      Retrench inventory record?
                    </h4>

                    {/* Thumbnail display of selected masterwork */}
                    <div className="my-5 p-3 rounded-2xl bg-black/45 border border-white/5 flex gap-4 items-center">
                      {productToDelete.imageUrl ? (
                        <img 
                          src={productToDelete.imageUrl} 
                          alt={productToDelete.name} 
                          className="h-14 w-14 rounded-xl object-cover border border-white/10 shrink-0" 
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center shrink-0">
                          <Sliders className="h-5 w-5 text-zinc-500" />
                        </div>
                      )}
                      <div className="text-left flex-1 min-w-0">
                        <span className="font-mono text-[8px] text-[#BA9A5D] uppercase tracking-wider block font-bold">
                          {productToDelete.category}
                        </span>
                        <p className="text-white text-xs font-sans uppercase tracking-wider leading-tight font-black mt-0.5 truncate">{productToDelete.name}</p>
                        <p className="text-[#DFCE9F] font-mono text-[9px] font-semibold mt-1">GHS {productToDelete.price}</p>
                      </div>
                    </div>

                    {/* Informative advice */}
                    <p className="font-sans-luxury text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
                      Are you sure you want to permanently remove <strong className="text-white">{productToDelete.name}</strong> from the Bliss Elle Lookbook? This action cannot be undone.
                    </p>

                    <div className="mt-8 flex gap-3.5">
                      <button
                        type="button"
                        onClick={() => setProductToDelete(null)}
                        className="flex-1 rounded-full border border-white/10 bg-transparent text-zinc-400 hover:text-white text-[10px] py-3 font-sans-luxury font-medium uppercase tracking-widest hover:bg-white/5 transition-all text-center cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => confirmDeleteProduct(productToDelete)}
                        className="flex-1 rounded-full bg-red-600 text-[#06110c] hover:bg-red-500 text-[10px] py-3 font-sans-luxury font-bold uppercase tracking-widest transition-all text-center cursor-pointer"
                      >
                        Yes, Delete
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
