import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Package, AlertTriangle, CheckCircle } from "lucide-react";

function DarkInput({ value, onChange, placeholder, type = "text", disabled }) {
    const [focused, setFocused] = useState(false);
    return (
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={`w-full bg-neutral-800 border text-neutral-100 text-sm font-mono px-3 py-2 focus:outline-none transition-colors placeholder:text-neutral-600 disabled:opacity-40 disabled:cursor-not-allowed ${focused ? "border-yellow-300/50" : "border-neutral-700 hover:border-neutral-600"
                }`}
        />
    );
}

function FieldLabel({ children }) {
    return <label className="block text-xs font-mono uppercase tracking-widest text-neutral-500 mb-1.5">{children}</label>;
}

function StockIndicator({ onHand, lowStockAt }) {
    if (onHand === 0) return (
        <span className="inline-flex items-center gap-1 text-xs font-mono text-red-400">
            <AlertTriangle className="h-3 w-3" /> Out
        </span>
    );
    if (onHand <= lowStockAt) return (
        <span className="inline-flex items-center gap-1 text-xs font-mono text-amber-400">
            <AlertTriangle className="h-3 w-3" /> Low
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1 text-xs font-mono text-emerald-400">
            <CheckCircle className="h-3 w-3" /> OK
        </span>
    );
}

export function InventoryManager({ inventoryJson, setInventoryJson, setIsDirty, disabled }) {
    const [inventory, setInventory] = useState([]);

    useEffect(() => {
        try {
            const parsed = JSON.parse(inventoryJson);
            setInventory(Array.isArray(parsed) ? parsed : []);
        } catch { setInventory([]); }
    }, [inventoryJson]);

    const updateJson = useCallback((newInventory) => {
        setInventoryJson(JSON.stringify(newInventory, null, 2));
        setIsDirty(true);
    }, [setInventoryJson, setIsDirty]);

    const addItem = () => {
        const items = [...inventory, { name: "", unit: "", onHand: 0, lowStockAt: 1 }];
        setInventory(items); updateJson(items);
    };

    const updateItem = (index, field, value) => {
        const items = inventory.map((item, i) =>
            i === index ? { ...item, [field]: field === "onHand" || field === "lowStockAt" ? parseInt(value) || 0 : value } : item
        );
        setInventory(items); updateJson(items);
    };

    const removeItem = (index) => {
        const items = inventory.filter((_, i) => i !== index);
        setInventory(items); updateJson(items);
    };

    return (
        <div className="space-y-4">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-xs font-mono uppercase tracking-widest text-neutral-500 mb-0.5">Stock</div>
                    <div className="text-sm font-semibold text-neutral-200">Inventory Items</div>
                    <p className="text-xs font-mono text-neutral-600 mt-0.5">
                        Track supplies and resources with low-stock alerts.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={addItem}
                    disabled={disabled}
                    className="flex items-center gap-1.5 bg-neutral-800 hover:bg-yellow-300/10 border border-neutral-700 hover:border-yellow-300/40 text-neutral-300 hover:text-yellow-300 text-xs font-mono uppercase tracking-widest px-3 py-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Plus className="h-3.5 w-3.5" /> Add Item
                </button>
            </div>

            {/* Empty state */}
            {inventory.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 bg-neutral-900 border border-dashed border-neutral-800 text-center">
                    <Package className="h-7 w-7 text-neutral-700 mb-3" />
                    <p className="text-xs font-mono text-neutral-600 uppercase tracking-widest mb-4">No inventory items yet</p>
                    <button
                        type="button"
                        onClick={addItem}
                        disabled={disabled}
                        className="flex items-center gap-1.5 bg-yellow-300 hover:bg-yellow-200 disabled:bg-neutral-700 disabled:text-neutral-500 text-neutral-950 font-bold text-xs font-mono uppercase tracking-widest px-4 py-2 transition-all disabled:cursor-not-allowed"
                    >
                        <Plus className="h-3.5 w-3.5" /> Add First Item
                    </button>
                </div>
            )}

            {/* Items list */}
            {inventory.length > 0 && (
                <div className="space-y-2">
                    {inventory.map((item, index) => {
                        const isLow = item.onHand <= item.lowStockAt;
                        return (
                            <div
                                key={index}
                                className={`bg-neutral-900 border transition-colors px-4 py-4 ${item.onHand === 0
                                    ? "border-red-500/20 hover:border-red-500/30"
                                    : isLow
                                        ? "border-amber-500/20 hover:border-amber-500/30"
                                        : "border-neutral-800 hover:border-neutral-700"
                                    }`}
                            >
                                {/* Row label + status */}
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-mono uppercase tracking-widest text-neutral-600">
                                        Item #{index + 1}
                                        {item.name && <span className="text-neutral-500 ml-2 normal-case">— {item.name}</span>}
                                    </span>
                                    <div className="flex items-center gap-3">
                                        {(item.name || item.onHand !== undefined) && (
                                            <StockIndicator onHand={item.onHand} lowStockAt={item.lowStockAt} />
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => removeItem(index)}
                                            disabled={disabled}
                                            className="flex items-center justify-center w-7 h-7 border border-neutral-700 hover:border-red-500/40 hover:bg-red-500/10 text-neutral-600 hover:text-red-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="md:col-span-1">
                                        <FieldLabel>Item Name</FieldLabel>
                                        <DarkInput
                                            value={item.name}
                                            onChange={(e) => updateItem(index, "name", e.target.value)}
                                            placeholder="e.g., Intake Kit"
                                            disabled={disabled}
                                        />
                                    </div>
                                    <div>
                                        <FieldLabel>Unit</FieldLabel>
                                        <DarkInput
                                            value={item.unit}
                                            onChange={(e) => updateItem(index, "unit", e.target.value)}
                                            placeholder="kit, sheet, box..."
                                            disabled={disabled}
                                        />
                                    </div>
                                    <div>
                                        <FieldLabel>On Hand</FieldLabel>
                                        <DarkInput
                                            type="number"
                                            value={item.onHand}
                                            onChange={(e) => updateItem(index, "onHand", e.target.value)}
                                            placeholder="0"
                                            disabled={disabled}
                                        />
                                    </div>
                                    <div>
                                        <FieldLabel>Low Stock Alert ≤</FieldLabel>
                                        <DarkInput
                                            type="number"
                                            value={item.lowStockAt}
                                            onChange={(e) => updateItem(index, "lowStockAt", e.target.value)}
                                            placeholder="1"
                                            disabled={disabled}
                                        />
                                    </div>
                                </div>

                                {/* Stock bar */}
                                {item.name && (
                                    <div className="mt-3">
                                        <div className="w-full h-0.5 bg-neutral-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${item.onHand === 0 ? "bg-red-400" :
                                                    isLow ? "bg-amber-400" : "bg-emerald-400"
                                                    }`}
                                                style={{
                                                    width: `${Math.min((item.onHand / Math.max(item.lowStockAt * 2, 1)) * 100, 100)}%`
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}