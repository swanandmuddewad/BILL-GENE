/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Trash2, Printer, Save, Smartphone, Package, ShoppingCart, Download, Image as ImageIcon, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { getItems, saveItems, Item } from './utils/storage';
import { toPng } from 'html-to-image';
import { Reorder } from 'motion/react';

const INITIAL_ITEMS: Omit<Item, 'id'>[] = [
  { name: "GM", boxPrice: 3800, loosePrice: 0, defaultType: "box" },
  { name: "TANGO", boxPrice: 3800, loosePrice: 0, defaultType: "box" },
  { name: "APPLE", boxPrice: 3800, loosePrice: 0, defaultType: "box" },
  { name: "SOAP", boxPrice: 3800, loosePrice: 0, defaultType: "box" },
  { name: "KF BOTTLE", boxPrice: 0, loosePrice: 0, defaultType: "box" },
  { name: "KF CAN", boxPrice: 0, loosePrice: 0, defaultType: "box" },
  { name: "LP BOTTLE", boxPrice: 0, loosePrice: 0, defaultType: "box" },
  { name: "LP CAN", boxPrice: 0, loosePrice: 0, defaultType: "box" },
  { name: "TB BOTTLE", boxPrice: 0, loosePrice: 0, defaultType: "box" },
  { name: "TB CAN", boxPrice: 0, loosePrice: 0, defaultType: "box" },
  { name: "MD NIP", boxPrice: 0, loosePrice: 0, defaultType: "loose" },
  { name: "MD 90", boxPrice: 0, loosePrice: 0, defaultType: "loose" },
  { name: "IB NIP", boxPrice: 0, loosePrice: 0, defaultType: "loose" },
  { name: "IB 90", boxPrice: 0, loosePrice: 0, defaultType: "loose" },
  { name: "RS NIP", boxPrice: 0, loosePrice: 0, defaultType: "loose" },
  { name: "RS 90", boxPrice: 0, loosePrice: 0, defaultType: "loose" },
  { name: "RC NIP", boxPrice: 0, loosePrice: 0, defaultType: "loose" },
  { name: "RC 90", boxPrice: 0, loosePrice: 0, defaultType: "loose" },
  { name: "OM NIP", boxPrice: 0, loosePrice: 0, defaultType: "loose" },
  { name: "OM 90", boxPrice: 0, loosePrice: 0, defaultType: "loose" },
  { name: "IC NIP", boxPrice: 0, loosePrice: 0, defaultType: "loose" },
  { name: "IC 90", boxPrice: 0, loosePrice: 0, defaultType: "loose" },
  { name: "MS NIP", boxPrice: 0, loosePrice: 0, defaultType: "loose" },
  { name: "MS 90", boxPrice: 0, loosePrice: 0, defaultType: "loose" },
  { name: "DSP NIP", boxPrice: 0, loosePrice: 0, defaultType: "loose" },
  { name: "DSP 90", boxPrice: 0, loosePrice: 0, defaultType: "loose" },
];

export default function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [quantities, setQuantities] = useState<{ [key: string]: { qty: string, type: 'box' | 'loose' } }>({});
  const [isEditing, setIsEditing] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<'box' | 'loose'>('box');
  
  const [showBillOverlay, setShowBillOverlay] = useState(false);
  const [billScale, setBillScale] = useState(100);
  const [isDownloading, setIsDownloading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const billRef = useRef<HTMLDivElement>(null);

  // Initialize Data
  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = await getItems();
        if (stored && stored.length > 0) {
          const migrated = stored.map(item => ({
            ...item,
            boxPrice: (item as any).boxPrice ?? (item as any).price ?? 0,
            loosePrice: (item as any).loosePrice ?? 0,
            defaultType: (item as any).defaultType ?? 'box'
          }));
          setItems(migrated);
          
          const initialQtys: { [key: string]: { qty: string, type: 'box' | 'loose' } } = {};
          migrated.forEach(item => {
            initialQtys[item.id] = { qty: '', type: item.defaultType };
          });
          setQuantities(initialQtys);
        } else {
          const defaultItems = INITIAL_ITEMS.map(item => ({
            id: Math.random().toString(36).substring(2, 11),
            ...item
          })) as Item[];
          setItems(defaultItems);
          
          const initialQtys: { [key: string]: { qty: string, type: 'box' | 'loose' } } = {};
          defaultItems.forEach(item => {
            initialQtys[item.id] = { qty: '', type: item.defaultType };
          });
          setQuantities(initialQtys);
          
          await saveItems(defaultItems);
        }
      } catch (error) {
        console.error("Failed to load items from DB:", error);
      }
    };
    loadData();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    if (isConfirmingClear) {
      const timer = setTimeout(() => setIsConfirmingClear(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isConfirmingClear]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    }
  };

  const updatePrice = (id: string, field: 'boxPrice' | 'loosePrice', price: string) => {
    const newItems = items.map(item => 
      item.id === id ? { ...item, [field]: parseFloat(price) || 0 } : item
    );
    setItems(newItems);
    saveItems(newItems);
  };

  const handleQtyChange = (id: string, val: string) => {
    setQuantities(prev => ({ 
      ...prev, 
      [id]: { ...prev[id], qty: val } 
    }));
  };

  const handleTypeToggle = (id: string) => {
    setQuantities(prev => ({
      ...prev,
      [id]: { ...prev[id], type: prev[id].type === 'box' ? 'loose' : 'box' }
    }));
  };

  const billItems = useMemo(() => {
    return items
      .filter(item => (parseFloat(quantities[item.id]?.qty) || 0) > 0)
      .map(item => {
        const type = quantities[item.id].type;
        const price = type === 'box' ? item.boxPrice : item.loosePrice;
        const qty = parseFloat(quantities[item.id].qty);
        return {
          ...item,
          qty,
          price,
          typeLabel: type.toUpperCase(),
          total: qty * price
        };
      });
  }, [items, quantities]);

  const grandTotal = billItems.reduce((sum, item) => sum + item.total, 0);

  const removeItem = (id: string, confirmed: boolean = false) => {
    if (!confirmed) {
      setConfirmDeleteId(id);
      return;
    }
    const newItems = items.filter(i => i.id !== id);
    setItems(newItems);
    saveItems(newItems);
    setConfirmDeleteId(null);
  };

  const moveItem = (id: string, direction: 'up' | 'down') => {
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return;
    
    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= items.length) return;
    
    // Swap items
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    
    setItems(newItems);
    saveItems(newItems);
  };

  const handlePrint = () => {
    setShowBillOverlay(true);
  };

  const handleDownloadImage = async () => {
    if (!billRef.current) return;
    
    setIsDownloading(true);
    try {
      // Ensure we capture at a good quality even if scaled on screen
      const dataUrl = await toPng(billRef.current, { 
        cacheBust: true,
        quality: 1,
        pixelRatio: 2 // Higher resolution
      });
      
      const link = document.createElement('a');
      link.download = `bill-${new Date().getTime()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('oops, something went wrong!', err);
      alert('Failed to generate image. Please try taking a screenshot instead.');
    } finally {
      setIsDownloading(false);
    }
  };

  const resetBill = () => {
    if (!isConfirmingClear) {
      setIsConfirmingClear(true);
      return;
    }
    
    const resetQtys: { [key: string]: { qty: string, type: 'box' | 'loose' } } = {};
    items.forEach(item => {
      resetQtys[item.id] = { qty: '', type: item.defaultType };
    });
    setQuantities(resetQtys);
    setIsConfirmingClear(false);
  };

  const addItem = () => {
    if (!newItemName.trim()) return;
    
    const newItem: Item = {
      id: Math.random().toString(36).substring(2, 11),
      name: newItemName.trim().toUpperCase(),
      boxPrice: 0,
      loosePrice: 0,
      defaultType: newItemType
    };
    
    const newItems = [...items, newItem];
    setItems(newItems);
    saveItems(newItems);
    setQuantities(prev => ({ ...prev, [newItem.id]: { qty: '', type: newItemType } }));
    
    setNewItemName('');
    setIsAddingItem(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <header className="bg-slate-900 text-white p-4 sticky top-0 z-30 shadow-lg flex justify-between items-center print-hidden">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ShoppingCart size={24} className="text-blue-400" />
          <span className="hidden sm:inline">Bill Generator</span>
          <span className="sm:hidden text-lg">Bill Gen</span>
        </h1>
        <div className="flex gap-2">
          {deferredPrompt && (
            <button onClick={handleInstall} className="bg-blue-600 px-3 py-1 rounded text-sm flex items-center gap-1 cursor-pointer hover:bg-blue-700 transition-colors">
              <Smartphone size={16} /> <span className="hidden xs:inline">Install</span>
            </button>
          )}
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className={`${isEditing ? 'bg-green-600' : 'bg-slate-700'} px-3 py-1 rounded text-sm cursor-pointer transition-colors flex items-center gap-1`}
          >
            {isEditing ? 'Done' : 'Prices'}
          </button>
        </div>
      </header>

      <main className="p-2 sm:p-4 max-w-4xl mx-auto print-hidden">
        {!isEditing && (
          <div className="mb-4 flex justify-center">
            <button 
              onClick={() => {
                setIsEditing(true);
                setIsAddingItem(true);
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-full font-bold shadow-md active:scale-95 transition-all text-sm"
            >
              <Plus size={18} /> ADD NEW ITEM
            </button>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="w-full">
            <div className="hidden sm:grid grid-cols-[1fr_120px_80px_100px_100px] bg-slate-100 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <div className="p-3">Item</div>
              <div className="p-3">Price</div>
              <div className="p-3 text-center">Unit</div>
              <div className="p-3">Qty</div>
              <div className="p-3 text-right">Total</div>
              {isEditing && <div className="p-3 w-10"></div>}
            </div>

            <Reorder.Group 
              axis="y" 
              values={items} 
              onReorder={(newOrder) => {
                setItems(newOrder);
                saveItems(newOrder);
              }}
              className="divide-y divide-slate-100"
            >
              {items.map((item) => {
                const currentQty = quantities[item.id]?.qty || '';
                const currentType = quantities[item.id]?.type || item.defaultType;
                const currentPrice = currentType === 'box' ? item.boxPrice : item.loosePrice;
                const hasValue = (parseFloat(currentQty) || 0) > 0;
                
                return (
                  <Reorder.Item 
                    key={item.id} 
                    value={item}
                    dragListener={isEditing}
                    className={`p-3 space-y-2 ${hasValue ? "bg-blue-50/50" : "bg-white"} ${isEditing ? "cursor-grab active:cursor-grabbing" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      {isEditing && (
                        <div className="flex-shrink-0 text-slate-300">
                          <GripVertical size={20} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-black text-slate-900 text-sm sm:text-base leading-tight uppercase">
                          {item.name}
                        </div>
                        <div className="flex gap-3 mt-0.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${currentType === 'box' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                            BOX: ₹{item.boxPrice.toFixed(0)}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${currentType === 'loose' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                            LOOSE: ₹{item.loosePrice.toFixed(0)}
                          </span>
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="flex-shrink-0 flex items-center gap-1 sm:gap-2">
                          <div className="flex flex-col gap-1">
                            <button 
                              onClick={() => moveItem(item.id, 'up')}
                              disabled={items.indexOf(item) === 0}
                              className="p-2 bg-slate-100 text-slate-400 rounded-lg disabled:opacity-30 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                            >
                              <ChevronUp size={16} />
                            </button>
                            <button 
                              onClick={() => moveItem(item.id, 'down')}
                              disabled={items.indexOf(item) === items.length - 1}
                              className="p-2 bg-slate-100 text-slate-400 rounded-lg disabled:opacity-30 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                            >
                              <ChevronDown size={16} />
                            </button>
                          </div>
                          
                          {confirmDeleteId === item.id ? (
                            <div className="flex gap-1">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteId(null);
                                }}
                                className="bg-slate-100 text-slate-500 px-3 py-2 rounded-lg text-[10px] font-bold uppercase"
                              >
                                NO
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeItem(item.id, true);
                                }}
                                className="bg-red-600 text-white px-3 py-2 rounded-lg text-[10px] font-bold uppercase shadow-sm"
                              >
                                YES
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                removeItem(item.id);
                              }}
                              className="bg-red-50 text-red-500 w-12 h-12 flex items-center justify-center rounded-xl border border-red-100 hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-90"
                            >
                              <Trash2 size={24} />
                            </button>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="flex-shrink-0">
                            <button 
                              onClick={() => handleTypeToggle(item.id)}
                              className={`w-10 h-10 flex items-center justify-center text-sm font-black rounded-xl border-2 transition-all cursor-pointer shadow-sm active:scale-90 ${
                                currentType === 'box' 
                                  ? 'bg-blue-600 border-blue-700 text-white' 
                                  : 'bg-green-600 border-green-700 text-white'
                              }`}
                            >
                              {currentType.substring(0,1).toUpperCase()}
                            </button>
                          </div>

                          <div className="w-24 sm:w-32 flex-shrink-0">
                            <input
                              type="number"
                              inputMode="decimal"
                              className="w-full border-2 border-slate-300 rounded-xl py-3 px-2 text-xl font-black text-center focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all outline-none bg-white placeholder-slate-200"
                              value={currentQty}
                              onChange={(e) => handleQtyChange(item.id, e.target.value)}
                              placeholder="0"
                            />
                          </div>

                          <div className="w-20 text-right flex-shrink-0">
                            <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Amount</div>
                            <div className="text-base font-black text-slate-800">
                              ₹{((parseFloat(currentQty) || 0) * currentPrice).toFixed(0)}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {isEditing && (
                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <div className="flex-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Set Box Price</label>
                          <input
                            type="number"
                            className="w-full border rounded-lg p-2 text-sm bg-slate-50 focus:bg-white transition-all"
                            value={item.boxPrice || ''}
                            onChange={(e) => updatePrice(item.id, 'boxPrice', e.target.value)}
                            placeholder="Box ₹"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Set Loose Price</label>
                          <input
                            type="number"
                            className="w-full border rounded-lg p-2 text-sm bg-slate-50 focus:bg-white transition-all"
                            value={item.loosePrice || ''}
                            onChange={(e) => updatePrice(item.id, 'loosePrice', e.target.value)}
                            placeholder="Loose ₹"
                          />
                        </div>
                      </div>
                    )}
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
          </div>
          
          {isEditing && (
            <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/30">
              {isAddingItem ? (
                <div className="flex flex-col gap-3 max-w-sm mx-auto bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider text-center">New Item Details</h3>
                  <input 
                    type="text"
                    placeholder="ENTER ITEM NAME"
                    className="w-full border-2 border-slate-200 rounded-lg p-3 font-bold uppercase focus:border-blue-500 outline-none"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setNewItemType('box')}
                      className={`flex-1 py-3 rounded-lg font-bold text-xs transition-all ${newItemType === 'box' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}
                    >
                      DEFAULT BOX
                    </button>
                    <button 
                      onClick={() => setNewItemType('loose')}
                      className={`flex-1 py-3 rounded-lg font-bold text-xs transition-all ${newItemType === 'loose' ? 'bg-green-600 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}
                    >
                      DEFAULT LOOSE
                    </button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button 
                      onClick={() => setIsAddingItem(false)}
                      className="flex-1 py-3 text-slate-500 font-bold text-xs"
                    >
                      CANCEL
                    </button>
                    <button 
                      onClick={addItem}
                      disabled={!newItemName.trim()}
                      className="flex-[2] bg-blue-600 text-white py-3 rounded-lg font-bold text-xs disabled:opacity-50"
                    >
                      SAVE ITEM
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  id="add-item-trigger-btn"
                  onClick={() => setIsAddingItem(true)}
                  className="flex items-center gap-2 mx-auto bg-blue-50 text-blue-600 px-8 py-3 rounded-full font-bold hover:bg-blue-100 transition-colors shadow-sm"
                >
                  <Plus size={20} /> Add New Item
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer Summary */}
      {!isEditing && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] print-hidden z-20">
          <div className="max-w-4xl mx-auto flex justify-between items-center gap-4">
            <div className="flex-1">
              <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Total Payable</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">₹{grandTotal.toFixed(0)}</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={resetBill}
                className={`${isConfirmingClear ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600'} px-4 py-4 rounded-xl font-bold transition-all cursor-pointer`}
              >
                {isConfirmingClear ? 'SURE?' : 'Clear'}
              </button>
              <button 
                onClick={handlePrint}
                disabled={grandTotal === 0}
                className="bg-blue-600 text-white px-6 sm:px-10 py-4 rounded-xl font-black flex items-center gap-2 shadow-lg shadow-blue-200 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale cursor-pointer"
              >
                <Printer size={22} /> <span className="hidden xs:inline">Print</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Digital Bill Preview Overlay for Screenshots */}
      {showBillOverlay && (
        <div className="bill-overlay print-hidden">
          <div className="w-full max-w-md flex flex-col gap-4 mb-6">
            <div className="flex items-center justify-between bg-slate-800 p-4 rounded-xl text-white">
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 block">Scale: {billScale}%</label>
                <input 
                  type="range" 
                  min="50" 
                  max="150" 
                  step="5"
                  value={billScale} 
                  onChange={(e) => setBillScale(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
              <div className="flex gap-2 ml-4">
                <button 
                  onClick={handleDownloadImage}
                  disabled={isDownloading}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Download size={16} /> {isDownloading ? '...' : 'SAVE IMAGE'}
                </button>
                <button 
                  onClick={() => setShowBillOverlay(false)}
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                >
                  EXIT
                </button>
              </div>
            </div>
            <p className="text-white/50 text-[10px] text-center uppercase font-bold tracking-widest">Adjust scale for preview • Click SAVE IMAGE for photo</p>
          </div>

          <div 
            className="bill-container" 
            style={{ transform: `scale(${billScale / 100})` }}
          >
            <div ref={billRef} className="bg-white p-6">
              <div className="text-center mb-6 border-b-2 border-slate-900 pb-4">
                <h1 className="text-2xl font-black uppercase tracking-tight">CASH MEMO</h1>
                <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-widest">Retail Billing System</p>
              </div>
            
            <div className="flex justify-between text-[10px] font-bold uppercase mb-4">
              <span>Date: {new Date().toLocaleDateString()}</span>
              <span>Time: {new Date().toLocaleTimeString()}</span>
            </div>

            <table className="w-full mb-6 border-collapse">
              <thead>
                <tr className="border-y border-slate-900 text-[9px] text-left uppercase">
                  <th className="py-2">Item Name</th>
                  <th className="py-2 text-center">Price</th>
                  <th className="py-2 text-center whitespace-nowrap">B OR L</th>
                  <th className="py-2 text-center">Quantity</th>
                  <th className="py-2 text-right">Line Amount</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {billItems.map(item => (
                  <tr key={item.id} className="border-b border-slate-100 italic">
                    <td className="py-2 font-bold uppercase leading-none">{item.name}</td>
                    <td className="py-2 text-center">₹{item.price.toFixed(0)}</td>
                    <td className="py-2 text-center font-black uppercase">{item.typeLabel.substring(0,1)}</td>
                    <td className="py-2 text-center font-bold">{item.qty}</td>
                    <td className="py-2 text-right font-black">₹{item.total.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex flex-col items-end border-t-2 border-slate-900 pt-4 gap-1">
              <div className="flex justify-between w-full max-w-[170px] text-xs font-bold">
                <span>SUBTOTAL:</span>
                <span>₹{grandTotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between w-full max-w-[170px] text-xl font-black border-t border-slate-200 mt-1 pt-1">
                <span>FINAL AMOUNT:</span>
                <span>₹{grandTotal.toFixed(0)}</span>
              </div>
            </div>

            <footer className="mt-10 pt-4 border-t border-dashed border-slate-300 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest">*** Thank you for your visit ***</p>
              <p className="text-[8px] text-slate-400 mt-1 italic">Generated via BillGen Pro PWA</p>
            </footer>
          </div>
        </div>
          
          <button 
            onClick={() => window.print()}
            className="mt-8 bg-white/10 text-white/50 px-4 py-2 rounded-lg text-[10px] font-bold uppercase border border-white/10"
          >
            Try System Print
          </button>
        </div>
      )}

      {/* Legacy Print View (Still here for window.print support) */}
      <div id="print-area">
        <div className="p-4 bg-white">
          <div className="text-center mb-6 border-b-2 border-slate-900 pb-4">
            <h1 className="text-2xl font-black uppercase tracking-tight">CASH MEMO</h1>
            <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-widest">Retail Billing System</p>
          </div>
          
          <div className="flex justify-between text-[10px] font-bold uppercase mb-4">
            <span>Date: {new Date().toLocaleDateString()}</span>
            <span>Time: {new Date().toLocaleTimeString()}</span>
          </div>

          <table className="w-full mb-6 border-collapse">
            <thead>
              <tr className="border-y border-slate-900 text-[10px] text-left uppercase">
                <th className="py-2">Item Name</th>
                <th className="py-2 text-center">Price</th>
                <th className="py-2 text-center">B OR L</th>
                <th className="py-2 text-center">Quantity</th>
                <th className="py-2 text-right">Line Amount</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {billItems.map(item => (
                <tr key={item.id} className="border-b border-slate-100 italic">
                  <td className="py-1.5 font-bold uppercase leading-none">{item.name}</td>
                  <td className="py-1.5 text-center">₹{item.price.toFixed(0)}</td>
                  <td className="py-1.5 text-center text-[10px] font-black uppercase">{item.typeLabel.substring(0,1)}</td>
                  <td className="py-1.5 text-center font-bold">{item.qty}</td>
                  <td className="py-1.5 text-right font-black">₹{item.total.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex flex-col items-end border-t-2 border-slate-900 pt-4 gap-1">
            <div className="flex justify-between w-full max-w-[150px] text-xs font-bold">
              <span>SUBTOTAL:</span>
              <span>₹{grandTotal.toFixed(0)}</span>
            </div>
            <div className="flex justify-between w-full max-w-[150px] text-lg font-black border-t border-slate-200 mt-1 pt-1">
              <span>FINAL AMOUNT:</span>
              <span>₹{grandTotal.toFixed(0)}</span>
            </div>
          </div>

          <footer className="mt-10 pt-4 border-t border-dashed border-slate-300 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest">*** Thank you for your visit ***</p>
            <p className="text-[8px] text-slate-400 mt-1 italic">Generated via BillGen Pro PWA</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
