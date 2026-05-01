'use client';

export interface PrintOptionRow {
  sku: string;
  description: string;
  price: number;
  widthCm: number;
  heightCm: number;
  mediaType: string;
  printLimit: number | null;
  soldCount: number;
}

interface AvailableSku {
  provider: string;
  sku: string;
  description: string;
  widthCm?: number;
  heightCm?: number;
  mediaType?: string;
}

const cmToInch = (cm: number) => (cm ? +(cm / 2.54).toFixed(2) : 0);
const inchToCm = (inch: number) => (inch ? +(inch * 2.54).toFixed(1) : 0);

interface PrintOptionsEditorProps {
  printOptions: PrintOptionRow[];
  setPrintOptions: React.Dispatch<React.SetStateAction<PrintOptionRow[]>>;
  availableSkus: AvailableSku[];
  perOptionLimits: boolean;
  setPerOptionLimits: (value: boolean) => void;
  printLimit: number | null;
  setPrintLimit: (value: number | null) => void;
  printsSold: number;
  showErrors: boolean;
  inputClass: string;
}

export function PrintOptionsEditor({
  printOptions,
  setPrintOptions,
  availableSkus,
  perOptionLimits,
  setPerOptionLimits,
  printLimit,
  setPrintLimit,
  printsSold,
  showErrors,
  inputClass,
}: PrintOptionsEditorProps) {
  function addPrintOption() {
    setPrintOptions((opts) => [
      ...opts,
      {
        sku: '',
        description: '',
        price: 0,
        widthCm: 0,
        heightCm: 0,
        mediaType: '',
        printLimit: null,
        soldCount: 0,
      },
    ]);
  }

  function updatePrintOption(index: number, field: string, value: string | number | null) {
    setPrintOptions((opts) =>
      opts.map((o, i) => {
        if (i !== index) return o;
        if (field === 'sku') {
          const catalog = availableSkus.find((s) => s.sku === value);
          return {
            ...o,
            sku: String(value),
            description: catalog?.description || o.description,
            ...(catalog?.widthCm != null ? { widthCm: catalog.widthCm } : {}),
            ...(catalog?.heightCm != null ? { heightCm: catalog.heightCm } : {}),
            ...(catalog?.mediaType ? { mediaType: catalog.mediaType } : {}),
          };
        }
        return { ...o, [field]: value };
      }),
    );
  }

  function removePrintOption(index: number) {
    setPrintOptions((opts) => opts.filter((_, i) => i !== index));
  }

  return (
    <div className="border border-white/10 rounded-lg p-4 space-y-3">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={perOptionLimits}
          onChange={(e) => setPerOptionLimits(e.target.checked)}
          className="accent-gallery-accent"
        />
        Track limits per print option
      </label>

      {!perOptionLimits && (
        <>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gallery-gray whitespace-nowrap">Print Limit</label>
            <input
              value={printLimit ?? ''}
              onChange={(e) => setPrintLimit(e.target.value ? +e.target.value : null)}
              type="number"
              placeholder="Unlimited"
              className={`${inputClass} flex-1`}
            />
          </div>
          {printLimit !== null && (
            <p className="text-xs text-gallery-gray">
              Prints sold: {printsSold} / {printLimit}
            </p>
          )}
        </>
      )}

      <div className="space-y-2">
        <label className="text-xs text-gallery-gray">Print Options</label>
        {printOptions.map((opt, idx) => {
          const catalogSku = availableSkus.find((s) => s.sku === opt.sku);
          const dimsLocked = catalogSku?.widthCm != null && catalogSku?.heightCm != null;
          return (
            <div key={idx} className="border border-white/5 rounded p-2 space-y-1.5">
              <div className="flex gap-1.5 items-center">
                <select
                  value={opt.sku}
                  onChange={(e) => updatePrintOption(idx, 'sku', e.target.value)}
                  required
                  className={`${inputClass} flex-[2] ${showErrors && !opt.sku ? '!border-red-500' : ''}`}
                >
                  <option value="">Select SKU *</option>
                  {availableSkus.map((s) => (
                    <option key={`${s.provider}-${s.sku}`} value={s.sku}>
                      {s.description} ({s.sku})
                    </option>
                  ))}
                </select>
                <input
                  value={opt.price || ''}
                  onChange={(e) => updatePrintOption(idx, 'price', +e.target.value)}
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  className={`${inputClass} flex-1`}
                />
                <button
                  onClick={() => removePrintOption(idx)}
                  aria-label="Remove print option"
                  className="text-red-400 text-xs hover:text-red-300 px-1"
                >
                  &times;
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  value={opt.widthCm || ''}
                  onChange={(e) => updatePrintOption(idx, 'widthCm', +e.target.value)}
                  type="number"
                  step="0.1"
                  placeholder="W cm"
                  readOnly={dimsLocked}
                  className={`${inputClass} ${dimsLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                <input
                  value={opt.heightCm || ''}
                  onChange={(e) => updatePrintOption(idx, 'heightCm', +e.target.value)}
                  type="number"
                  step="0.1"
                  placeholder="H cm"
                  readOnly={dimsLocked}
                  className={`${inputClass} ${dimsLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                <input
                  value={opt.widthCm ? cmToInch(opt.widthCm) : ''}
                  onChange={(e) => updatePrintOption(idx, 'widthCm', inchToCm(+e.target.value))}
                  type="number"
                  step="0.01"
                  placeholder="W in"
                  readOnly={dimsLocked}
                  className={`${inputClass} ${dimsLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                <input
                  value={opt.heightCm ? cmToInch(opt.heightCm) : ''}
                  onChange={(e) => updatePrintOption(idx, 'heightCm', inchToCm(+e.target.value))}
                  type="number"
                  step="0.01"
                  placeholder="H in"
                  readOnly={dimsLocked}
                  className={`${inputClass} ${dimsLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>
              {opt.mediaType && (
                <div className="text-xs text-gallery-gray">Media: {opt.mediaType}</div>
              )}
              {perOptionLimits && (
                <div className="flex gap-1.5 items-center">
                  <input
                    value={opt.printLimit ?? ''}
                    onChange={(e) =>
                      updatePrintOption(idx, 'printLimit', e.target.value ? +e.target.value : null)
                    }
                    type="number"
                    placeholder="Limit"
                    className={`${inputClass} w-20`}
                  />
                  {opt.printLimit !== null && (
                    <span className="text-xs text-gallery-gray whitespace-nowrap">
                      {opt.soldCount} sold
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
        <button onClick={addPrintOption} className="text-xs text-gallery-accent hover:underline">
          + Add print option
        </button>
      </div>
    </div>
  );
}
