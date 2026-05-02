'use client';

import { useState } from 'react';
import { useCartStore } from '@/store/cart';
import type { ImagePrintOption, OrderItemType } from '@gallery/shared';
import { Modal } from '@/components/modal';

interface BuyModalImage {
  id: number;
  title: string;
  price: number;
  thumbnailPath: string;
  allowDownloadOriginal: boolean;
  printEnabled: boolean;
  printLimit: number | null;
  printsSold: number;
  perOptionLimits: boolean;
  printOptions: ImagePrintOption[];
  sizeWidthCm?: number | null;
  sizeHeightCm?: number | null;
  originalAvailable?: boolean;
}

interface BuyModalProps {
  open: boolean;
  onClose: () => void;
  image: BuyModalImage;
}

export function BuyModal({ open, onClose, image }: BuyModalProps) {
  const { addItem, items } = useCartStore();
  const [selectedSku, setSelectedSku] = useState<string>('');

  const originalInCart = items.some((i) => i.imageId === image.id && i.type === 'original');
  const physicalOriginalInCart = items.some(
    (i) => i.imageId === image.id && i.type === 'physical_original',
  );

  const selectedPrintOption = image.printOptions?.find((o) => o.sku === selectedSku);
  const printInCart = selectedSku
    ? items.some((i) => i.imageId === image.id && i.type === 'print' && i.printSku === selectedSku)
    : false;

  const remaining =
    !image.perOptionLimits && image.printLimit !== null
      ? image.printLimit - image.printsSold
      : null;
  const soldOut = remaining !== null && remaining <= 0;

  const selectedOptionSoldOut =
    image.perOptionLimits && selectedPrintOption
      ? selectedPrintOption.printLimit !== null &&
        selectedPrintOption.soldCount >= selectedPrintOption.printLimit
      : false;
  const selectedOptionRemaining =
    image.perOptionLimits && selectedPrintOption?.printLimit != null
      ? selectedPrintOption.printLimit - selectedPrintOption.soldCount
      : null;

  return (
    <Modal open={open} onClose={onClose} title="Purchase Options">
      <div className="flex flex-col gap-4">
        {/* Digital Original */}
        {image.allowDownloadOriginal && (
          <div className="p-4 border border-ot-line-soft rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-medium text-ot-ink">Digital Original</p>
                <p className="text-ot-mute text-sm">Full resolution download</p>
              </div>
              <p className="text-2xl font-light font-serif">${image.price}</p>
            </div>
            <button
              onClick={() =>
                addItem({
                  imageId: image.id,
                  title: image.title,
                  price: image.price,
                  thumbnailPath: image.thumbnailPath,
                  type: 'original' as OrderItemType,
                  printSku: null,
                  printDescription: null,
                })
              }
              disabled={originalInCart || Number(image.price) === 0}
              className="ot-btn ot-btn--solid w-full justify-center"
            >
              {originalInCart ? 'In Cart' : 'Add to Cart'}
            </button>
          </div>
        )}

        {/* Physical Original */}
        {image.originalAvailable && (
          <div className="p-4 border border-ot-line-soft rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-medium text-ot-ink">Physical Original</p>
                <p className="text-ot-mute text-sm">
                  Original artwork
                  {image.sizeWidthCm && image.sizeHeightCm && (
                    <>
                      {' '}
                      &mdash; {+(Number(image.sizeWidthCm) / 2.54).toFixed(1)}&times;
                      {+(Number(image.sizeHeightCm) / 2.54).toFixed(1)}&Prime;
                    </>
                  )}
                </p>
                <p className="text-ot-ochre text-xs mt-1">Shipping calculated at checkout</p>
              </div>
              <p className="text-2xl font-light font-serif">${image.price}</p>
            </div>
            <button
              onClick={() =>
                addItem({
                  imageId: image.id,
                  title: image.title,
                  price: image.price,
                  thumbnailPath: image.thumbnailPath,
                  type: 'physical_original' as OrderItemType,
                  printSku: null,
                  printDescription: null,
                })
              }
              disabled={physicalOriginalInCart || Number(image.price) === 0}
              className="ot-btn ot-btn--solid w-full justify-center"
            >
              {physicalOriginalInCart ? 'In Cart' : 'Add to Cart'}
            </button>
          </div>
        )}

        {/* Print Options */}
        {image.printEnabled && image.printOptions?.length > 0 && (
          <div className="p-4 border border-ot-line-soft rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-medium text-ot-ink">Buy Print</p>
                {remaining !== null && !soldOut && (
                  <p className="text-ot-ochre text-sm">
                    Limited edition &mdash; {remaining} of {image.printLimit} remaining
                  </p>
                )}
                {soldOut && <p className="text-ot-terra text-sm">Sold out</p>}
                {image.perOptionLimits &&
                  selectedOptionRemaining !== null &&
                  !selectedOptionSoldOut && (
                    <p className="text-ot-ochre text-sm">
                      Limited edition &mdash; {selectedOptionRemaining} remaining
                    </p>
                  )}
                {image.perOptionLimits && selectedOptionSoldOut && (
                  <p className="text-ot-terra text-sm">This option is sold out</p>
                )}
              </div>
              {selectedPrintOption && (
                <p className="text-2xl font-light font-serif">${selectedPrintOption.price}</p>
              )}
            </div>

            {!soldOut && (
              <>
                <select
                  value={selectedSku}
                  onChange={(e) => setSelectedSku(e.target.value)}
                  className="w-full mb-3 px-4 py-2.5 bg-transparent border border-ot-line rounded-lg text-ot-ink focus:outline-none focus:border-ot-ochre text-sm"
                >
                  <option value="">Select print size</option>
                  {image.printOptions.map((opt) => {
                    const optSoldOut =
                      image.perOptionLimits &&
                      opt.printLimit !== null &&
                      opt.soldCount >= opt.printLimit;
                    const optRemaining =
                      image.perOptionLimits && opt.printLimit !== null
                        ? opt.printLimit - opt.soldCount
                        : null;
                    return (
                      <option key={opt.sku} value={opt.sku} disabled={optSoldOut}>
                        {opt.description} &mdash; ${opt.price}
                        {optSoldOut ? ' (sold out)' : ''}
                        {optRemaining !== null && !optSoldOut ? ` (${optRemaining} left)` : ''}
                      </option>
                    );
                  })}
                </select>

                <button
                  onClick={() => {
                    if (!selectedPrintOption) return;
                    addItem({
                      imageId: image.id,
                      title: image.title,
                      price: selectedPrintOption.price,
                      thumbnailPath: image.thumbnailPath,
                      type: 'print' as OrderItemType,
                      printSku: selectedPrintOption.sku,
                      printDescription: selectedPrintOption.description,
                    });
                  }}
                  disabled={
                    !selectedSku ||
                    printInCart ||
                    selectedOptionSoldOut ||
                    Number(selectedPrintOption?.price) === 0
                  }
                  className="ot-btn ot-btn--ghost w-full justify-center"
                >
                  {printInCart ? 'In Cart' : 'Add Print to Cart'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
