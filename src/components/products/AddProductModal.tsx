'use client';

import { useState, useMemo } from 'react';
import {
  CATEGORIES,
  getCategory,
  getConditions,
  getModels,
  type CategoryConfig,
  type AttributeConfig,
} from '@/lib/product-data';

type TabType = 'smart' | 'ai' | 'templates';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedProduct {
  category: string;
  brand: string;
  model: string;
  attributes: Record<string, string>;
  condition: string;
  price: number;
}

export default function AddProductModal({
  isOpen,
  onClose,
  onSuccess,
}: AddProductModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('smart');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Category selection
  const [categoryId, setCategoryId] = useState('');

  // Smart Form state
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [attributes, setAttributes] = useState<Record<string, string>>({});
  const [condition, setCondition] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');

  // AI Input state
  const [aiText, setAiText] = useState('');
  const [parsedProduct, setParsedProduct] = useState<ParsedProduct | null>(null);
  const [parsing, setParsing] = useState(false);

  // Template state
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [templateCondition, setTemplateCondition] = useState('excellent');
  const [templatePrice, setTemplatePrice] = useState('');
  const [templateQuantity, setTemplateQuantity] = useState('1');
  const [templateAttributes, setTemplateAttributes] = useState<Record<string, string>>({});

  // Get current category config
  const category = useMemo(() => getCategory(categoryId), [categoryId]);
  const conditions = useMemo(() => getConditions(categoryId), [categoryId]);
  const availableModels = useMemo(
    () => (category?.hasModels ? getModels(categoryId, brand) : []),
    [category, categoryId, brand]
  );

  const resetForm = () => {
    setCategoryId('');
    setBrand('');
    setModel('');
    setCustomModel('');
    setAttributes({});
    setCondition('');
    setPrice('');
    setQuantity('1');
    setAiText('');
    setParsedProduct(null);
    setSelectedTemplate(null);
    setTemplateCondition('excellent');
    setTemplatePrice('');
    setTemplateQuantity('1');
    setTemplateAttributes({});
    setError('');
    setSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCategoryChange = (newCategoryId: string) => {
    setCategoryId(newCategoryId);
    setBrand('');
    setModel('');
    setCustomModel('');
    setAttributes({});
    setCondition('');
    setSelectedTemplate(null);
    setTemplateAttributes({});
  };

  const handleBrandChange = (newBrand: string) => {
    setBrand(newBrand);
    setModel('');
    setCustomModel('');
  };

  const handleAttributeChange = (key: string, value: string) => {
    setAttributes((prev) => ({ ...prev, [key]: value }));
  };

  const handleTemplateAttributeChange = (key: string, value: string) => {
    setTemplateAttributes((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (productData: {
    category: string;
    brand: string;
    model: string;
    attributes: Record<string, string>;
    condition: string;
    price: number;
    quantity: number;
  }) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create product');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  const handleSmartFormSubmit = () => {
    if (!categoryId || !brand || !condition || !price) {
      setError('Please fill in all required fields');
      return;
    }

    // Check required attributes
    const missingRequired = category?.attributes
      .filter((attr) => attr.required)
      .find((attr) => !attributes[attr.key]);

    if (missingRequired) {
      setError(`Please select ${missingRequired.label}`);
      return;
    }

    const finalModel = model === '__other__' ? customModel : model;

    handleSubmit({
      category: categoryId,
      brand,
      model: finalModel,
      attributes,
      condition,
      price: parseFloat(price),
      quantity: parseInt(quantity) || 1,
    });
  };

  const handleAIParse = async () => {
    if (!aiText.trim()) {
      setError('Please enter a product description');
      return;
    }

    setParsing(true);
    setError('');

    try {
      const response = await fetch('/api/products/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiText }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to parse');
      }

      setParsedProduct(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse product');
    } finally {
      setParsing(false);
    }
  };

  const handleAISubmit = () => {
    if (!parsedProduct) return;
    handleSubmit({
      ...parsedProduct,
      quantity: 1,
    });
  };

  const handleTemplateSubmit = () => {
    if (selectedTemplate === null || !templatePrice || !category) {
      setError('Please select a template and enter a price');
      return;
    }
    const template = category.templates[selectedTemplate];

    // Merge template attributes with user customizations
    const finalAttributes = { ...template.attributes, ...templateAttributes };

    handleSubmit({
      category: categoryId,
      brand: template.brand,
      model: template.name,
      attributes: finalAttributes,
      condition: templateCondition,
      price: parseFloat(templatePrice),
      quantity: parseInt(templateQuantity) || 1,
    });
  };

  // Render attribute input based on type
  const renderAttributeInput = (
    attr: AttributeConfig,
    value: string,
    onChange: (key: string, value: string) => void
  ) => {
    if (attr.type === 'select' && attr.options) {
      return (
        <select
          value={value}
          onChange={(e) => onChange(attr.key, e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background"
        >
          <option value="">Select {attr.label}...</option>
          {attr.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    if (attr.type === 'number') {
      return (
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(attr.key, e.target.value)}
          placeholder={attr.placeholder}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background"
        />
      );
    }

    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(attr.key, e.target.value)}
        placeholder={attr.placeholder}
        className="w-full px-3 py-2 rounded-lg border border-border bg-background"
      />
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg border border-border w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Add Product</h2>
              <p className="text-sm text-muted-foreground">
                {category ? `Adding to ${category.name}` : 'Select a category to get started'}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground text-xl"
            >
              ✕
            </button>
          </div>

          {/* Category Selector */}
          {!success && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      categoryId === cat.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tabs - only show after category selected */}
          {category && !success && (
            <div className="flex gap-2 mt-4">
              {[
                { id: 'smart' as const, label: 'Smart Form', icon: '📝' },
                { id: 'ai' as const, label: 'AI Input', icon: '🤖' },
                ...(category.templates.length > 0
                  ? [{ id: 'templates' as const, label: 'Templates', icon: '📋' }]
                  : []),
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setError('');
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {success ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-lg font-semibold">Product Added!</h3>
              <p className="text-muted-foreground">
                Your product has been added to the catalog.
              </p>
            </div>
          ) : !category ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="text-4xl mb-4">👆</div>
              <p>Select a category above to start adding a product</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
                  {error}
                </div>
              )}

              {/* Smart Form Tab */}
              {activeTab === 'smart' && (
                <div className="space-y-4">
                  {/* Brand */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Brand</label>
                    <select
                      value={brand}
                      onChange={(e) => handleBrandChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                    >
                      <option value="">Select brand...</option>
                      {category.brands.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Model (if category has models) */}
                  {category.hasModels && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Model</label>
                      <select
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        disabled={!brand}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background disabled:opacity-50"
                      >
                        <option value="">Select model...</option>
                        {availableModels.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                        <option value="__other__">Other (type manually)</option>
                      </select>
                      {model === '__other__' && (
                        <input
                          type="text"
                          placeholder="Enter model name..."
                          value={customModel}
                          onChange={(e) => setCustomModel(e.target.value)}
                          className="w-full mt-2 px-3 py-2 rounded-lg border border-border bg-background"
                        />
                      )}
                    </div>
                  )}

                  {/* Category-specific attributes */}
                  <div className="grid grid-cols-2 gap-4">
                    {category.attributes.map((attr) => (
                      <div key={attr.key}>
                        <label className="block text-sm font-medium mb-2">
                          {attr.label}
                          {attr.required && <span className="text-error">*</span>}
                        </label>
                        {renderAttributeInput(
                          attr,
                          attributes[attr.key] || '',
                          handleAttributeChange
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Condition */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Condition</label>
                    <div className="grid grid-cols-5 gap-2">
                      {conditions.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setCondition(c.value)}
                          className={`p-3 rounded-lg border text-center transition-colors ${
                            condition === c.value
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:bg-muted'
                          }`}
                        >
                          <div className="text-xl">{c.emoji}</div>
                          <div className="text-xs font-medium mt-1">{c.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price & Quantity */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Price (AED)</label>
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Quantity</label>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        min="1"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* AI Input Tab */}
              {activeTab === 'ai' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Describe the product
                    </label>
                    <textarea
                      value={aiText}
                      onChange={(e) => setAiText(e.target.value)}
                      placeholder={`Example: ${category.icon} ${category.name === 'Mobile Phones' ? 'iPhone 15 Pro Max 256GB Black Excellent condition AED 3500' : 'Describe your product with brand, model, specs, condition, and price'}`}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background resize-none"
                    />
                  </div>

                  <button
                    onClick={handleAIParse}
                    disabled={parsing || !aiText.trim()}
                    className="w-full py-2 rounded-lg bg-muted hover:bg-muted/80 font-medium disabled:opacity-50"
                  >
                    {parsing ? 'Parsing...' : '🔍 Parse Description'}
                  </button>

                  {parsedProduct && (
                    <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <span>✅</span> Parsed Result
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Category:</span>{' '}
                          {parsedProduct.category}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Brand:</span>{' '}
                          {parsedProduct.brand}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Model:</span>{' '}
                          {parsedProduct.model}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Condition:</span>{' '}
                          {parsedProduct.condition}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Price:</span> AED{' '}
                          {parsedProduct.price}
                        </div>
                        {Object.entries(parsedProduct.attributes).map(([key, value]) => (
                          <div key={key}>
                            <span className="text-muted-foreground capitalize">{key}:</span>{' '}
                            {value}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Templates Tab */}
              {activeTab === 'templates' && category.templates.length > 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {category.templates.map((template, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedTemplate(idx);
                          setTemplatePrice(template.suggestedPrice.toString());
                          setTemplateAttributes({});
                        }}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          selectedTemplate === idx
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:bg-muted'
                        }`}
                      >
                        <div className="text-2xl mb-1">{category.icon}</div>
                        <div className="font-medium text-sm">{template.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {template.brand}
                        </div>
                        <div className="text-xs text-primary mt-1">
                          ~AED {template.suggestedPrice}
                        </div>
                      </button>
                    ))}
                  </div>

                  {selectedTemplate !== null && (
                    <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                      <h4 className="font-medium">Customize</h4>

                      {/* Editable attributes from template */}
                      <div className="grid grid-cols-2 gap-4">
                        {category.attributes.slice(0, 4).map((attr) => (
                          <div key={attr.key}>
                            <label className="block text-sm font-medium mb-2">
                              {attr.label}
                            </label>
                            {renderAttributeInput(
                              attr,
                              templateAttributes[attr.key] ||
                                category.templates[selectedTemplate].attributes[attr.key] ||
                                '',
                              handleTemplateAttributeChange
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Condition</label>
                          <select
                            value={templateCondition}
                            onChange={(e) => setTemplateCondition(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                          >
                            {conditions.map((c) => (
                              <option key={c.value} value={c.value}>
                                {c.emoji} {c.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Price (AED)</label>
                          <input
                            type="number"
                            value={templatePrice}
                            onChange={(e) => setTemplatePrice(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Quantity</label>
                          <input
                            type="number"
                            value={templateQuantity}
                            onChange={(e) => setTemplateQuantity(e.target.value)}
                            min="1"
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!success && category && (
          <div className="p-6 border-t border-border flex gap-4">
            <button
              onClick={handleClose}
              className="flex-1 rounded-lg border border-border px-4 py-2 font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (activeTab === 'smart') handleSmartFormSubmit();
                else if (activeTab === 'ai') handleAISubmit();
                else if (activeTab === 'templates') handleTemplateSubmit();
              }}
              disabled={
                loading ||
                (activeTab === 'ai' && !parsedProduct) ||
                (activeTab === 'templates' && selectedTemplate === null)
              }
              className="flex-1 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Product'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
